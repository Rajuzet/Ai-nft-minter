import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TransactionsService', () => {
  let service: TransactionsService;

  const mockPrismaService = {
    safe: jest.fn((fn) => fn()),
    user: {
      findUnique: jest.fn().mockResolvedValue({ id: 'user-123', walletAddress: '0x1234567890123456789012345678901234567890' }),
    },
    transactionRecord: {
      upsert: jest.fn().mockResolvedValue({
        id: 'tx-1',
        txHash: '0x1234567890123456789012345678901234567890123456789012345678901234',
        network: 'base-sepolia',
        type: 'MINT',
        status: 'CONFIRMED',
        details: JSON.stringify({ tokenId: 1 }),
        userId: 'user-123',
        createdAt: new Date(),
      }),
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should record a mint transaction hash', async () => {
    const result = await service.create({
      txHash: '0x1234567890123456789012345678901234567890123456789012345678901234',
      network: 'base-sepolia',
      type: 'MINT',
      walletAddress: '0x1234567890123456789012345678901234567890',
      details: { tokenId: 1 },
    });

    expect(result).toBeDefined();
    expect(result.txHash).toBe('0x1234567890123456789012345678901234567890123456789012345678901234');
    expect(result.type).toBe('MINT');
  });
});
