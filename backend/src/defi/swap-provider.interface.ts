export interface SwapQuoteRequest {
  chainId: number;
  walletAddress: `0x${string}`;
  sellToken: string; // token address or 'NATIVE'
  buyToken: string;  // token address or 'NATIVE'
  sellAmount: string; // string-represented BigInt/Decimal to avoid float loss
  slippageBps: number;
}

export interface SwapQuoteResult {
  quoteId: string;
  provider: string;
  chainId: number;
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  expectedBuyAmount: string;
  minimumReceived: string;
  exchangeRate: string;
  priceImpact?: string;
  estimatedGas: string;
  estimatedGasCostEth: string;
  route: string;
  liquiditySources?: string;
  allowanceTarget?: string;
  transactionTarget: string;
  transactionCalldata: string;
  transactionValue: string;
  quoteExpiration: number; // Unix timestamp
  generatedTimestamp: number;
  providerFee?: string;
  platformFee?: string;
  warnings?: string[];
}

export interface SwapProvider {
  providerId: string;
  supportsChain(chainId: number): boolean;
  getQuote(request: SwapQuoteRequest): Promise<SwapQuoteResult>;
}
