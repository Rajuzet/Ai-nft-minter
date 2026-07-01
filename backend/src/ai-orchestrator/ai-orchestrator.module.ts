import { Module } from '@nestjs/common';
import { AiOrchestratorController } from './ai-orchestrator.controller';
import { AiOrchestratorService } from './ai-orchestrator.service';

@Module({
  controllers: [AiOrchestratorController],
  providers: [AiOrchestratorService],
  exports: [AiOrchestratorService],
})
export class AiOrchestratorModule {}
