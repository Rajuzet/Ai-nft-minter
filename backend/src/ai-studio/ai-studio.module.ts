import { Module } from '@nestjs/common';
import { AiStudioController } from './ai-studio.controller';
import { AiStudioService } from './ai-studio.service';
import { StorageService } from '../storage/storage.service';
import { OpenAiProvider } from './providers/openai.provider';

@Module({
  controllers: [AiStudioController],
  providers: [AiStudioService, StorageService, OpenAiProvider],
  exports: [AiStudioService],
})
export class AiStudioModule {}
