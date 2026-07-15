import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createPublicClient, http } from 'viem';
import { baseSepolia, base, mainnet, polygon, arbitrum, optimism } from 'viem/chains';

export interface CreateTxDto {
  walletAddress?: string;
  txHash: string;
  network: string;
  chainId?: number;
  type: 'MINT' | 'LIST' | 'BUY' | 'SWAP' | 'DEPLOY' | 'STAKE';
  status?: string;
  details?: Record<string, any>;
}

export interface TxRecord {
  id: string;
  txHash: string;
  network: string;
  chainId: number;
  type: string;
  status: string;
  details: Record<string, any> | null;
  userId: string | null;
  createdAt: Date;
}

const TX_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/;

function getViemChain(chainId: number) {
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

function getRpcUrl(chainId: number): string {
  switch (chainId) {
    case 84532: return process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';
    case 8453: return process.env.BASE_MAINNET_RPC_URL || 'https://mainnet.base.org';
    case 1: return process.env.ETH_MAINNET_RPC_URL || 'https://eth.llamarpc.com';
    case 137: return process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';
    case 42161: return process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc';
    case 10: return process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io';
    default: return process.env.RPC_URL || 'https://sepolia.base.org';
  }
}

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verify a transaction receipt on-chain via RPC.
   * Returns the receipt status and metadata if found, or null if the tx is still pending.
   */
  private async verifyOnChainReceipt(txHash: string, chainId: number): Promise<{
    status: 'CONFIRMED' | 'FAILED';
    blockNumber: number;
    gasUsed: string;
  } | null> {
    try {
      const client = createPublicClient({
        chain: getViemChain(chainId),
        transport: http(getRpcUrl(chainId)),
      });

      const receipt = await client.getTransactionReceipt({
        hash: txHash as `0x${string}`,
      });

      if (!receipt) return null;

      return {
        status: receipt.status === 'success' ? 'CONFIRMED' : 'FAILED',
        blockNumber: Number(receipt.blockNumber),
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (err: any) {
      // Receipt not found yet (pending) or RPC error — don't block the flow
      this.logger.warn(`On-chain receipt lookup for ${txHash} on chain ${chainId}: ${err.message}`);
      return null;
    }
  }

  async create(dto: CreateTxDto): Promise<TxRecord> {
    if (!dto.txHash || !dto.network || !dto.type) {
      throw new BadRequestException('txHash, network, and type are required');
    }

    // Validate transaction hash format
    if (!TX_HASH_REGEX.test(dto.txHash)) {
      throw new BadRequestException('Invalid transaction hash format. Must be a 0x-prefixed 64-character hex string.');
    }

    const chainId = dto.chainId ?? 84532;

    // Verify on-chain receipt
    const receipt = await this.verifyOnChainReceipt(dto.txHash, chainId);
    const resolvedStatus = receipt?.status ?? dto.status ?? 'PENDING';

    // Resolve userId from walletAddress if provided
    let userId: string | undefined;
    if (dto.walletAddress) {
      const user = await this.prisma.safe(() =>
        this.prisma.user.findUnique({
          where: { walletAddress: dto.walletAddress!.toLowerCase() },
        }),
      );
      userId = user?.id;
    }

    const detailsObj = {
      ...(dto.details ?? {}),
      ...(receipt ? {
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        onChainVerified: true,
      } : {
        onChainVerified: false,
      }),
    };
    const detailsStr = JSON.stringify(detailsObj);

    const record = await this.prisma.safe(() =>
      this.prisma.transactionRecord.upsert({
        where: { txHash: dto.txHash },
        create: {
          txHash: dto.txHash,
          network: dto.network,
          chainId,
          type: dto.type,
          status: resolvedStatus,
          details: detailsStr,
          userId,
        },
        update: {
          status: resolvedStatus,
          chainId,
          details: detailsStr,
        },
      }),
    );

    if (!record) {
      this.logger.warn(`DB unavailable — transaction ${dto.txHash} not persisted`);
      return {
        id: `mem-${Date.now()}`,
        txHash: dto.txHash,
        network: dto.network,
        chainId,
        type: dto.type,
        status: resolvedStatus,
        details: detailsObj,
        userId: null,
        createdAt: new Date(),
      };
    }

    return this.deserialize(record);
  }

  async findByWallet(walletAddress: string): Promise<TxRecord[]> {
    if (!walletAddress || !walletAddress.startsWith('0x')) {
      throw new BadRequestException('A valid 0x wallet address is required.');
    }

    const user = await this.prisma.safe(() =>
      this.prisma.user.findUnique({
        where: { walletAddress: walletAddress.toLowerCase() },
      }),
    );
    if (!user) return [];

    const records = await this.prisma.safe(() =>
      this.prisma.transactionRecord.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    );
    return (records ?? []).map(this.deserialize);
  }

  async findAll(page = 1, limit = 50): Promise<{ records: TxRecord[]; total: number }> {
    const skip = (page - 1) * limit;
    const take = Math.min(limit, 100);

    const [records, total] = await Promise.all([
      this.prisma.safe(() =>
        this.prisma.transactionRecord.findMany({
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
      ),
      this.prisma.safe(() => this.prisma.transactionRecord.count()),
    ]);

    return {
      records: (records ?? []).map(this.deserialize),
      total: total ?? 0,
    };
  }

  /** Parse stored JSON string back to object for API responses */
  private deserialize(record: any): TxRecord {
    let details: Record<string, any> | null = null;
    if (record.details) {
      try {
        details = JSON.parse(record.details);
      } catch {
        details = { raw: record.details };
      }
    }
    return { ...record, details };
  }
}
