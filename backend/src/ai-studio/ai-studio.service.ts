import { Injectable, InternalServerErrorException, BadRequestException, NotFoundException } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { OpenAiProvider } from './providers/openai.provider';
import { GenerateImageRequest } from './providers/ai-provider.interface';
import * as crypto from 'crypto';

export interface CustomMetadataDto {
  name?: string;
  description?: string;
  category?: string;
  style?: string;
  traits?: Array<{ traitType: string; value: string }>;
  royaltyPercentage?: number;
  externalUrl?: string;
  unlockableContent?: string;
}

@Injectable()
export class AiStudioService {
  constructor(
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
    private readonly aiProvider: OpenAiProvider,
  ) {}

  async enhancePrompt(prompt: string, style?: string): Promise<string> {
    if (!prompt) throw new BadRequestException('Prompt is required.');
    return this.aiProvider.enhancePrompt(prompt, style);
  }

  async generateArt(
    request: GenerateImageRequest,
    customMetadata?: CustomMetadataDto,
    walletAddress?: string
  ): Promise<any> {
    if (!request.prompt || typeof request.prompt !== 'string') {
      throw new BadRequestException('A valid prompt string is required.');
    }

    let user;
    if (walletAddress) {
      user = await this.prisma.user.findUnique({
        where: { walletAddress: walletAddress.toLowerCase() },
      });
      if (!user) {
         throw new BadRequestException('User not found for the provided wallet address.');
      }
    } else {
        throw new BadRequestException('Wallet address is required to track AI assets.');
    }

    // 1. Create initial QUEUED record
    const asset = await this.prisma.aiAsset.create({
      data: {
        userId: user.id,
        walletAddress: user.walletAddress,
        name: customMetadata?.name || `Generated NFT`,
        originalPrompt: request.prompt,
        negativePrompt: request.negativePrompt,
        style: request.style,
        category: request.category,
        generationSettings: JSON.stringify(request),
        status: 'QUEUED',
      },
    });

    // 2. We trigger the generation asynchronously so we don't block, but wait, the frontend might wait for this API.
    // If we want asynchronous handling, we should return the asset ID here and do the rest in the background.
    // The requirement says: "Frontend must not freeze while generation is running. Use: request status, job identifier, polling..."
    
    // We will start it in the background and return the generation ID
    this.processGeneration(asset.id, request, customMetadata).catch(err => {
      console.error(`Background generation failed for asset ${asset.id}:`, err);
    });

    return {
      success: true,
      assetId: asset.id,
      status: 'QUEUED',
      message: 'Generation started in the background.'
    };
  }

  private async processGeneration(assetId: string, request: GenerateImageRequest, customMetadata?: CustomMetadataDto) {
    try {
      await this.prisma.aiAsset.update({
        where: { id: assetId },
        data: { status: 'GENERATING' }
      });

      // 1. Generate Image
      const generated = await this.aiProvider.generateImage(request);

      if (!generated.imageBuffer) {
        throw new Error('No image buffer returned from AI Provider.');
      }

      await this.prisma.aiAsset.update({
        where: { id: assetId },
        data: { 
          status: 'UPLOADING',
          finalPrompt: generated.finalPrompt,
          provider: generated.provider,
          model: generated.model,
          seed: generated.seed,
        }
      });

      // 2. Hash and details
      const imageHash = crypto.createHash('sha256').update(generated.imageBuffer).digest('hex');
      const fileSize = generated.imageBuffer.length;
      
      const filenameBase = `${Date.now()}-${crypto.randomUUID().substring(0, 8)}`;
      const imageFilename = `${filenameBase}.png`;
      const metadataFilename = `${filenameBase}.json`;

      // 3. Upload Image to IPFS
      const imageRes = await this.storageService.uploadImageToIPFS(generated.imageBuffer, imageFilename, generated.mimeType);
      
      const metadataName = customMetadata?.name || `WCOS Artwork #${Date.now().toString().slice(-4)}`;
      const metadataDesc = customMetadata?.description || `AI-generated NFT artwork created from prompt: "${request.prompt}".`;
      const metadataRoyalty = customMetadata?.royaltyPercentage ?? 5;
      const metadataExternalUrl = customMetadata?.externalUrl || 'https://wcos.io';

      const formattedAttributes = customMetadata?.traits && customMetadata.traits.length > 0
        ? customMetadata.traits.map(t => ({ trait_type: t.traitType, value: t.value }))
        : [
            { trait_type: 'Generation Engine', value: generated.provider },
            { trait_type: 'Model', value: generated.model },
            { trait_type: 'Style', value: request.style || 'None' },
            { trait_type: 'Category', value: request.category || 'None' }
          ];

      // 4. Create and Upload Metadata
      const metadata = this.storageService.createNFTMetadata(
        metadataName,
        metadataDesc,
        imageRes.ipfsUrl,
        formattedAttributes,
        metadataExternalUrl,
        {
          seller_fee_basis_points: metadataRoyalty * 100,
          properties: {
            creator: customMetadata?.name,
            generationId: assetId,
            originalPrompt: request.prompt,
            finalPrompt: generated.finalPrompt,
            aiProvider: generated.provider,
            aiModel: generated.model,
            imageHash: imageHash,
            createdAt: new Date().toISOString()
          }
        }
      );

      const metaRes = await this.storageService.uploadMetadataToIPFS(metadata, metadataFilename);

      // 5. Update Record
      await this.prisma.aiAsset.update({
        where: { id: assetId },
        data: {
          status: 'READY',
          imageUrl: imageRes.gatewayUrl,
          imageUri: imageRes.ipfsUrl,
          metadataUri: metaRes.ipfsUrl,
          imageHash: imageHash,
          mimeType: generated.mimeType,
          fileSize: fileSize,
          // width and height would require image processing library like sharp to determine, we omit for now or default
          width: request.aspectRatio === '16:9' ? 1792 : 1024,
          height: request.aspectRatio === '9:16' ? 1792 : 1024,
        }
      });

    } catch (error: any) {
      await this.prisma.aiAsset.update({
        where: { id: assetId },
        data: {
          status: 'FAILED',
          errorMessage: error.message || 'Unknown generation error'
        }
      });
    }
  }

  async getGenerationStatus(assetId: string) {
    const asset = await this.prisma.aiAsset.findUnique({
      where: { id: assetId }
    });
    if (!asset) {
      throw new NotFoundException('Generation not found');
    }
    return asset;
  }

  async getUserHistory(walletAddress: string, page = 1, limit = 10, status?: string) {
    const skip = (page - 1) * limit;
    
    const where: any = { walletAddress: walletAddress.toLowerCase() };
    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      this.prisma.aiAsset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.aiAsset.count({ where })
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async deleteDraft(assetId: string, walletAddress: string) {
    const asset = await this.prisma.aiAsset.findUnique({ where: { id: assetId }});
    if (!asset) throw new NotFoundException('Asset not found');
    if (asset.walletAddress !== walletAddress.toLowerCase()) throw new BadRequestException('Unauthorized');
    if (asset.status === 'MINTED') throw new BadRequestException('Cannot delete minted asset');

    await this.prisma.aiAsset.delete({ where: { id: assetId } });
    return { success: true };
  }
}
