import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiProperty, ApiResponse } from '@nestjs/swagger';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { IsString, IsOptional } from 'class-validator';

class OrchestratorRequestDto {
  @ApiProperty({ description: 'Natural language command from the creator', example: 'Launch a cyberpunk NFT collection' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Connected wallet address for context', required: false })
  @IsOptional()
  @IsString()
  walletAddress?: string;
}

@ApiTags('AI Orchestrator')
@Controller('api/v1/ai/orchestrate')
export class AiOrchestratorController {
  constructor(private readonly service: AiOrchestratorService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process a natural language creator command and return a structured action plan' })
  @ApiResponse({ status: 200, description: 'Structured intent and reply returned' })
  async orchestrate(@Body() dto: OrchestratorRequestDto) {
    return this.service.processCommand(dto.message, dto.walletAddress);
  }
}
