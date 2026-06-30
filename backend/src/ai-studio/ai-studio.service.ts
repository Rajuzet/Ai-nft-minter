import { Injectable, InternalServerErrorException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { StorageService } from '../storage/storage.service';
import * as crypto from 'crypto';

@Injectable()
export class AiStudioService implements OnModuleInit {
  private bedrockClient: BedrockRuntimeClient;
  private awsRegion: string;
  private s3BucketName: string;

  constructor(private readonly storageService: StorageService) {}

  onModuleInit() {
    this.awsRegion = process.env.AWS_REGION || 'us-east-1';
    this.s3BucketName = process.env.S3_BUCKET_NAME;
    this.bedrockClient = new BedrockRuntimeClient({ region: this.awsRegion });
  }

  private async streamToString(stream: any): Promise<string> {
    const chunks: any[] = [];
    for await (const chunk of stream) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks).toString('utf-8');
  }

  async generateArt(
    prompt: string, 
    storage: 's3' | 'ipfs' = 's3'
  ): Promise<{ metadataUrl: string; imageUrl: string; metadata: any }> {
    if (!prompt || typeof prompt !== 'string') {
      throw new BadRequestException('A valid prompt string is required.');
    }

    if (storage === 's3' && !this.s3BucketName) {
      throw new InternalServerErrorException('AWS S3 bucket configuration is missing on the server.');
    }

    try {
      // 1. Invoke Bedrock Titan Image Generator
      const command = new InvokeModelCommand({
        modelId: 'amazon.titan-image-generator-v2:0',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          inputText: prompt,
          imageGenerationConfig: {
            size: { width: 1024, height: 1024 },
            quality: 'premium',
          },
        }),
      });

      const result = await this.bedrockClient.send(command);
      const responseBody = await this.streamToString(result.body);
      const payload = JSON.parse(responseBody);

      const imagePayload = payload?.outputs?.[0]?.content?.[0]?.image?.data
        || payload?.image
        || payload?.imageBase64
        || payload?.image_url;

      if (!imagePayload) {
        throw new InternalServerErrorException('No image data returned from Bedrock model.');
      }

      // 2. Build Image Buffer
      let imageBuffer: Buffer;
      if (typeof imagePayload === 'string') {
        imageBuffer = Buffer.from(imagePayload, 'base64');
      } else if (Array.isArray(imagePayload)) {
        imageBuffer = Buffer.from(imagePayload);
      } else {
        throw new InternalServerErrorException('Unsupported image payload format from Bedrock.');
      }

      // 3. Upload Image to selected storage driver
      let imageUrl: string;
      const imageKey = `art/${Date.now()}-${crypto.randomUUID()}.png`;

      if (storage === 'ipfs') {
        imageUrl = await this.storageService.uploadToIpfs(imageBuffer, `${Date.now()}-artwork.png`);
      } else {
        imageUrl = await this.storageService.uploadToS3(imageBuffer, imageKey, 'image/png');
      }

      // 4. Assemble ERC-721 Metadata
      const metadata = {
        name: `AI Studio Collective Artwork #${Date.now()}`,
        description: 'Institutional-grade AI-generated NFT art generated from a secure prompt.',
        image: imageUrl,
        attributes: [
          { trait_type: 'Generation Engine', value: 'amazon.titan-image-generator-v2:0' },
          { trait_type: 'Prompt', value: prompt },
          { trait_type: 'Storage Type', value: storage.toUpperCase() }
        ],
      };

      // 5. Upload Metadata to selected storage driver
      let metadataUrl: string;
      const metadataKey = `metadata/${Date.now()}-${crypto.randomUUID()}.json`;

      if (storage === 'ipfs') {
        const metadataBuffer = Buffer.from(JSON.stringify(metadata));
        metadataUrl = await this.storageService.uploadToIpfs(metadataBuffer, `${Date.now()}-metadata.json`);
      } else {
        const metadataBuffer = Buffer.from(JSON.stringify(metadata));
        metadataUrl = await this.storageService.uploadToS3(metadataBuffer, metadataKey, 'application/json');
      }

      return {
        metadataUrl,
        imageUrl,
        metadata,
      };
    } catch (error: any) {
      console.error('generateArt error:', error);
      throw new InternalServerErrorException(
        error.message ? `Failed to generate art: ${error.message}` : 'Failed to generate art and upload metadata.'
      );
    }
  }
}
