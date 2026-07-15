import { Controller, Post, Body, HttpCode, HttpStatus, Get, Param, Query, Delete, Req, UseGuards, UnauthorizedException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty, ApiHeader } from '@nestjs/swagger';
import { AiStudioService, CustomMetadataDto } from './ai-studio.service';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate AI Art and queue for upload' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  async generateArt(@Body() dto: GenerateArtDto, @Req() req: any) {
    if (dto.walletAddress.toLowerCase() !== req.user.walletAddress.toLowerCase()) {
      throw new ForbiddenException('Requested wallet address does not match authenticated session.');
    }
    return this.aiStudioService.generateArt(
      dto,
      dto.customMetadata,
      req.user.walletAddress
    );
  }

  @Get('api/v1/ai/generation/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get generation status by ID' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  async getGenerationStatus(@Param('id') id: string, @Req() req: any) {
    const asset = await this.aiStudioService.getGenerationStatus(id);
    if (asset.walletAddress.toLowerCase() !== req.user.walletAddress.toLowerCase()) {
      throw new ForbiddenException('Access denied. You do not own this generation asset.');
    }
    return asset;
  }

  @Get('api/v1/ai/history')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user generation history' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  async getGenerationHistory(
    @Query('walletAddress') walletAddress: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Req() req: any,
    @Query('status') status?: string
  ) {
    if (!walletAddress) {
      throw new BadRequestException('walletAddress is required');
    }
    if (walletAddress.toLowerCase() !== req.user.walletAddress.toLowerCase()) {
      throw new ForbiddenException('Access denied. You can only view your own generation history.');
    }
    return this.aiStudioService.getUserHistory(walletAddress, parseInt(page), parseInt(limit), status);
  }

  @Delete('api/v1/ai/generation/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a draft generation' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  async deleteDraft(
    @Param('id') id: string,
    @Query('walletAddress') walletAddress: string,
    @Req() req: any
  ) {
    if (!walletAddress) {
      throw new BadRequestException('walletAddress is required');
    }
    if (walletAddress.toLowerCase() !== req.user.walletAddress.toLowerCase()) {
      throw new ForbiddenException('Access denied. You can only delete your own draft generations.');
    }
    return this.aiStudioService.deleteDraft(id, req.user.walletAddress);
  }
}
