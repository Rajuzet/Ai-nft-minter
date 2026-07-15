import { Module } from '@nestjs/common';
import { AiOrchestratorController } from './ai-orchestrator.controller';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ProfileModule } from '../profile/profile.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { DefiModule } from '../defi/defi.module';
import { DaoModule } from '../dao/dao.module';
import { NftModule } from '../nft/nft.module';
import { MarketplaceModule } from '../marketplace/marketplace.module';

@Module({
  imports: [
    PrismaModule,
    ProfileModule,
    AnalyticsModule,
    DefiModule,
    DaoModule,
    NftModule,
    MarketplaceModule,
  ],
  controllers: [AiOrchestratorController],
  providers: [AiOrchestratorService],
  exports: [AiOrchestratorService],
})
export class AiOrchestratorModule {}

