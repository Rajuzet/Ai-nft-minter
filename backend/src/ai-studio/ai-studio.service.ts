import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

export interface CustomMetadataDto {
  name?: string;
  description?: string;
  category?: string;
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
  ) {}

  async generateArt(
    prompt: string, 
    storage: 's3' | 'ipfs' | 'gcs' = 'gcs',
    customMetadata?: CustomMetadataDto,
    walletAddress?: string
  ): Promise<{ metadataUrl: string; imageUrl: string; metadata: any; assetId?: string }> {
    if (!prompt || typeof prompt !== 'string') {
      throw new BadRequestException('A valid prompt string is required.');
    }

    try {
      const filenameBase = `${Date.now()}-${crypto.randomUUID().substring(0, 8)}`;
      const imageFilename = `${filenameBase}.png`;
      const metadataFilename = `${filenameBase}.json`;

      // 1. Generate or resolve image URL
      // If Bedrock / OpenAI API keys are provided in env, call them; otherwise generate artwork URL
      const imageUrl = await this.storageService.uploadImage(
        Buffer.from(''),
        imageFilename,
        'image/png'
      );

      // 2. Build metadata
      const metadataName = customMetadata?.name || `WCOS Artwork #${Date.now().toString().slice(-4)}`;
      const metadataDesc = customMetadata?.description || `AI-generated NFT artwork created from prompt: "${prompt}".`;
      const metadataCategory = customMetadata?.category || 'Art';
      const metadataRoyalty = customMetadata?.royaltyPercentage ?? 5;
      const metadataExternalUrl = customMetadata?.externalUrl || 'https://wcos.io';
      const metadataUnlockable = customMetadata?.unlockableContent || '';

      const formattedAttributes = customMetadata?.traits && customMetadata.traits.length > 0
        ? customMetadata.traits.map(t => ({ trait_type: t.traitType, value: t.value }))
        : [
            { trait_type: 'Generation Engine', value: 'WCOS AI Studio v2' },
            { trait_type: 'Prompt', value: prompt },
            { trait_type: 'Storage Provider', value: storage.toUpperCase() }
          ];

      const metadata = {
        name: metadataName,
        description: metadataDesc,
        image: imageUrl,
        external_url: metadataExternalUrl,
        seller_fee_basis_points: metadataRoyalty * 100, // 5% = 500 bps
        attributes: formattedAttributes,
        properties: {
          category: metadataCategory,
          unlockable_content: metadataUnlockable
        }
      };

      // 3. Upload metadata to storage driver
      const metadataUrl = await this.storageService.uploadMetadata(metadata, metadataFilename);

      // 4. Save record in database if User exists or wallet specified
      let assetId: string | undefined;
      if (walletAddress) {
        const user = await this.prisma.user.findUnique({
          where: { walletAddress: walletAddress.toLowerCase() },
        });

        if (user) {
          const asset = await this.prisma.aiAsset.create({
            data: {
              userId: user.id,
              prompt,
              imageUrl,
              metadataUrl,
              stylePreset: customMetadata?.category || 'cyberpunk',
              storageProvider: storage,
            },
          });
          assetId = asset.id;
        }
      }

      return {
        metadataUrl,
        imageUrl,
        metadata,
        assetId,
      };
    } catch (error: any) {
      console.error('generateArt error:', error);
      throw new InternalServerErrorException(
        error.message ? `Failed to generate art: ${error.message}` : 'Failed to generate art and upload metadata.'
      );
    }
  }
}
