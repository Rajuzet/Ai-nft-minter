import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiProperty } from '@nestjs/swagger';
import { StorageService, NFTTrait } from './storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { IsNotEmpty, IsString, IsOptional, IsArray, IsNumber } from 'class-validator';

export class UploadMetadataDto {
  @ApiProperty({ description: 'NFT title / name', example: 'Cyberpunk Warrior #001' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'NFT description', example: 'A rare cybernetic warrior token' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'NFT Image URL or IPFS URI', example: 'ipfs://Qm...' })
  @IsString()
  @IsNotEmpty()
  image: string;

  @ApiProperty({ description: 'Attributes traits array', required: false })
  @IsOptional()
  @IsArray()
  attributes?: NFTTrait[];

  @ApiProperty({ description: 'External project link', required: false })
  @IsString()
  @IsOptional()
  external_url?: string;

  @ApiProperty({ description: 'Optional wallet address of user', required: false })
  @IsString()
  @IsOptional()
  walletAddress?: string;

  @ApiProperty({ description: 'Animation URL (optional)', required: false })
  @IsString()
  @IsOptional()
  animation_url?: string;

  @ApiProperty({ description: 'Creator Wallet Address', required: false })
  @IsString()
  @IsOptional()
  creatorAddress?: string;

  @ApiProperty({ description: 'AI Model / Tool used', required: false })
  @IsString()
  @IsOptional()
  aiModel?: string;

  @ApiProperty({ description: 'Prompt used for generation', required: false })
  @IsString()
  @IsOptional()
  prompt?: string;

  @ApiProperty({ description: 'Style or Category', required: false })
  @IsString()
  @IsOptional()
  styleCategory?: string;

  @ApiProperty({ description: 'Chain ID', required: false })
  @IsNumber()
  @IsOptional()
  chainId?: number;
}

const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

@ApiTags('IPFS Storage')
@Controller('api/v1/ipfs')
export class IpfsController {
  constructor(
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('upload-image')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload an NFT image file directly to IPFS via Pinata' })
  @ApiResponse({ status: 200, description: 'Image pinned successfully to IPFS' })
  async uploadImage(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No image file provided. Please attach a file with key "file".');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type "${file.mimetype}". Supported formats: PNG, JPG, JPEG, GIF, WEBP, SVG.`,
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `File size exceeds 10MB limit (uploaded: ${(file.size / (1024 * 1024)).toFixed(2)}MB).`,
      );
    }

    const result = await this.storageService.uploadImageToIPFS(
      file.buffer,
      file.originalname || 'nft-asset.png',
      file.mimetype,
    );

    return {
      success: true,
      ...result,
    };
  }

  @Post('upload-metadata')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create and pin standard NFT metadata JSON to IPFS' })
  @ApiResponse({ status: 200, description: 'Metadata pinned successfully to IPFS' })
  async uploadMetadata(@Body() dto: UploadMetadataDto) {
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('Metadata title "name" is required.');
    }
    if (!dto.description || !dto.description.trim()) {
      throw new BadRequestException('Metadata "description" is required.');
    }
    if (!dto.image || !dto.image.trim()) {
      throw new BadRequestException('Metadata "image" URI/URL is required.');
    }

    const metadata = this.storageService.createNFTMetadata(
      dto.name,
      dto.description,
      dto.image,
      dto.attributes || [],
      dto.external_url,
    );

    const result = await this.storageService.uploadMetadataToIPFS(
      metadata,
      `${dto.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-metadata.json`,
    );

    // Save asset to database if wallet address provided and user exists
    let assetId: string | undefined;
    if (dto.walletAddress) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { walletAddress: dto.walletAddress.toLowerCase() },
        });
        if (user) {
          const asset = await this.prisma.aiAsset.create({
            data: {
              userId: user.id,
              prompt: `User Uploaded NFT: ${dto.name}`,
              imageUrl: dto.image,
              metadataUrl: result.ipfsUrl,
              storageProvider: 'ipfs',
            },
          });
          assetId = asset.id;
        }
      } catch (err) {
        // Non-critical database log failure
        console.warn('Could not persist asset to database:', err);
      }
    }

    return {
      success: true,
      ...result,
      metadata,
      assetId,
    };
  }

  @Post('process-nft')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload image and generate/upload metadata JSON to IPFS in one request' })
  async processNFT(
    @UploadedFile() file: any,
    @Body('name') name: string,
    @Body('description') description: string,
    @Body('attributes') attributesJson?: string,
    @Body('externalUrl') externalUrl?: string,
    @Body('walletAddress') walletAddress?: string,
    @Body('animation_url') animation_url?: string,
    @Body('creatorAddress') creatorAddress?: string,
    @Body('aiModel') aiModel?: string,
    @Body('prompt') prompt?: string,
    @Body('styleCategory') styleCategory?: string,
    @Body('chainId') chainId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required.');
    }
    if (!name || !name.trim()) {
      throw new BadRequestException('NFT name/title is required.');
    }
    if (!description || !description.trim()) {
      throw new BadRequestException('NFT description is required.');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(`Invalid file type "${file.mimetype}".`);
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(`File size exceeds 10MB limit.`);
    }

    // 1. Upload image to IPFS
    const imageRes = await this.storageService.uploadImageToIPFS(
      file.buffer,
      file.originalname || 'nft-image.png',
      file.mimetype,
    );

    // 2. Parse attributes
    let attributes: NFTTrait[] = [];
    if (attributesJson) {
      try {
        attributes = JSON.parse(attributesJson);
      } catch {
        // ignore invalid json format
      }
    }

    // 3. Create metadata JSON
    const extraFields: Record<string, any> = {};
    if (animation_url) extraFields.animation_url = animation_url;
    if (creatorAddress) extraFields.creator = creatorAddress;
    if (aiModel) extraFields.ai_model = aiModel;
    if (prompt) extraFields.prompt = prompt;
    if (styleCategory) extraFields.style_category = styleCategory;
    if (chainId) extraFields.chain_id = parseInt(chainId, 10);
    extraFields.timestamp = new Date().toISOString();

    const metadata = this.storageService.createNFTMetadata(
      name,
      description,
      imageRes.ipfsUrl,
      attributes,
      externalUrl,
      extraFields
    );

    // 4. Upload metadata to IPFS
    const metaRes = await this.storageService.uploadMetadataToIPFS(
      metadata,
      `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-metadata.json`,
    );

    // 5. Save record in database if wallet is passed
    let assetId: string | undefined;
    if (walletAddress) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { walletAddress: walletAddress.toLowerCase() },
        });
        if (user) {
          const asset = await this.prisma.aiAsset.create({
            data: {
              userId: user.id,
              prompt: `Uploaded NFT: ${name}`,
              imageUrl: imageRes.gatewayUrl,
              metadataUrl: metaRes.ipfsUrl,
              storageProvider: 'ipfs',
            },
          });
          assetId = asset.id;
        }
      } catch (err) {
        console.warn('DB recording failed:', err);
      }
    }

    return {
      success: true,
      image: imageRes,
      metadata: metaRes,
      metadataJson: metadata,
      assetId,
    };
  }
}
