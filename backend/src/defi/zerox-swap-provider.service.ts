import { Injectable, Logger } from '@nestjs/common';
import { SwapProvider, SwapQuoteRequest, SwapQuoteResult } from './swap-provider.interface';
import { createPublicClient, http } from 'viem';
import { baseSepolia, base, mainnet, polygon, arbitrum, optimism } from 'viem/chains';

@Injectable()
export class ZeroxSwapProvider implements SwapProvider {
  private readonly logger = new Logger(ZeroxSwapProvider.name);
  providerId = '0x';

  supportsChain(chainId: number): boolean {
    // 0x Swap API supports Base Sepolia (84532), Base (8453), Ethereum (1), Arbitrum (42161), Optimism (10), Polygon (137)
    return [1, 8453, 137, 42161, 10, 84532].includes(chainId);
  }

  private formatAddress(addr: string): string {
    if (addr === 'NATIVE' || addr === '0x0000000000000000000000000000000000000000') {
      return '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
    }
    return addr.toLowerCase();
  }

  async getQuote(request: SwapQuoteRequest): Promise<SwapQuoteResult> {
    const apiKey = process.env.DEFI_ZEROX_API_KEY;
    if (!apiKey) {
      throw new Error('DEFI_ZEROX_API_KEY environment variable is not set');
    }

    const inToken = this.formatAddress(request.sellToken);
    const outToken = this.formatAddress(request.buyToken);

    // Call 0x Swap API v2 /swap/allowance-holder/quote
    const url = new URL('https://api.0x.org/swap/allowance-holder/quote');
    url.searchParams.append('chainId', request.chainId.toString());
    url.searchParams.append('sellToken', inToken);
    url.searchParams.append('buyToken', outToken);
    url.searchParams.append('sellAmount', request.sellAmount);
    url.searchParams.append('taker', request.walletAddress);
    url.searchParams.append('slippageBps', request.slippageBps.toString());

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          '0x-api-key': apiKey,
          '0x-version': 'v2',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`0x API returned status ${response.status}: ${errorText}`);
        if (response.status === 400 || response.status === 422) {
          throw new Error(`Unsupported token pair or insufficient liquidity`);
        }
        throw new Error(`0x Swap API error: ${errorText || response.statusText}`);
      }

      const res = await response.json();

      const expectedBuyAmount = res.buyAmount;
      const minReceivedBig = BigInt(expectedBuyAmount) * BigInt(10000 - request.slippageBps) / 10000n;

      // Fetch decimals to calculate exchange rate
      const inDecimals = await this.getTokenDecimals(request.chainId, inToken);
      const outDecimals = await this.getTokenDecimals(request.chainId, outToken);

      const expectedBuyFloat = Number(expectedBuyAmount) / Math.pow(10, outDecimals);
      const sellFloat = Number(request.sellAmount) / Math.pow(10, inDecimals);
      const exchangeRate = sellFloat > 0 ? (expectedBuyFloat / sellFloat).toFixed(6) : '0.000000';

      const estimatedGas = res.estimatedGas || res.gas || '150000';
      const gasPrice = res.gasPrice || '0';
      const estimatedGasCostEth = (parseFloat(estimatedGas) * parseFloat(gasPrice) * 1e-18).toFixed(6);

      // Route mapping
      let routeStr = '0x API Router';
      if (res.route && res.route.fills) {
        routeStr = res.route.fills.map((fill: any) => `${fill.source} (${fill.proportion * 100}%)`).join(' -> ');
      }

      const allowanceTarget = res.issues?.allowance?.spender || res.allowanceTarget || '0x0000000000000000000000000000000000000000';

      return {
        quoteId: `0x-${Date.now()}`,
        provider: '0x',
        chainId: request.chainId,
        sellToken: request.sellToken,
        buyToken: request.buyToken,
        sellAmount: request.sellAmount,
        expectedBuyAmount: expectedBuyAmount.toString(),
        minimumReceived: minReceivedBig.toString(),
        exchangeRate,
        estimatedGas: estimatedGas.toString(),
        estimatedGasCostEth,
        route: routeStr,
        allowanceTarget,
        transactionTarget: res.to,
        transactionCalldata: res.data,
        transactionValue: res.value || '0',
        quoteExpiration: Math.floor(Date.now() / 1000) + 300,
        generatedTimestamp: Date.now(),
      };
    } catch (err) {
      this.logger.error(`0x API error: ${err.message}`);
      throw new Error(`Failed to fetch 0x quote: ${err.message}`);
    }
  }

  private async getTokenDecimals(chainId: number, address: string): Promise<number> {
    if (address === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
      return 18;
    }
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

    try {
      const rpcUrl = chainId === 84532 ? process.env.BASE_SEPOLIA_RPC_URL : undefined;
      const client = createPublicClient({
        chain: this.getViemChain(chainId),
        transport: http(rpcUrl),
      });
      const decimals = await client.readContract({
        address: address as `0x${string}`,
        abi: [{
          type: 'function',
          name: 'decimals',
          stateMutability: 'view',
          inputs: [],
          outputs: [{ name: '', type: 'uint8' }],
        }] as const,
        functionName: 'decimals',
      });
      return Number(decimals);
    } catch {
      return 18;
    }
  }

  private getViemChain(chainId: number) {
    switch (chainId) {
      case 8453: return base;
      case 1: return mainnet;
      case 137: return polygon;
      case 42161: return arbitrum;
      case 10: return optimism;
      case 84532:
      default: return baseSepolia;
    }
  }
}
