import { Controller, Post, Body, HttpCode, HttpStatus, Get, Param, Query, Delete, Request, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { AiStudioService, CustomMetadataDto } from './ai-studio.service';
import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';

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

  @ApiProperty({ description: 'Negative prompt' })
  @IsString()
  @IsOptional()
  negativePrompt?: string;

  @ApiProperty({ description: 'Style of the art' })
  @IsString()
  @IsOptional()
  style?: string;

  @ApiProperty({ description: 'Category' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ description: 'Aspect ratio', example: '1:1' })
  @IsString()
  @IsOptional()
  aspectRatio?: '1:1' | '16:9' | '9:16' | '3:2' | '2:3';

  @ApiProperty({ description: 'Image size', example: '1024x1024' })
  @IsString()
  @IsOptional()
  imageSize?: '256x256' | '512x512' | '1024x1024' | string;

  @ApiProperty({ description: 'Quality', example: 'standard' })
  @IsString()
  @IsOptional()
  quality?: 'standard' | 'hd';

  @ApiProperty({ description: 'Custom metadata parameters', required: false })
  @IsOptional()
  customMetadata?: CustomMetadataInputDto;

  @ApiProperty({ description: 'Wallet Address of the creator', required: true })
  @IsString()
  @IsNotEmpty()
  walletAddress: string;
}

class EnhancePromptDto {
  @ApiProperty({ description: 'The original prompt' })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiProperty({ description: 'The requested style' })
  @IsString()
  @IsOptional()
  style?: string;
}

@ApiTags('AI Studio')
@Controller()
export class AiStudioController {
  constructor(private readonly aiStudioService: AiStudioService) {}

  @Post('api/v1/ai/enhance-prompt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enhance a prompt using AI' })
  async enhancePrompt(@Body() dto: EnhancePromptDto) {
    const enhanced = await this.aiStudioService.enhancePrompt(dto.prompt, dto.style);
    return { enhancedPrompt: enhanced };
  }

  @Post('api/v1/ai/generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate AI Art and queue for upload' })
  async generateArt(@Body() dto: GenerateArtDto) {
    return this.aiStudioService.generateArt(
      dto,
      dto.customMetadata,
      dto.walletAddress
    );
  }

  @Get('api/v1/ai/generation/:id')
  @ApiOperation({ summary: 'Get generation status by ID' })
  async getGenerationStatus(@Param('id') id: string) {
    return this.aiStudioService.getGenerationStatus(id);
  }

  @Get('api/v1/ai/history')
  @ApiOperation({ summary: 'Get user generation history' })
  async getGenerationHistory(
    @Query('walletAddress') walletAddress: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string
  ) {
    if (!walletAddress) {
        throw new UnauthorizedException('walletAddress is required');
    }
    return this.aiStudioService.getUserHistory(walletAddress, parseInt(page), parseInt(limit), status);
  }

  @Delete('api/v1/ai/generation/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a draft generation' })
  async deleteDraft(
    @Param('id') id: string,
    @Query('walletAddress') walletAddress: string
  ) {
    if (!walletAddress) {
      throw new UnauthorizedException('walletAddress is required');
    }
    return this.aiStudioService.deleteDraft(id, walletAddress);
  }
}
