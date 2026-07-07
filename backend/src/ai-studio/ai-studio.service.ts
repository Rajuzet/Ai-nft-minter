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
    storage: 's3' | 'ipfs' | 'gcs' = 'ipfs',
    customMetadata?: CustomMetadataDto,
    walletAddress?: string
  ): Promise<{ metadataUrl: string; imageUrl: string; metadata: any; assetId?: string; gatewayUrl?: string }> {
    if (!prompt || typeof prompt !== 'string') {
      throw new BadRequestException('A valid prompt string is required.');
    }

    try {
      const filenameBase = `${Date.now()}-${crypto.randomUUID().substring(0, 8)}`;
      const imageFilename = `${filenameBase}.png`;
      const metadataFilename = `${filenameBase}.json`;

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

      let imageUrl: string;
      let metadataUrl: string;
      let gatewayUrl: string | undefined;
      let metadata: any;

      if (storage === 'ipfs') {
        // SVG pattern buffer for demonstration fallback
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500"><rect width="100%" height="100%" fill="#0f172a"/><circle cx="250" cy="250" r="180" fill="#06b6d4" opacity="0.8"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="24">${metadataName}</text></svg>`;
        const imageRes = await this.storageService.uploadImageToIPFS(Buffer.from(svgContent), imageFilename, 'image/svg+xml');

        imageUrl = imageRes.ipfsUrl;
        gatewayUrl = imageRes.gatewayUrl;

        metadata = this.storageService.createNFTMetadata(
          metadataName,
          metadataDesc,
          imageRes.ipfsUrl,
          formattedAttributes,
          metadataExternalUrl,
          {
            seller_fee_basis_points: metadataRoyalty * 100,
            properties: {
              category: metadataCategory,
              unlockable_content: metadataUnlockable
            }
          }
        );

        const metaRes = await this.storageService.uploadMetadataToIPFS(metadata, metadataFilename);
        metadataUrl = metaRes.ipfsUrl;
      } else {
        imageUrl = await this.storageService.uploadImage(Buffer.from(''), imageFilename, 'image/png');
        metadata = {
          name: metadataName,
          description: metadataDesc,
          image: imageUrl,
          external_url: metadataExternalUrl,
          seller_fee_basis_points: metadataRoyalty * 100,
          attributes: formattedAttributes,
          properties: {
            category: metadataCategory,
            unlockable_content: metadataUnlockable
          }
        };
        metadataUrl = await this.storageService.uploadMetadata(metadata, metadataFilename);
      }

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
              imageUrl: gatewayUrl || imageUrl,
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
        imageUrl: gatewayUrl || imageUrl,
        metadata,
        assetId,
        gatewayUrl,
      };
    } catch (error: any) {
      console.error('generateArt error:', error);
      throw new InternalServerErrorException(
        error.message ? `Failed to generate art: ${error.message}` : 'Failed to generate art and upload metadata.'
      );
    }
  }
}
