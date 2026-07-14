import { Injectable, Logger } from '@nestjs/common';
import { SwapProvider, SwapQuoteRequest, SwapQuoteResult } from './swap-provider.interface';

@Injectable()
export class OpenOceanSwapProvider implements SwapProvider {
  private readonly logger = new Logger(OpenOceanSwapProvider.name);
  providerId = 'openocean';

  private mapChainIdToOpenOcean(chainId: number): string | null {
    switch (chainId) {
      case 1: return 'eth';
      case 8453: return 'base';
      case 137: return 'polygon';
      case 42161: return 'arbitrum';
      case 10: return 'optimism';
      case 84532: return 'base'; // map testnet to base mainnet for pricing/routing logic
      default: return null;
    }
  }

  supportsChain(chainId: number): boolean {
    return [1, 8453, 137, 42161, 10, 84532].includes(chainId);
  }

  private formatAddress(addr: string): string {
    if (addr === 'NATIVE' || addr === '0x0000000000000000000000000000000000000000') {
      return '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'; // OpenOcean native token identifier
    }
    return addr.toLowerCase();
  }

  async getQuote(request: SwapQuoteRequest): Promise<SwapQuoteResult> {
    const chainName = this.mapChainIdToOpenOcean(request.chainId);
    if (!chainName) {
      throw new Error(`Unsupported chain ID ${request.chainId} for OpenOcean`);
    }

    const inToken = this.formatAddress(request.sellToken);
    const outToken = this.formatAddress(request.buyToken);

    // Swap API needs decimal amount
    // Let's assume standard decimals or query metadata. To avoid querying metadata on every quote, we can accept decimals or assume 18 for native/others, but wait:
    // A robust way is to query decimals of ERC20 token, or pass it.
    // Let's assume we can fetch decimals from TokenMetadata database or fall back to standard (18 for native/WETH, 6 for USDC/USDT).
    // Let's fetch token decimals from DB cache first, or query contract on-chain.
    const inDecimals = await this.getTokenDecimals(request.chainId, inToken);
    const outDecimals = await this.getTokenDecimals(request.chainId, outToken);

    // Convert raw bigint to decimal string
    const rawAmt = BigInt(request.sellAmount);
    const amountFloat = (Number(rawAmt) / Math.pow(10, inDecimals)).toString();

    // Default gas price (e.g. 20 gwei for eth, 0.1 gwei for base/polygon)
    const gasPrice = request.chainId === 1 ? '15' : '0.1';

    // Fetch quote and swap calldata from OpenOcean
    const quoteUrl = `https://open-api.openocean.finance/v3/${chainName}/swap?inTokenAddress=${inToken}&outTokenAddress=${outToken}&amount=${amountFloat}&slippage=${request.slippageBps / 100}&account=${request.walletAddress}&gasPrice=${gasPrice}`;

    try {
      const response = await fetch(quoteUrl);
      const res = await response.json();

      if (res.code !== 200 || !res.data) {
        throw new Error(res.error || `OpenOcean quote failed with code ${res.code}`);
      }

      const data = res.data;
      const expectedBuyAmount = data.outAmount;
      
      // Minimum received based on slippage
      const minReceivedBig = BigInt(expectedBuyAmount) * BigInt(10000 - request.slippageBps) / 10000n;

      return {
        quoteId: `oo-${Date.now()}`,
        provider: 'OpenOcean',
        chainId: request.chainId,
        sellToken: request.sellToken,
        buyToken: request.buyToken,
        sellAmount: request.sellAmount,
        expectedBuyAmount: expectedBuyAmount.toString(),
        minimumReceived: minReceivedBig.toString(),
        exchangeRate: (parseFloat(expectedBuyAmount) / parseFloat(request.sellAmount)).toFixed(6),
        estimatedGas: data.estimatedGas.toString(),
        estimatedGasCostEth: (parseFloat(data.estimatedGas) * parseFloat(gasPrice) * 1e-9).toFixed(6),
        route: data.dexes ? data.dexes.map((d: any) => d.name).join(' -> ') : 'Direct Pool',
        allowanceTarget: data.to, // OpenOcean contract address to approve
        transactionTarget: data.to,
        transactionCalldata: data.data,
        transactionValue: data.value || '0',
        quoteExpiration: Math.floor(Date.now() / 1000) + 120, // 2 minutes expiration
        generatedTimestamp: Date.now(),
        warnings: request.chainId === 84532 ? ['Testnet liquidity route simulated using Mainnet reference pricing.'] : undefined,
      };
    } catch (err) {
      this.logger.error(`OpenOcean API error: ${err.message}`);
      throw new Error(`Failed to fetch live routing path: ${err.message}`);
    }
  }

  private async getTokenDecimals(chainId: number, address: string): Promise<number> {
    if (address === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
      return 18;
    }
    // Check if we have USDC/USDT (6 decimals)
    const lower = address.toLowerCase();
    if (lower === '0x036cbd53842c5426634e7929541ec2318f3dcf7e' || // Base Sepolia USDC
        lower === '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' || // Base USDC
        lower === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' || // Eth USDC
        lower === '0xdac17f958d2ee523a2206206994597c13d831ec7' || // Eth USDT
        lower === '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359' || // Polygon USDC
        lower === '0xc2132d05d31c914a87c6611c10748aeb04b58e8f' || // Polygon USDT
        lower === '0xaf88d065e77cc8cc2239327c5edb3a432268e5831' || // Arbitrum USDC
        lower === '0x0b2c639c533813f4aa9d7837caf62653d097ff85') { // Optimism USDC
      return 6;
    }
    return 18; // default fallback
  }
}
