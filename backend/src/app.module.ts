import { Module } from '@nestjs/common';
import { AiStudioModule } from './ai-studio/ai-studio.module';
import { ContractsModule } from './contracts/contracts.module';
import { CollectionsModule } from './collections/collections.module';
import { MarketplaceModule } from './marketplace/marketplace.module';

@Module({
  imports: [AiStudioModule, ContractsModule, CollectionsModule, MarketplaceModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
