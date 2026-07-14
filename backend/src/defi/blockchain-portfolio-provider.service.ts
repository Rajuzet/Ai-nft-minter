import { Injectable, Logger } from '@nestjs/common';
import { createPublicClient, http, formatUnits, parseAbiItem } from 'viem';
import { baseSepolia, base, mainnet, polygon, arbitrum, optimism } from 'viem/chains';
import { PrismaService } from '../prisma/prisma.service';
import { LlamaPriceProvider } from './llama-price-provider.service';
import { PortfolioDataProvider, NativeBalance, TokenBalance, WalletTransaction } from './portfolio-provider.interface';

const ERC20_ABI = [
  parseAbiItem('function balanceOf(address owner) view returns (uint256)'),
  parseAbiItem('function name() view returns (string)'),
  parseAbiItem('function symbol() view returns (string)'),
  parseAbiItem('function decimals() view returns (uint8)'),
] as const;

@Injectable()
export class BlockchainPortfolioProvider implements PortfolioDataProvider {
  private readonly logger = new Logger(BlockchainPortfolioProvider.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly priceProvider: LlamaPriceProvider,
  ) {}

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

  private getPublicClient(chainId: number) {
    const chain = this.getViemChain(chainId);
    return createPublicClient({
      chain,
      transport: http(),
    });
  }

  private getExplorerTxUrl(chainId: number, txHash: string): string {
    const baseUrls: Record<number, string> = {
      84532: 'https://sepolia.basescan.org',
      8453: 'https://basescan.org',
      1: 'https://etherscan.io',
      137: 'https://polygonscan.com',
      42161: 'https://arbiscan.io',
      10: 'https://optimistic.etherscan.io',
    };
    const baseUrl = baseUrls[chainId] || 'https://etherscan.io';
    return `${baseUrl}/tx/${txHash}`;
  }

  private getCuratedTokens(chainId: number): Array<{ symbol: string; name: string; address: string; decimals: number }> {
    // Standard popular tokens on each chain for auto-discovery fallback
    switch (chainId) {
      case 84532: // Base Sepolia
        return [
          { symbol: 'WGT', name: 'WCOS Governance Token', address: '0x0000000000000000000000000000000000000000', decimals: 18 }, // Will resolve to configured or mock address
          { symbol: 'USDC', name: 'USD Coin', address: '0x036cbd53842c5426634e7929541ec2318f3dcf7e', decimals: 6 },
          { symbol: 'WETH', name: 'Wrapped Ether', address: '0x4200000000000000000000000000000000000006', decimals: 18 },
        ];
      case 8453: // Base Mainnet
        return [
          { symbol: 'USDC', name: 'USD Coin', address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', decimals: 6 },
          { symbol: 'WETH', name: 'Wrapped Ether', address: '0x4200000000000000000000000000000000000006', decimals: 18 },
          { symbol: 'DEGEN', name: 'Degen', address: '0x4ed4e11a221506294411143a852641b17ac2f307', decimals: 18 },
        ];
      case 1: // Ethereum
        return [
          { symbol: 'USDC', name: 'USD Coin', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', decimals: 6 },
          { symbol: 'USDT', name: 'Tether USD', address: '0xdac17f958d2ee523a2206206994597c13d831ec7', decimals: 6 },
          { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x6b175474e89094c44da98b954eedeac495271d0f', decimals: 18 },
          { symbol: 'WBTC', name: 'Wrapped BTC', address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', decimals: 8 },
        ];
      case 137: // Polygon
        return [
          { symbol: 'USDC', name: 'USD Coin', address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6 },
          { symbol: 'USDT', name: 'Tether USD', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
          { symbol: 'WMATIC', name: 'Wrapped Matic', address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270', decimals: 18 },
        ];
      case 42161: // Arbitrum
        return [
          { symbol: 'USDC', name: 'USD Coin', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 },
          { symbol: 'WETH', name: 'Wrapped Ether', address: '0x82aF49447D8a07e3bd95BD0d56f352415231aa11', decimals: 18 },
        ];
      case 10: // Optimism
        return [
          { symbol: 'USDC', name: 'USD Coin', address: '0x0b2C639c533813f4Aa9d7837CAf62653d097Ff85', decimals: 6 },
          { symbol: 'WETH', name: 'Wrapped Ether', address: '0x4200000000000000000000000000000000000006', decimals: 18 },
        ];
      default:
        return [];
    }
  }

  async getNativeBalance(walletAddress: `0x${string}`, chainId: number): Promise<NativeBalance> {
    const client = this.getPublicClient(chainId);
    const rawBalance = await client.getBalance({ address: walletAddress });
    const decimals = 18;
    const symbol = chainId === 137 ? 'POL' : 'ETH';
    const formatted = formatUnits(rawBalance, decimals);

    // Fetch USD price for native asset
    let priceUsd = '0.00';
    try {
      const priceResult = await this.priceProvider.getTokenPrice(chainId, '0x0000000000000000000000000000000000000000');
      priceUsd = priceResult.priceUsd;
    } catch (e) {
      this.logger.warn(`Could not resolve native asset price: ${e.message}`);
    }

    const usdValue = (parseFloat(formatted) * parseFloat(priceUsd)).toFixed(2);

    return {
      raw: rawBalance.toString(),
      formatted,
      decimals,
      symbol,
      usdValue,
      chainId,
      walletAddress,
      lastUpdated: new Date(),
    };
  }

  async getTokenBalances(walletAddress: `0x${string}`, chainId: number): Promise<TokenBalance[]> {
    const client = this.getPublicClient(chainId);
    const curated = this.getCuratedTokens(chainId);
    const balances: TokenBalance[] = [];

    // Dynamically retrieve WGT contract address if Base Sepolia
    if (chainId === 84532) {
      const wgtConf = process.env.NEXT_PUBLIC_WCOS_GOVERNANCE_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000';
      const wgtToken = curated.find((t) => t.symbol === 'WGT');
      if (wgtToken && wgtConf !== '0x0000000000000000000000000000000000000000') {
        wgtToken.address = wgtConf;
      }
    }

    const validTokens = curated.filter((t) => t.address !== '0x0000000000000000000000000000000000000000');

    // Run contract queries in parallel
    await Promise.all(
      validTokens.map(async (token) => {
        try {
          const balance = await client.readContract({
            address: token.address as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [walletAddress],
          });

          if (balance > 0n) {
            const formatted = formatUnits(balance, token.decimals);
            
            // Get price from pricing provider
            let priceUsd = '0.00';
            try {
              const priceResult = await this.priceProvider.getTokenPrice(chainId, token.address);
              priceUsd = priceResult.priceUsd;
            } catch {}

            const fiatValue = (parseFloat(formatted) * parseFloat(priceUsd)).toFixed(2);

            balances.push({
              tokenName: token.name,
              symbol: token.symbol,
              contractAddress: token.address,
              decimals: token.decimals,
              walletBalance: balance.toString(),
              formattedBalance: formatted,
              priceUsd,
              fiatValue,
              chainId,
            });

            // Populate Metadata Cache in background
            await this.prisma.safe(() =>
              this.prisma.tokenMetadata.upsert({
                where: {
                  chainId_address: {
                    chainId,
                    address: token.address.toLowerCase(),
                  },
                },
                update: {},
                create: {
                  chainId,
                  address: token.address.toLowerCase(),
                  symbol: token.symbol,
                  name: token.name,
                  decimals: token.decimals,
                  isVerified: true,
                },
              }),
            );
          }
        } catch (err) {
          this.logger.debug(`Could not read balance for token ${token.symbol} on chain ${chainId}: ${err.message}`);
        }
      }),
    );

    return balances;
  }

  async getTransactions(walletAddress: `0x${string}`, chainId: number): Promise<WalletTransaction[]> {
    const user = await this.prisma.safe(() =>
      this.prisma.user.findUnique({
        where: { walletAddress: walletAddress.toLowerCase() },
      }),
    );
    if (!user) return [];

    const txRecords = await this.prisma.safe(() =>
      this.prisma.transactionRecord.findMany({
        where: {
          userId: user.id,
          chainId,
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    );

    if (!txRecords) return [];

    return txRecords.map((tx) => {
      let details: any = {};
      try {
        details = JSON.parse(tx.details || '{}');
      } catch {}

      return {
        hash: tx.txHash,
        chainId: tx.chainId,
        blockNumber: 0, // default placeholder
        timestamp: tx.createdAt,
        type: tx.type,
        from: details.from || walletAddress,
        to: details.to || '0x0000000000000000000000000000000000000000',
        tokenSymbol: details.symbol || undefined,
        tokenAddress: details.tokenAddress || undefined,
        amount: details.amount || undefined,
        valueUsd: details.valueUsd || undefined,
        gasFee: details.gasFee || '0.0001',
        status: tx.status,
        explorerUrl: this.getExplorerTxUrl(tx.chainId, tx.txHash),
      };
    });
  }
}
