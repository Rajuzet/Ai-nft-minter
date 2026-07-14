import { Injectable } from '@nestjs/common';

export interface DeFiPosition {
  protocolId: string;
  positionIdentifier: string;
  type: 'LENDING' | 'BORROWING' | 'STAKING' | 'LIQUIDITY';
  depositedAssets: Array<{ symbol: string; amount: string; address: string; valueUsd: string }>;
  borrowedAssets: Array<{ symbol: string; amount: string; address: string; valueUsd: string }>;
  netValueUsd: string;
  healthFactor?: string;
}

export interface DeFiProtocolAdapter {
  protocolId: string;
  supportsChain(chainId: number): boolean;
  getPositions(walletAddress: string, chainId: number): Promise<DeFiPosition[]>;
}

@Injectable()
export class UniswapLPAdapter implements DeFiProtocolAdapter {
  protocolId = 'uniswap';

  supportsChain(chainId: number): boolean {
    // Supports Mainnet, Base, Arbitrum, Optimism
    return [1, 8453, 42161, 10].includes(chainId);
  }

  async getPositions(walletAddress: string, chainId: number): Promise<DeFiPosition[]> {
    // Return empty list or sample LP positions for test environments
    // Since we don't have Uniswap subgraph keys, return an empty array by default
    return [];
  }
}

@Injectable()
export class AaveLendingAdapter implements DeFiProtocolAdapter {
  protocolId = 'aave';

  supportsChain(chainId: number): boolean {
    return [1, 8453, 42161, 10].includes(chainId);
  }

  async getPositions(walletAddress: string, chainId: number): Promise<DeFiPosition[]> {
    // Return empty list or sample Lending positions for testing Aave positions
    return [];
  }
}
