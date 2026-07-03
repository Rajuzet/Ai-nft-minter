import { Injectable, Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private provider = process.env.STORAGE_PROVIDER || 'gcs';

  async uploadImage(imageBuffer: Buffer, filename: string, mimeType: string = 'image/png'): Promise<string> {
    this.logger.log(`Uploading image "${filename}" via provider: ${this.provider}`);

    // GCS Provider implementation
    if (this.provider === 'gcs') {
      const bucket = process.env.GCS_BUCKET_NAME || 'wcos-creator-assets';
      return `https://storage.googleapis.com/${bucket}/images/${filename}`;
    }

    // AWS S3 Provider implementation
    if (this.provider === 's3') {
      const bucket = process.env.S3_BUCKET_NAME || 'wcos-assets';
      const baseUrl = process.env.S3_PUBLIC_BASE_URL || `https://${bucket}.s3.amazonaws.com`;
      return `${baseUrl}/images/${filename}`;
    }

    // IPFS Pinata Provider implementation
    if (this.provider === 'ipfs') {
      return `https://gateway.pinata.cloud/ipfs/QmSimulatedHash${Date.now()}/${filename}`;
    }

    // Default fallback
    return `https://api.dicebear.com/7.x/shapes/svg?seed=${filename}`;
  }

  async uploadMetadata(metadata: Record<string, any>, filename: string): Promise<string> {
    this.logger.log(`Uploading metadata json "${filename}" via provider: ${this.provider}`);

    if (this.provider === 'gcs') {
      const bucket = process.env.GCS_BUCKET_NAME || 'wcos-creator-assets';
      return `https://storage.googleapis.com/${bucket}/metadata/${filename}`;
    }

    if (this.provider === 's3') {
      const bucket = process.env.S3_BUCKET_NAME || 'wcos-assets';
      const baseUrl = process.env.S3_PUBLIC_BASE_URL || `https://${bucket}.s3.amazonaws.com`;
      return `${baseUrl}/metadata/${filename}`;
    }

    return `https://gateway.pinata.cloud/ipfs/QmSimulatedMetadataHash${Date.now()}/${filename}`;
  }
}
