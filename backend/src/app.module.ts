import { Module } from '@nestjs/common';
import { AiStudioModule } from './ai-studio/ai-studio.module';
import { ContractsModule } from './contracts/contracts.module';

@Module({
  imports: [AiStudioModule, ContractsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
