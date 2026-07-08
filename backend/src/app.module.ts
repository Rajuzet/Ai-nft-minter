import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';
import { AuthModule } from './auth/auth.module';
import { TransactionsModule } from './transactions/transactions.module';
import { AiStudioModule } from './ai-studio/ai-studio.module';
import { ContractsModule } from './contracts/contracts.module';
import { CollectionsModule } from './collections/collections.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { DefiModule } from './defi/defi.module';
import { DaoModule } from './dao/dao.module';
import { AiOrchestratorModule } from './ai-orchestrator/ai-orchestrator.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ProfileModule } from './profile/profile.module';
import { IndexerModule } from './indexer/indexer.module';
import { NewsModule } from './news/news.module';
import { NftModule } from './nft/nft.module';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    AuthModule,
    TransactionsModule,
    AiStudioModule,
    ContractsModule,
    CollectionsModule,
    MarketplaceModule,
    DefiModule,
    DaoModule,
    AiOrchestratorModule,
    AnalyticsModule,
    ProfileModule,
    IndexerModule,
    NewsModule,
    NftModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
