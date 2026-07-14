import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TokenPriceProvider, TokenPriceResult } from './price-provider.interface';

@Injectable()
export class LlamaPriceProvider implements TokenPriceProvider {
  private readonly logger = new Logger(LlamaPriceProvider.name);
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

  constructor(private readonly prisma: PrismaService) {}

  private mapChainIdToLlamaChain(chainId: number): string | null {
    switch (chainId) {
      case 1: return 'ethereum';
      case 8453: return 'base';
      case 137: return 'polygon';
      case 42161: return 'arbitrum';
      case 10: return 'optimism';
      case 84532: return 'base'; // fallback testnet to base mainnet prices
      default: return null;
    }
  }

  private getNativeTokenCoingeckoId(chainId: number): string {
    switch (chainId) {
      case 137: return 'coingecko:matic-network';
      default: return 'coingecko:ethereum';
    }
  }

  async getTokenPrice(chainId: number, tokenAddress: string): Promise<TokenPriceResult> {
    const prices = await this.getTokenPrices(chainId, [tokenAddress]);
    const normAddress = tokenAddress.toLowerCase();
    if (prices[normAddress]) {
      return prices[normAddress];
    }
    return {
      priceUsd: '0.00',
      provider: 'DefiLlama (Fallback)',
      timestamp: new Date(),
    };
  }

  async getTokenPrices(chainId: number, tokenAddresses: string[]): Promise<Record<string, TokenPriceResult>> {
    const results: Record<string, TokenPriceResult> = {};
    const now = new Date();

    const normalizedAddresses = tokenAddresses.map((addr) => addr.toLowerCase());

    // 1. Load from DB cache first
    const cachedPrices = await this.prisma.tokenPriceSnapshot.findMany({
      where: {
        chainId,
        tokenAddress: { in: normalizedAddresses },
      },
    });

    const addressesToFetch: string[] = [];
    for (const addr of normalizedAddresses) {
      const cached = cachedPrices.find((c) => c.tokenAddress === addr);
      if (cached && (now.getTime() - cached.timestamp.getTime() < this.CACHE_TTL_MS)) {
        results[addr] = {
          priceUsd: cached.priceUsd,
          change24h: cached.change24h || undefined,
          provider: cached.provider,
          timestamp: cached.timestamp,
        };
      } else {
        addressesToFetch.push(addr);
      }
    }

    if (addressesToFetch.length === 0) {
      return results;
    }

    // 2. Fetch missing prices from DefiLlama
    const llamaChain = this.mapChainIdToLlamaChain(chainId);
    if (!llamaChain) {
      this.logger.warn(`Unsupported chain ID ${chainId} for DefiLlama pricing`);
      return results;
    }

    // Map token addresses to DefiLlama keys
    const addressToLlamaKey = (addr: string) => {
      if (addr === '0x0000000000000000000000000000000000000000' || addr === 'native') {
        return this.getNativeTokenCoingeckoId(chainId);
      }
      return `${llamaChain}:${addr}`;
    };

    const llamaKeys = addressesToFetch.map(addressToLlamaKey);
    const url = `https://coins.llama.fi/prices/current/${llamaKeys.join(',')}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const coins = data.coins || {};

      for (const addr of addressesToFetch) {
        const key = addressToLlamaKey(addr);
        const coinData = coins[key];

        if (coinData) {
          const priceResult: TokenPriceResult = {
            priceUsd: coinData.price.toString(),
            change24h: coinData.confidence ? '0.00' : undefined, // DefiLlama coins response has price, confidence, etc.
            provider: 'DefiLlama',
            timestamp: new Date(coinData.timestamp * 1000),
          };

          results[addr] = priceResult;

          // Upsert in database cache
          await this.prisma.tokenPriceSnapshot.upsert({
            where: {
              chainId_tokenAddress: {
                chainId,
                tokenAddress: addr,
              },
            },
            update: {
              priceUsd: priceResult.priceUsd,
              provider: priceResult.provider,
              timestamp: priceResult.timestamp,
            },
            create: {
              chainId,
              tokenAddress: addr,
              priceUsd: priceResult.priceUsd,
              provider: priceResult.provider,
              timestamp: priceResult.timestamp,
            },
          });
        } else {
          // If pricing is unavailable on testnet, return 0.00
          results[addr] = {
            priceUsd: '0.00',
            provider: 'DefiLlama (Unavailable)',
            timestamp: new Date(),
          };
        }
      }
    } catch (err) {
      this.logger.error(`Error fetching prices from DefiLlama: ${err.message}`);
      // Fallback to stale database prices if fetch fails
      for (const cached of cachedPrices) {
        if (addressesToFetch.includes(cached.tokenAddress)) {
          results[cached.tokenAddress] = {
            priceUsd: cached.priceUsd,
            change24h: cached.change24h || undefined,
            provider: `${cached.provider} (Stale)`,
            timestamp: cached.timestamp,
          };
        }
      }
    }

    return results;
  }
}
