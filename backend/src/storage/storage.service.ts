import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config();

export interface IpfsUploadResponse {
  ipfsHash: string;
  ipfsUrl: string;
  gatewayUrl: string;
}

export interface NFTTrait {
  trait_type: string;
  value: string | number | boolean;
  display_type?: string;
}

export interface NFTMetadataFormat {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes: NFTTrait[];
  [key: string]: any;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private provider = process.env.STORAGE_PROVIDER || 'ipfs';

  private getGatewayBaseUrl(): string {
    const rawGateway = process.env.IPFS_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/';
    return rawGateway.endsWith('/') ? rawGateway : `${rawGateway}/`;
  }

  private getPinataHeaders(): Record<string, string> {
    const jwt = process.env.PINATA_JWT;
    const apiKey = process.env.PINATA_API_KEY;
    const secretKey = process.env.PINATA_SECRET_API_KEY;

    if (jwt) {
      return {
        Authorization: `Bearer ${jwt}`,
      };
    }

    if (apiKey && secretKey) {
      return {
        pinata_api_key: apiKey,
        pinata_secret_api_key: secretKey,
      };
    }

    return {};
  }

  /**
   * Upload an image file buffer to IPFS via Pinata (or mock fallback if credentials omitted)
   */
  async uploadImageToIPFS(
    fileBuffer: Buffer,
    filename: string = 'nft-image.png',
    mimeType: string = 'image/png',
  ): Promise<IpfsUploadResponse> {
    this.logger.log(`Uploading image "${filename}" (${mimeType}, ${fileBuffer.length} bytes) to IPFS`);

    if (!fileBuffer || fileBuffer.length === 0) {
      throw new BadRequestException('Image file buffer cannot be empty.');
    }

    const headers = this.getPinataHeaders();
    const gatewayBase = this.getGatewayBaseUrl();

    // Check if Pinata credentials exist
    if (Object.keys(headers).length > 0) {
      try {
        const formData = new FormData();
        const blob = new Blob([new Uint8Array(fileBuffer)], { type: mimeType });
        formData.append('file', blob, filename);

        const metadata = JSON.stringify({ name: filename });
        formData.append('pinataMetadata', metadata);

        const options = JSON.stringify({ cidVersion: 0 });
        formData.append('pinataOptions', options);

        const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
          method: 'POST',
          headers: {
            ...headers,
          },
          body: formData,
        });

        if (!response.ok) {
          const errText = await response.text();
          this.logger.error(`Pinata image pin error (${response.status}): ${errText}`);
          throw new Error(`Pinata returned status ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const ipfsHash = data.IpfsHash;
        const ipfsUrl = `ipfs://${ipfsHash}`;
        const gatewayUrl = `${gatewayBase}${ipfsHash}`;

        this.logger.log(`Image pinned successfully to IPFS. Hash: ${ipfsHash}`);
        return { ipfsHash, ipfsUrl, gatewayUrl };
      } catch (error: any) {
        this.logger.error(`Failed to pin image to Pinata IPFS: ${error.message}`);
        throw new InternalServerErrorException(`Pinata IPFS Image Upload Failed: ${error.message}`);
      }
    }

    // No Pinata credentials configured — fail explicitly in production
    this.logger.error('IPFS upload failed: Pinata API credentials (PINATA_JWT or PINATA_API_KEY/PINATA_SECRET_API_KEY) are not configured.');
    throw new InternalServerErrorException(
      'IPFS storage is not configured. Set PINATA_JWT or PINATA_API_KEY/PINATA_SECRET_API_KEY environment variables.',
    );
  }

  /**
   * Helper to format standard NFT Metadata JSON object
   */
  createNFTMetadata(
    name: string,
    description: string,
    imageIpfsUrl: string,
    attributes: NFTTrait[] = [],
    externalUrl?: string,
    extraFields?: Record<string, any>,
  ): NFTMetadataFormat {
    if (!name || !name.trim()) {
      throw new BadRequestException('NFT title/name is required.');
    }
    if (!description || !description.trim()) {
      throw new BadRequestException('NFT description is required.');
    }
    if (!imageIpfsUrl || !imageIpfsUrl.trim()) {
      throw new BadRequestException('NFT image URL/URI is required.');
    }

    const formattedAttributes: NFTTrait[] = attributes.map(attr => ({
      trait_type: attr.trait_type || (attr as any).traitType || 'Attribute',
      value: attr.value,
      ...(attr.display_type ? { display_type: attr.display_type } : {}),
    }));

    const metadata: NFTMetadataFormat = {
      name: name.trim(),
      description: description.trim(),
      image: imageIpfsUrl.trim(),
      attributes: formattedAttributes,
      ...(externalUrl && externalUrl.trim() ? { external_url: externalUrl.trim() } : {}),
      ...(extraFields || {}),
    };

    return metadata;
  }

  /**
   * Upload JSON metadata object to IPFS via Pinata
   */
  async uploadMetadataToIPFS(
    metadata: Record<string, any>,
    filename: string = 'metadata.json',
  ): Promise<IpfsUploadResponse> {
    this.logger.log(`Uploading metadata JSON "${filename}" to IPFS`);

    const headers = this.getPinataHeaders();
    const gatewayBase = this.getGatewayBaseUrl();

    if (Object.keys(headers).length > 0) {
      try {
        const body = {
          pinataContent: metadata,
          pinataMetadata: {
            name: filename,
          },
        };

        const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errText = await response.text();
          this.logger.error(`Pinata JSON pin error (${response.status}): ${errText}`);
          throw new Error(`Pinata returned status ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const ipfsHash = data.IpfsHash;
        const ipfsUrl = `ipfs://${ipfsHash}`;
        const gatewayUrl = `${gatewayBase}${ipfsHash}`;

        this.logger.log(`Metadata JSON pinned successfully to IPFS. Hash: ${ipfsHash}`);
        return { ipfsHash, ipfsUrl, gatewayUrl };
      } catch (error: any) {
        this.logger.error(`Failed to pin metadata JSON to Pinata IPFS: ${error.message}`);
        throw new InternalServerErrorException(`Pinata IPFS Metadata Upload Failed: ${error.message}`);
      }
    }

    // No Pinata credentials configured — fail explicitly in production
    this.logger.error('IPFS metadata upload failed: Pinata API credentials are not configured.');
    throw new InternalServerErrorException(
      'IPFS storage is not configured. Set PINATA_JWT or PINATA_API_KEY/PINATA_SECRET_API_KEY environment variables.',
    );
  }

  // Legacy wrappers for backward compatibility
  async uploadImage(imageBuffer: Buffer, filename: string, mimeType: string = 'image/png'): Promise<string> {
    this.logger.log(`Uploading image "${filename}" via provider: ${this.provider}`);
    if (this.provider === 'ipfs') {
      const res = await this.uploadImageToIPFS(imageBuffer, filename, mimeType);
      return res.gatewayUrl;
    }
    if (this.provider === 'gcs') {
      const bucket = process.env.GCS_BUCKET_NAME || 'wcos-creator-assets';
      return `https://storage.googleapis.com/${bucket}/images/${filename}`;
    }
    if (this.provider === 's3') {
      const bucket = process.env.S3_BUCKET_NAME || 'wcos-assets';
      const baseUrl = process.env.S3_PUBLIC_BASE_URL || `https://${bucket}.s3.amazonaws.com`;
      return `${baseUrl}/images/${filename}`;
    }
    return `https://api.dicebear.com/7.x/shapes/svg?seed=${filename}`;
  }

  async uploadMetadata(metadata: Record<string, any>, filename: string): Promise<string> {
    this.logger.log(`Uploading metadata json "${filename}" via provider: ${this.provider}`);
    if (this.provider === 'ipfs') {
      const res = await this.uploadMetadataToIPFS(metadata, filename);
      return res.ipfsUrl;
    }
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

