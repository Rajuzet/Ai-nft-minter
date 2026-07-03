import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateTxDto {
  walletAddress?: string;
  txHash: string;
  network: string;
  type: 'MINT' | 'LIST' | 'BUY' | 'SWAP' | 'DEPLOY' | 'STAKE';
  status?: string;
  details?: Record<string, any>;
}

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTxDto) {
    if (!dto.txHash || !dto.network || !dto.type) {
      throw new BadRequestException('Transaction hash, network, and type are required');
    }

    let userId: string | undefined;
    if (dto.walletAddress) {
      const user = await this.prisma.user.findUnique({
        where: { walletAddress: dto.walletAddress.toLowerCase() },
      });
      userId = user?.id;
    }

    return this.prisma.transactionRecord.upsert({
      where: { txHash: dto.txHash },
      create: {
        txHash: dto.txHash,
        network: dto.network,
        type: dto.type,
        status: dto.status || 'CONFIRMED',
        details: dto.details || {},
        userId,
      },
      update: {
        status: dto.status || 'CONFIRMED',
        details: dto.details || {},
      },
    });
  }

  async findByWallet(walletAddress: string) {
    const user = await this.prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
    });

    if (!user) return [];

    return this.prisma.transactionRecord.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async findAll() {
    return this.prisma.transactionRecord.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
