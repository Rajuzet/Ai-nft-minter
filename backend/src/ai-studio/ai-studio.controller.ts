import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { AiStudioService, CustomMetadataDto } from './ai-studio.service';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

class CustomMetadataInputDto implements CustomMetadataDto {
  @ApiProperty({ description: 'NFT metadata name', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'NFT metadata description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'NFT category classification', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ description: 'NFT custom traits array', required: false })
  @IsOptional()
  traits?: Array<{ traitType: string; value: string }>;

  @ApiProperty({ description: 'Royalty fee percentage', required: false })
  @IsOptional()
  royaltyPercentage?: number;

  @ApiProperty({ description: 'External project URL link', required: false })
  @IsString()
  @IsOptional()
  externalUrl?: string;

  @ApiProperty({ description: 'Details of any unlockable content', required: false })
  @IsString()
  @IsOptional()
  unlockableContent?: string;
}

class GenerateArtDto {
  @ApiProperty({ description: 'The prompt text to generate the AI image', example: 'A futuristic cybernetic operating system logo' })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiProperty({ description: 'Storage destination target (s3 or ipfs)', example: 's3', required: false })
  @IsString()
  @IsOptional()
  storage?: 's3' | 'ipfs';

  @ApiProperty({ description: 'Custom metadata parameters', required: false })
  @IsOptional()
  customMetadata?: CustomMetadataInputDto;
}

@ApiTags('AI Studio')
@Controller()
export class AiStudioController {
  constructor(private readonly aiStudioService: AiStudioService) {}

  @Post('api/generate-art')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate AI Art and upload metadata (Legacy endpoint)' })
  @ApiResponse({ status: 200, description: 'Success' })
  async generateArtLegacy(@Body() dto: GenerateArtDto) {
    return this.aiStudioService.generateArt(dto.prompt, dto.storage || 's3', dto.customMetadata);
  }

  @Post('api/v1/ai/generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate AI Art and upload metadata (WCOS standard endpoint)' })
  @ApiResponse({ status: 200, description: 'Success' })
  async generateArt(@Body() dto: GenerateArtDto) {
    return this.aiStudioService.generateArt(dto.prompt, dto.storage || 's3', dto.customMetadata);
  }
}
