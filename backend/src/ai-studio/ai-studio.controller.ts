import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { AiStudioService } from './ai-studio.service';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

class GenerateArtDto {
  @ApiProperty({ description: 'The prompt text to generate the AI image', example: 'A futuristic cybernetic operating system logo' })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiProperty({ description: 'Storage destination target (s3 or ipfs)', example: 's3', required: false })
  @IsString()
  @IsOptional()
  storage?: 's3' | 'ipfs';
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
    return this.aiStudioService.generateArt(dto.prompt, dto.storage || 's3');
  }

  @Post('api/v1/ai/generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate AI Art and upload metadata (WCOS standard endpoint)' })
  @ApiResponse({ status: 200, description: 'Success' })
  async generateArt(@Body() dto: GenerateArtDto) {
    return this.aiStudioService.generateArt(dto.prompt, dto.storage || 's3');
  }
}
