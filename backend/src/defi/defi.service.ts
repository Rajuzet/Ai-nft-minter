import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainPortfolioProvider } from './blockchain-portfolio-provider.service';
import { LlamaPriceProvider } from './llama-price-provider.service';
import { NativeBalance, TokenBalance, WalletTransaction } from './portfolio-provider.interface';
import { UniswapLPAdapter, AaveLendingAdapter, DeFiPosition } from './protocol-adapters';
import { OpenOceanSwapProvider } from './openocean-swap-provider.service';
import { SwapQuoteRequest, SwapQuoteResult } from './swap-provider.interface';
import { createPublicClient, http, formatUnits } from 'viem';
import { baseSepolia, base, mainnet, polygon, arbitrum, optimism } from 'viem/chains';

const WcosStakingABI = [
  {
    type: 'function',
    name: 'balances',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'earned',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export interface SwapQuoteDto {
  fromToken: string;
  toToken: string;
  amount: string;
  slippage: number;
}

export interface PortfolioSummary {
  walletAddress: string;
  netValueUsd: string;
  totalAssetsUsd: string;
  totalDebtUsd: string;
  nativeBalances: NativeBalance[];
  tokenBalances: TokenBalance[];
  nftHoldings: any[];
  stakingPositions: any[];
  protocolPositions: DeFiPosition[];
  unclaimedRewards: any[];
  transactionHistory: WalletTransaction[];
  quoteCurrency: string;
  lastRefreshTime: string;
  warnings: string[];
}

@Injectable()
export class DefiService {
  private readonly logger = new Logger(DefiService.name);
  private readonly supportedChains = [84532, 8453, 1, 137, 42161, 10]; // Base Sepolia, Base, Mainnet, Polygon, Arbitrum, Optimism

  constructor(
    private readonly prisma: PrismaService,
    private readonly portfolioProvider: BlockchainPortfolioProvider,
    private readonly priceProvider: LlamaPriceProvider,
    private readonly uniswapLPAdapter: UniswapLPAdapter,
    private readonly aaveLendingAdapter: AaveLendingAdapter,
    private readonly openoceanSwapProvider: OpenOceanSwapProvider,
  ) {}

  private getStakingAddress(chainId: number): string | null {
    if (chainId === 84532) {
      return process.env.NEXT_PUBLIC_WCOS_STAKING_ADDRESS || '0x0000000000000000000000000000000000000000';
    }
    return null;
  }

  async getPortfolio(walletAddress: string, quoteCurrency = 'USD'): Promise<PortfolioSummary> {
    if (!walletAddress || !walletAddress.startsWith('0x')) {
      throw new BadRequestException('A valid active EVM wallet address is required.');
    }

    const address = walletAddress.toLowerCase() as `0x${string}`;
    const nativeBalances: NativeBalance[] = [];
    const tokenBalances: TokenBalance[] = [];
    const warnings: string[] = [];

    // 1. Fetch native and ERC-20 balances from supported chains
    await Promise.all(
      this.supportedChains.map(async (chainId) => {
        try {
          // Native Balance
          const native = await this.portfolioProvider.getNativeBalance(address, chainId);
          nativeBalances.push(native);

          // ERC-20 Balances
          const tokens = await this.portfolioProvider.getTokenBalances(address, chainId);
          tokenBalances.push(...tokens);
        } catch (e) {
          const chainName = chainId === 84532 ? 'Base Sepolia' : `Chain ${chainId}`;
          warnings.push(`Could not fetch balances for ${chainName}: ${e.message}`);
          this.logger.warn(`Failed syncing balances for chain ${chainId}: ${e.message}`);
        }
      }),
    );

    // 2. Fetch Staking Positions
    const stakingPositions: any[] = [];
    const unclaimedRewards: any[] = [];

    for (const chainId of this.supportedChains) {
      const stakingAddr = this.getStakingAddress(chainId);
      if (stakingAddr && stakingAddr !== '0x0000000000000000000000000000000000000000') {
        try {
          const client = createPublicClient({
            chain: this.getViemChain(chainId),
            transport: http(),
          });

          const stakedRaw = await client.readContract({
            address: stakingAddr as `0x${string}`,
            abi: WcosStakingABI,
            functionName: 'balances',
            args: [address],
          }) as bigint;

          const rewardsRaw = await client.readContract({
            address: stakingAddr as `0x${string}`,
            abi: WcosStakingABI,
            functionName: 'earned',
            args: [address],
          }) as bigint;

          const lockDurationRaw = stakedRaw > 0n ? await client.readContract({
            address: stakingAddr as `0x${string}`,
            abi: [{
              type: 'function',
              name: 'lockDurations',
              stateMutability: 'view',
              inputs: [{ name: '', type: 'address' }],
              outputs: [{ name: '', type: 'uint256' }],
            }] as any,
            functionName: 'lockDurations',
            args: [address],
          }) as bigint : 0n;

          const unlockTimeRaw = stakedRaw > 0n ? await client.readContract({
            address: stakingAddr as `0x${string}`,
            abi: [{
              type: 'function',
              name: 'unlockTimes',
              stateMutability: 'view',
              inputs: [{ name: '', type: 'address' }],
              outputs: [{ name: '', type: 'uint256' }],
            }] as any,
            functionName: 'unlockTimes',
            args: [address],
          }) as bigint : 0n;

          if (stakedRaw > 0n || rewardsRaw > 0n) {
            const stakedAmount = formatUnits(stakedRaw, 18);
            const rewardsAmount = formatUnits(rewardsRaw, 18);

            // Fetch WGT price if available
            let priceUsd = '0.28'; // fallback simulator WGT price
            try {
              const p = await this.priceProvider.getTokenPrice(chainId, stakingAddr);
              if (p.priceUsd !== '0.00') priceUsd = p.priceUsd;
            } catch {}

            const stakedValue = (parseFloat(stakedAmount) * parseFloat(priceUsd)).toFixed(2);
            const rewardsValue = (parseFloat(rewardsAmount) * parseFloat(priceUsd)).toFixed(2);

            const apyStr = lockDurationRaw === 365n ? '18% APY' : lockDurationRaw === 90n ? '12% APY' : '8% APY';

            stakingPositions.push({
              stakedToken: 'WGT',
              stakedAmount,
              currentValueUsd: stakedValue,
              rewardsEarned: rewardsAmount,
              rewardsAvailable: rewardsAmount,
              stakingContract: stakingAddr,
              chain: chainId === 84532 ? 'Base Sepolia' : `Chain ${chainId}`,
              chainId,
              apySource: apyStr,
              unlockTime: Number(unlockTimeRaw),
              lockDuration: Number(lockDurationRaw),
              status: 'ACTIVE',
            });

            if (rewardsRaw > 0n) {
              unclaimedRewards.push({
                protocol: 'WcosStaking',
                rewardToken: 'WGT',
                amount: rewardsAmount,
                valueUsd: rewardsValue,
                claimable: true,
                chain: chainId === 84532 ? 'Base Sepolia' : `Chain ${chainId}`,
                chainId,
                rewardContract: stakingAddr,
              });
            }
          }
        } catch (e) {
          warnings.push(`Staking positions unavailable: ${e.message}`);
        }
      }
    }

    // 3. Fetch Protocol Positions (Lending/LP adapters)
    const protocolPositions: DeFiPosition[] = [];
    for (const chainId of this.supportedChains) {
      try {
        if (this.uniswapLPAdapter.supportsChain(chainId)) {
          const lp = await this.uniswapLPAdapter.getPositions(address, chainId);
          protocolPositions.push(...lp);
        }
        if (this.aaveLendingAdapter.supportsChain(chainId)) {
          const lend = await this.aaveLendingAdapter.getPositions(address, chainId);
          protocolPositions.push(...lend);
        }
      } catch (e) {
        this.logger.debug(`Protocol adapters warning: ${e.message}`);
      }
    }

    // 4. Fetch NFTs (local DB records + mints + purchases)
    const dbNfts = await this.prisma.nft.findMany({
      where: { ownerAddress: address },
      orderBy: { createdAt: 'desc' },
    });

    const indexedNfts = await this.prisma.indexedNft.findMany({
      where: { ownerAddress: address },
      orderBy: { createdAt: 'desc' },
    });

    const nftHoldings = [...dbNfts, ...indexedNfts].map((nft) => ({
      chainId: (nft as any).chainId || 84532,
      nftAddress: nft.contractAddress,
      tokenId: nft.tokenId.toString(),
      tokenStandard: 'ERC721',
      name: nft.name || `Asset #${nft.tokenId}`,
      description: nft.description || '',
      imageUrl: nft.imageUrl || '',
      metadataUri: nft.tokenUri || '',
      collection: 'AI Studio Collective',
    }));

    // 5. Fetch Transactions
    const transactionHistory: WalletTransaction[] = [];
    await Promise.all(
      this.supportedChains.map(async (chainId) => {
        try {
          const txs = await this.portfolioProvider.getTransactions(address, chainId);
          transactionHistory.push(...txs);
        } catch {}
      }),
    );

    // 6. Calculate Valuation (USD)
    let totalAssetsUsd = 0;
    let totalDebtUsd = 0;

    nativeBalances.forEach((b) => { totalAssetsUsd += parseFloat(b.usdValue); });
    tokenBalances.forEach((t) => { totalAssetsUsd += parseFloat(t.fiatValue); });
    stakingPositions.forEach((s) => { totalAssetsUsd += parseFloat(s.currentValueUsd); });
    unclaimedRewards.forEach((r) => { totalAssetsUsd += parseFloat(r.valueUsd); });

    protocolPositions.forEach((pos) => {
      totalAssetsUsd += parseFloat(pos.netValueUsd); // simple aggregation
    });

    const netValueUsd = (totalAssetsUsd - totalDebtUsd).toFixed(2);

    // Convert values if quote currency is INR (approximate conversion)
    const fxRate = quoteCurrency === 'INR' ? 83.5 : 1.0;

    const summary: PortfolioSummary = {
      walletAddress,
      netValueUsd: (parseFloat(netValueUsd) * fxRate).toFixed(2),
      totalAssetsUsd: (totalAssetsUsd * fxRate).toFixed(2),
      totalDebtUsd: (totalDebtUsd * fxRate).toFixed(2),
      nativeBalances: nativeBalances.map((b) => ({
        ...b,
        usdValue: (parseFloat(b.usdValue) * fxRate).toFixed(2),
      })),
      tokenBalances: tokenBalances.map((t) => ({
        ...t,
        fiatValue: (parseFloat(t.fiatValue) * fxRate).toFixed(2),
      })),
      nftHoldings,
      stakingPositions: stakingPositions.map((s) => ({
        ...s,
        currentValueUsd: (parseFloat(s.currentValueUsd) * fxRate).toFixed(2),
      })),
      protocolPositions,
      unclaimedRewards: unclaimedRewards.map((r) => ({
        ...r,
        valueUsd: (parseFloat(r.valueUsd) * fxRate).toFixed(2),
      })),
      transactionHistory: transactionHistory.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
      quoteCurrency,
      lastRefreshTime: new Date().toLocaleTimeString(),
      warnings,
    };

    // 7. Store historical snapshots & sync states in background
    await this.prisma.safe(async () => {
      // Upsert summary snapshot
      await this.prisma.walletPortfolio.upsert({
        where: { walletAddress: address },
        update: {
          netValueUsd: netValueUsd,
          totalAssetsUsd: totalAssetsUsd.toFixed(2),
          totalDebtUsd: totalDebtUsd.toFixed(2),
          lastUpdated: new Date(),
        },
        create: {
          walletAddress: address,
          netValueUsd: netValueUsd,
          totalAssetsUsd: totalAssetsUsd.toFixed(2),
          totalDebtUsd: totalDebtUsd.toFixed(2),
        },
      });

      // Insert Snapshot Record
      await this.prisma.portfolioSnapshot.create({
        data: {
          walletAddress: address,
          totalValueUsd: netValueUsd,
          assetValueUsd: totalAssetsUsd.toFixed(2),
          debtValueUsd: totalDebtUsd.toFixed(2),
          nativeValueUsd: nativeBalances.reduce((acc, curr) => acc + parseFloat(curr.usdValue), 0).toFixed(2),
          tokenValueUsd: tokenBalances.reduce((acc, curr) => acc + parseFloat(curr.fiatValue), 0).toFixed(2),
          nftValueUsd: '0.00',
          stakingValueUsd: stakingPositions.reduce((acc, curr) => acc + parseFloat(curr.currentValueUsd), 0).toFixed(2),
          protocolValueUsd: protocolPositions.reduce((acc, curr) => acc + parseFloat(curr.netValueUsd), 0).toFixed(2),
        },
      });
    });

    return summary;
  }

  async getPerformance(walletAddress: string): Promise<any> {
    const address = walletAddress.toLowerCase();
    const snapshots = await this.prisma.safe(() =>
      this.prisma.portfolioSnapshot.findMany({
        where: { walletAddress: address },
        orderBy: { snapshotTime: 'asc' },
        take: 30,
      }),
    );

    if (!snapshots || snapshots.length === 0) {
      return {
        change24h: '0.00',
        change7d: '0.00',
        history: [],
      };
    }

    const first = parseFloat(snapshots[0].totalValueUsd);
    const last = parseFloat(snapshots[snapshots.length - 1].totalValueUsd);
    const changeAll = first > 0 ? (((last - first) / first) * 100).toFixed(2) : '0.00';

    return {
      change24h: changeAll,
      change7d: changeAll,
      history: snapshots.map((s) => ({
        label: new Date(s.snapshotTime).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        value: parseFloat(s.totalValueUsd),
      })),
    };
  }

  async hideAsset(walletAddress: string, chainId: number, tokenAddress: string): Promise<boolean> {
    const res = await this.prisma.safe(() =>
      this.prisma.tokenBalanceSnapshot.upsert({
        where: {
          walletAddress_chainId_tokenAddress: {
            walletAddress: walletAddress.toLowerCase(),
            chainId,
            tokenAddress: tokenAddress.toLowerCase(),
          },
        },
        update: { isHidden: true },
        create: {
          walletAddress: walletAddress.toLowerCase(),
          chainId,
          tokenAddress: tokenAddress.toLowerCase(),
          symbol: '',
          name: '',
          amount: '0',
          decimals: 18,
          priceUsd: '0',
          valueUsd: '0',
          isHidden: true,
        },
      }),
    );
    return !!res;
  }

  async unhideAsset(walletAddress: string, chainId: number, tokenAddress: string): Promise<boolean> {
    const res = await this.prisma.safe(() =>
      this.prisma.tokenBalanceSnapshot.update({
        where: {
          walletAddress_chainId_tokenAddress: {
            walletAddress: walletAddress.toLowerCase(),
            chainId,
            tokenAddress: tokenAddress.toLowerCase(),
          },
        },
        data: { isHidden: false },
      }),
    );
    return !!res;
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

  async getSwapQuote(request: SwapQuoteRequest): Promise<SwapQuoteResult> {
    // Explicit development-only mock: must set SWAP_MOCK=true in environment
    if (process.env.SWAP_MOCK === 'true') {
      this.logger.warn(`[DEV ONLY] SWAP_MOCK=true — returning simulated swap quote for chain ${request.chainId}`);

      const expectedOut = (parseFloat(formatUnits(BigInt(request.sellAmount), 18)) * 3500).toString();
      const minOut = (parseFloat(expectedOut) * 0.995).toString();

      return {
        quoteId: `mock-${Date.now()}`,
        provider: 'MockRouter',
        chainId: request.chainId,
        sellToken: request.sellToken,
        buyToken: request.buyToken,
        sellAmount: request.sellAmount,
        expectedBuyAmount: expectedOut,
        minimumReceived: minOut,
        exchangeRate: '3500.00',
        estimatedGas: '150000',
        estimatedGasCostEth: '0.00015',
        route: `${request.sellToken === 'NATIVE' ? 'ETH' : 'ERC20'} -> MockPool -> WGT`,
        allowanceTarget: '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24',
        transactionTarget: '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24',
        transactionCalldata: '0x',
        transactionValue: request.sellToken === 'NATIVE' ? request.sellAmount : '0',
        quoteExpiration: Math.floor(Date.now() / 1000) + 300,
        generatedTimestamp: Date.now(),
        warnings: ['SWAP_MOCK=true: This quote is simulated and not executable on-chain.'],
      };
    }

    // All chains (including testnet 84532) route through the real swap aggregator
    return this.openoceanSwapProvider.getQuote(request);
  }

  async createPendingSwap(dto: any) {
    const res = await this.prisma.safe(() =>
      this.prisma.swapTransaction.create({
        data: {
          walletAddress: dto.walletAddress.toLowerCase(),
          chainId: dto.chainId,
          provider: dto.provider,
          sellTokenAddress: dto.sellTokenAddress.toLowerCase(),
          sellTokenSymbol: dto.sellTokenSymbol,
          sellTokenDecimals: dto.sellTokenDecimals,
          sellAmount: dto.sellAmount,
          buyTokenAddress: dto.buyTokenAddress.toLowerCase(),
          buyTokenSymbol: dto.buyTokenSymbol,
          buyTokenDecimals: dto.buyTokenDecimals,
          quotedBuyAmount: dto.quotedBuyAmount,
          minimumBuyAmount: dto.minimumBuyAmount,
          slippageBps: dto.slippageBps,
          swapTransactionHash: dto.swapTransactionHash,
          allowanceTarget: dto.allowanceTarget?.toLowerCase(),
          routerAddress: dto.routerAddress?.toLowerCase(),
          status: 'PENDING',
        },
      }),
    );
    return res;
  }

  async confirmSwap(chainId: number, txHash: string) {
    const client = createPublicClient({
      chain: this.getViemChain(chainId),
      transport: http(),
    });

    try {
      // For mock tx hash, skip on-chain receipt fetching if mock mode is on or Sepolia mock tx
      if (txHash.startsWith('0xmock') || process.env.SWAP_MOCK === 'true') {
        const pending = await this.prisma.swapTransaction.findUnique({
          where: { swapTransactionHash: txHash },
        });
        const status = 'CONFIRMED';
        const updated = await this.prisma.swapTransaction.update({
          where: { swapTransactionHash: txHash },
          data: {
            status,
            blockNumber: 0,
            gasUsed: '120000',
            gasCost: '0.00012',
          },
        });

        if (pending) {
          const user = await this.prisma.user.findUnique({
            where: { walletAddress: pending.walletAddress.toLowerCase() },
          });

          await this.prisma.transactionRecord.upsert({
            where: { txHash },
            create: {
              txHash,
              network: chainId === 84532 ? 'base-sepolia' : 'base-mainnet',
              chainId,
              type: 'SWAP',
              status: 'CONFIRMED',
              userId: user?.id,
              details: JSON.stringify({
                fromToken: pending.sellTokenSymbol,
                toToken: pending.buyTokenSymbol,
                amount: pending.sellAmount,
                buyAmount: pending.quotedBuyAmount,
              }),
            },
            update: { status: 'CONFIRMED' },
          });
        }
        return updated;
      }

      const receipt = await client.getTransactionReceipt({ hash: txHash as `0x${string}` });
      const status = receipt.status === 'success' ? 'CONFIRMED' : 'FAILED';

      const updated = await this.prisma.swapTransaction.update({
        where: { swapTransactionHash: txHash },
        data: {
          status,
          blockNumber: Number(receipt.blockNumber),
          gasUsed: receipt.gasUsed.toString(),
          gasCost: (receipt.gasUsed * receipt.effectiveGasPrice).toString(),
        },
      });

      if (status === 'CONFIRMED') {
        const user = await this.prisma.user.findUnique({
          where: { walletAddress: updated.walletAddress.toLowerCase() },
        });

        await this.prisma.transactionRecord.upsert({
          where: { txHash },
          create: {
            txHash,
            network: chainId === 84532 ? 'base-sepolia' : 'base-mainnet',
            chainId,
            type: 'SWAP',
            status: 'CONFIRMED',
            userId: user?.id,
            details: JSON.stringify({
              fromToken: updated.sellTokenSymbol,
              toToken: updated.buyTokenSymbol,
              amount: updated.sellAmount,
              buyAmount: updated.actualBuyAmount || updated.quotedBuyAmount,
            }),
          },
          update: { status: 'CONFIRMED' },
        });
      }

      return updated;
    } catch (e) {
      this.logger.error(`Error confirming swap ${txHash}: ${e.message}`);
      throw new BadRequestException(`Could not confirm transaction: ${e.message}`);
    }
  }

  async getSwapHistory(walletAddress: string) {
    return this.prisma.safe(() =>
      this.prisma.swapTransaction.findMany({
        where: { walletAddress: walletAddress.toLowerCase() },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  async getStakingPools(chainId: number) {
    // Seed default WGT pool if empty
    const count = await this.prisma.stakingPool.count({ where: { chainId } });
    if (count === 0) {
      const stakingAddr = this.getStakingAddress(chainId) || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
      const tokenAddr = process.env.GOVERNANCE_TOKEN_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
      await this.prisma.stakingPool.create({
        data: {
          chainId,
          stakingContract: stakingAddr.toLowerCase(),
          name: 'WGT Staking Pool',
          stakingTokenAddress: tokenAddr.toLowerCase(),
          rewardTokenAddress: tokenAddr.toLowerCase(),
          status: 'ACTIVE',
        },
      });
    }
    return this.prisma.stakingPool.findMany({ where: { chainId } });
  }

  async getStakingPositions(walletAddress: string, chainId: number) {
    const address = walletAddress.toLowerCase();
    const pools = await this.getStakingPools(chainId);
    const client = createPublicClient({
      chain: this.getViemChain(chainId),
      transport: http(),
    });

    for (const pool of pools) {
      try {
        const stakingAddr = pool.stakingContract as `0x${string}`;
        const stakedRaw = await client.readContract({
          address: stakingAddr,
          abi: [
            ...WcosStakingABI,
            {
              type: 'function',
              name: 'unlockTimes',
              stateMutability: 'view',
              inputs: [{ name: '', type: 'address' }],
              outputs: [{ name: '', type: 'uint256' }],
            },
            {
              type: 'function',
              name: 'stakeTimes',
              stateMutability: 'view',
              inputs: [{ name: '', type: 'address' }],
              outputs: [{ name: '', type: 'uint256' }],
            },
            {
              type: 'function',
              name: 'lockDurations',
              stateMutability: 'view',
              inputs: [{ name: '', type: 'address' }],
              outputs: [{ name: '', type: 'uint256' }],
            }
          ] as any,
          functionName: 'balances',
          args: [address as `0x${string}`],
        }) as bigint;

        const earnedRaw = await client.readContract({
          address: stakingAddr,
          abi: WcosStakingABI,
          functionName: 'earned',
          args: [address as `0x${string}`],
        }) as bigint;

        const unlockTimeRaw = stakedRaw > 0n ? await client.readContract({
          address: stakingAddr,
          abi: [
            {
              type: 'function',
              name: 'unlockTimes',
              stateMutability: 'view',
              inputs: [{ name: '', type: 'address' }],
              outputs: [{ name: '', type: 'uint256' }],
            }
          ] as any,
          functionName: 'unlockTimes',
          args: [address as `0x${string}`],
        }) as bigint : 0n;

        const stakeTimeRaw = stakedRaw > 0n ? await client.readContract({
          address: stakingAddr,
          abi: [
            {
              type: 'function',
              name: 'stakeTimes',
              stateMutability: 'view',
              inputs: [{ name: '', type: 'address' }],
              outputs: [{ name: '', type: 'uint256' }],
            }
          ] as any,
          functionName: 'stakeTimes',
          args: [address as `0x${string}`],
        }) as bigint : 0n;

        const stakedAmount = formatUnits(stakedRaw, 18);
        const pendingReward = formatUnits(earnedRaw, 18);

        if (stakedRaw > 0n) {
          await this.prisma.stakingPosition.upsert({
            where: {
              walletAddress_chainId_stakingContract: {
                walletAddress: address,
                chainId,
                stakingContract: pool.stakingContract,
              },
            },
            update: {
              stakedAmount,
              pendingReward,
              stakeTimestamp: new Date(Number(stakeTimeRaw) * 1000),
              unlockTimestamp: new Date(Number(unlockTimeRaw) * 1000),
              status: 'ACTIVE',
            },
            create: {
              walletAddress: address,
              chainId,
              stakingContract: pool.stakingContract,
              poolId: pool.poolId,
              stakingTokenAddress: pool.stakingTokenAddress,
              rewardTokenAddress: pool.rewardTokenAddress,
              stakedAmount,
              pendingReward,
              stakeTimestamp: new Date(Number(stakeTimeRaw) * 1000),
              unlockTimestamp: new Date(Number(unlockTimeRaw) * 1000),
              status: 'ACTIVE',
            },
          });
        } else {
          await this.prisma.stakingPosition.updateMany({
            where: {
              walletAddress: address,
              chainId,
              stakingContract: pool.stakingContract,
            },
            data: {
              stakedAmount: '0',
              pendingReward: '0',
              status: 'UNSTAKED',
            },
          });
        }
      } catch (err) {
        this.logger.warn(`Could not sync staking position for pool ${pool.stakingContract}: ${err.message}`);
      }
    }

    return this.prisma.stakingPosition.findMany({
      where: { walletAddress: address, chainId, status: 'ACTIVE' },
    });
  }

  async createPendingStakingTransaction(dto: any) {
    return this.prisma.safe(() =>
      this.prisma.stakingTransaction.create({
        data: {
          walletAddress: dto.walletAddress.toLowerCase(),
          chainId: dto.chainId,
          stakingContract: dto.stakingContract.toLowerCase(),
          transactionType: dto.transactionType,
          tokenAddress: dto.tokenAddress.toLowerCase(),
          amount: dto.amount,
          rewardAmount: dto.rewardAmount || '0',
          transactionHash: dto.transactionHash,
          status: 'PENDING',
        },
      }),
    );
  }

  async confirmStakingTransaction(chainId: number, txHash: string) {
    const client = createPublicClient({
      chain: this.getViemChain(chainId),
      transport: http(),
    });

    try {
      if (txHash.startsWith('0xmock') || process.env.SWAP_MOCK === 'true') {
        const pending = await this.prisma.stakingTransaction.findUnique({
          where: { transactionHash: txHash },
        });
        const status = 'CONFIRMED';
        const updated = await this.prisma.stakingTransaction.update({
          where: { transactionHash: txHash },
          data: {
            status,
            blockNumber: 0,
            gasUsed: '150000',
            gasCost: '0.00015',
            confirmedAt: new Date(),
          },
        });

        if (pending) {
          const user = await this.prisma.user.findUnique({
            where: { walletAddress: pending.walletAddress.toLowerCase() },
          });

          await this.prisma.transactionRecord.upsert({
            where: { txHash },
            create: {
              txHash,
              network: chainId === 84532 ? 'base-sepolia' : 'base-mainnet',
              chainId,
              type: pending.transactionType,
              status: 'CONFIRMED',
              userId: user?.id,
              details: JSON.stringify({
                stakingContract: pending.stakingContract,
                amount: pending.amount,
                rewardAmount: pending.rewardAmount,
              }),
            },
            update: { status: 'CONFIRMED' },
          });

          await this.getStakingPositions(pending.walletAddress, chainId);
        }
        return updated;
      }

      const receipt = await client.getTransactionReceipt({ hash: txHash as `0x${string}` });
      const status = receipt.status === 'success' ? 'CONFIRMED' : 'FAILED';

      const updated = await this.prisma.stakingTransaction.update({
        where: { transactionHash: txHash },
        data: {
          status,
          blockNumber: Number(receipt.blockNumber),
          gasUsed: receipt.gasUsed.toString(),
          gasCost: (receipt.gasUsed * receipt.effectiveGasPrice).toString(),
          confirmedAt: new Date(),
        },
      });

      if (status === 'CONFIRMED') {
        const user = await this.prisma.user.findUnique({
          where: { walletAddress: updated.walletAddress.toLowerCase() },
        });

        await this.prisma.transactionRecord.upsert({
          where: { txHash },
          create: {
            txHash,
            network: chainId === 84532 ? 'base-sepolia' : 'base-mainnet',
            chainId,
            type: updated.transactionType,
            status: 'CONFIRMED',
            userId: user?.id,
            details: JSON.stringify({
              stakingContract: updated.stakingContract,
              amount: updated.amount,
              rewardAmount: updated.rewardAmount,
            }),
          },
          update: { status: 'CONFIRMED' },
        });

        await this.getStakingPositions(updated.walletAddress, chainId);
      }

      return updated;
    } catch (e) {
      this.logger.error(`Error confirming staking tx ${txHash}: ${e.message}`);
      throw new BadRequestException(`Could not confirm transaction: ${e.message}`);
    }
  }

  async getStakingHistory(walletAddress: string) {
    return this.prisma.safe(() =>
      this.prisma.stakingTransaction.findMany({
        where: { walletAddress: walletAddress.toLowerCase() },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }
}
