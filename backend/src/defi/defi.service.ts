import { Injectable, BadRequestException } from '@nestjs/common';

export interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  usdValue: string;
}

export interface PortfolioRecord {
  walletAddress: string;
  chainBalances: Array<{ chain: string; balance: string; symbol: string; usdValue: string }>;
  tokens: TokenBalance[];
  nftHoldingsCount: number;
  totalUsdValue: string;
}

export interface SwapQuoteDto {
  fromToken: string;
  toToken: string;
  amount: string;
  slippage: number;
}

interface SwapAdapter {
  getQuote(dto: SwapQuoteDto): { expectedOutput: string; gasEstimate: string; routerAddress: string };
}

class UniswapAdapter implements SwapAdapter {
  getQuote(dto: SwapQuoteDto) {
    const numericAmt = parseFloat(dto.amount) || 0;
    // Simulated exchange rate: 1 ETH = 3500 WGT, or 1 WGT = 0.00028 ETH
    let expected = '0';
    if (dto.fromToken === 'ETH' && dto.toToken === 'WGT') {
      expected = (numericAmt * 3500).toFixed(4);
    } else if (dto.fromToken === 'WGT' && dto.toToken === 'ETH') {
      expected = (numericAmt * 0.00028).toFixed(6);
    } else {
      expected = (numericAmt * 1.05).toFixed(4); // default swap
    }

    return {
      expectedOutput: expected,
      gasEstimate: '0.00142', // in ETH
      routerAddress: '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24' // Base Sepolia Router
    };
  }
}

@Injectable()
export class DefiService {
  private swapAdapters: Record<string, SwapAdapter> = {
    uniswap: new UniswapAdapter(),
    '1inch': {
      getQuote: () => ({ expectedOutput: '0.0', gasEstimate: '0.0', routerAddress: '0x1InchRouterAddressComingSoon' })
    },
    '0x': {
      getQuote: () => ({ expectedOutput: '0.0', gasEstimate: '0.0', routerAddress: '0xZeroXRouterAddressComingSoon' })
    }
  };

  getPortfolio(walletAddress: string): PortfolioRecord {
    if (!walletAddress) {
      throw new BadRequestException('Wallet address is required to resolve portfolio.');
    }

    return {
      walletAddress,
      chainBalances: [
        { chain: 'base-sepolia', balance: '12.45', symbol: 'ETH', usdValue: '43575.00' },
        { chain: 'base-mainnet', balance: '0.12', symbol: 'ETH', usdValue: '420.00' },
        { chain: 'ethereum', balance: '1.85', symbol: 'ETH', usdValue: '6475.00' }
      ],
      tokens: [
        { symbol: 'WGT', name: 'WCOS Governance Token', balance: '5200.00', decimals: 18, usdValue: '1456.00' },
        { symbol: 'USDC', name: 'USD Coin', balance: '450.00', decimals: 6, usdValue: '450.00' }
      ],
      nftHoldingsCount: 4,
      totalUsdValue: '51921.00'
    };
  }

  getQuote(adapterKey: string, dto: SwapQuoteDto) {
    const adapter = this.swapAdapters[adapterKey];
    if (!adapter) {
      throw new BadRequestException(`Swap adapter ${adapterKey} is not supported.`);
    }
    return adapter.getQuote(dto);
  }
}
