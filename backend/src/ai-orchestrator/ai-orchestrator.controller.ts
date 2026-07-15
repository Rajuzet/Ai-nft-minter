import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiProperty, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { IsString, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class OrchestratorRequestDto {
  @ApiProperty({ description: 'Natural language command from the creator', example: 'Launch a cyberpunk NFT collection' })
  @IsString()
  message: string;
}

@ApiTags('AI Orchestrator')
@Controller('api/v1/ai/orchestrate')
export class AiOrchestratorController {
  constructor(private readonly service: AiOrchestratorService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process a natural language creator command and return a structured action plan' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  @ApiResponse({ status: 200, description: 'Structured intent and reply returned' })
  async orchestrate(@Body() dto: OrchestratorRequestDto, @Req() req: any) {
    return this.service.processCommand(dto.message, req.user.walletAddress);
  }
}
