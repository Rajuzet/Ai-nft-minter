import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTxDto): Promise<TxRecord> {
    if (!dto.txHash || !dto.network || !dto.type) {
      throw new BadRequestException('txHash, network, and type are required');
    }

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

    const detailsStr = JSON.stringify(dto.details ?? {});

    const record = await this.prisma.safe(() =>
      this.prisma.transactionRecord.upsert({
        where: { txHash: dto.txHash },
        create: {
          txHash: dto.txHash,
          network: dto.network,
          chainId: dto.chainId ?? 84532,
          type: dto.type,
          status: dto.status ?? 'CONFIRMED',
          details: detailsStr,
          userId,
        },
        update: {
          status: dto.status ?? 'CONFIRMED',
          chainId: dto.chainId ?? 84532,
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
        chainId: dto.chainId ?? 84532,
        type: dto.type,
        status: dto.status ?? 'CONFIRMED',
        details: dto.details ?? null,
        userId: null,
        createdAt: new Date(),
      };
    }

    return this.deserialize(record);
  }

  async findByWallet(walletAddress: string): Promise<TxRecord[]> {
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

  async findAll(): Promise<TxRecord[]> {
    const records = await this.prisma.safe(() =>
      this.prisma.transactionRecord.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    );
    return (records ?? []).map(this.deserialize);
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
