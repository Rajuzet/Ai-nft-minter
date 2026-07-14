import { Module } from '@nestjs/common';
import { DefiController } from './defi.controller';
import { DefiService } from './defi.service';
import { BlockchainPortfolioProvider } from './blockchain-portfolio-provider.service';
import { LlamaPriceProvider } from './llama-price-provider.service';
import { UniswapLPAdapter, AaveLendingAdapter } from './protocol-adapters';
import { OpenOceanSwapProvider } from './openocean-swap-provider.service';

@Module({
  controllers: [DefiController],
  providers: [
    DefiService,
    BlockchainPortfolioProvider,
    LlamaPriceProvider,
    UniswapLPAdapter,
    AaveLendingAdapter,
    OpenOceanSwapProvider,
  ],
  exports: [DefiService],
})
export class DefiModule {}
