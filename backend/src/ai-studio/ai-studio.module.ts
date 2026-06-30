import { Module } from '@nestjs/common';
import { AiStudioController } from './ai-studio.controller';
import { AiStudioService } from './ai-studio.service';
import { StorageService } from '../storage/storage.service';

@Module({
  controllers: [AiStudioController],
  providers: [AiStudioService, StorageService],
  exports: [AiStudioService],
})
export class AiStudioModule {}
