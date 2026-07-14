export interface NativeBalance {
  raw: string;
  formatted: string;
  decimals: number;
  symbol: string;
  usdValue: string;
  chainId: number;
  walletAddress: string;
  lastUpdated: Date;
}

export interface TokenBalance {
  tokenName: string;
  symbol: string;
  contractAddress: string;
  decimals: number;
  walletBalance: string;
  formattedBalance: string;
  logoUrl?: string;
  priceUsd: string;
  fiatValue: string;
  change24h?: string;
  chainId: number;
}

export interface WalletTransaction {
  hash: string;
  chainId: number;
  blockNumber: number;
  timestamp: Date;
  type: string; // classification
  from: string;
  to: string;
  tokenSymbol?: string;
  tokenAddress?: string;
  amount?: string;
  valueUsd?: string;
  gasFee: string;
  status: string;
  explorerUrl: string;
}

export interface PortfolioDataProvider {
  getNativeBalance(
    walletAddress: `0x${string}`,
    chainId: number
  ): Promise<NativeBalance>;

  getTokenBalances(
    walletAddress: `0x${string}`,
    chainId: number
  ): Promise<TokenBalance[]>;

  getTransactions(
    walletAddress: `0x${string}`,
    chainId: number
  ): Promise<WalletTransaction[]>;
}
