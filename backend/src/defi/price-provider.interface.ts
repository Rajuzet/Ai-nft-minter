export interface TokenPriceResult {
  priceUsd: string;
  change24h?: string;
  provider: string;
  timestamp: Date;
}

export interface TokenPriceProvider {
  getTokenPrice(chainId: number, tokenAddress: string): Promise<TokenPriceResult>;
  getTokenPrices(chainId: number, tokenAddresses: string[]): Promise<Record<string, TokenPriceResult>>;
}
