import { Injectable, Logger } from '@nestjs/common';
import { SwapProvider, SwapQuoteRequest, SwapQuoteResult } from './swap-provider.interface';

@Injectable()
export class OneInchSwapProvider implements SwapProvider {
  private readonly logger = new Logger(OneInchSwapProvider.name);
  providerId = '1inch';

  supportsChain(chainId: number): boolean {
    // Standard EVM chains
    return [1, 8453, 137, 42161, 10].includes(chainId);
  }

  async getQuote(request: SwapQuoteRequest): Promise<SwapQuoteResult> {
    this.logger.warn(`1inch quote requested for chain ${request.chainId} - Coming Soon placeholder`);
    throw new Error('1inch integration is coming soon.');
  }
}
