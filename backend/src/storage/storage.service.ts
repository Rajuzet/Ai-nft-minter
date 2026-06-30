import { Injectable, OnModuleInit, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as crypto from 'crypto';

@Injectable()
export class StorageService implements OnModuleInit {
  private s3Client: S3Client;
  private awsRegion: string;
  private s3BucketName: string;
  private s3PublicBaseUrl: string;

  onModuleInit() {
    this.awsRegion = process.env.AWS_REGION || 'us-east-1';
    this.s3BucketName = process.env.S3_BUCKET_NAME;
    this.s3PublicBaseUrl = process.env.S3_PUBLIC_BASE_URL || `https://${this.s3BucketName}.s3.${this.awsRegion}.amazonaws.com`;

    if (this.s3BucketName) {
      this.s3Client = new S3Client({ region: this.awsRegion });
    }
  }

  async uploadToS3(fileBuffer: Buffer, path: string, contentType: string): Promise<string> {
    if (!this.s3BucketName) {
      throw new InternalServerErrorException('AWS S3 bucket configuration is missing.');
    }
    try {
      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.s3BucketName,
        Key: path,
        Body: fileBuffer,
        ContentType: contentType,
        ACL: 'public-read',
      }));
      return `${this.s3PublicBaseUrl}/${path}`;
    } catch (error: any) {
      console.error('S3 upload error:', error);
      throw new InternalServerErrorException(`S3 upload failed: ${error.message}`);
    }
  }

  async uploadToIpfs(fileBuffer: Buffer, fileName: string): Promise<string> {
    // Generate a mock IPFS CID based on the file content's sha256 hash for high-fidelity simulation
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const mockCid = 'Qm' + hash.slice(0, 44);
    
    // In production, this would call Pinata/Infura IPFS API. We mock the IPFS gateway URL:
    return `https://ipfs.io/ipfs/${mockCid}`;
  }
}
