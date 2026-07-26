import { Test, TestingModule } from '@nestjs/testing';
import { NftService } from './nft.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('NftService', () => {
  let service: NftService;

  const mockPrismaService = {
    nft: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NftService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<NftService>(NftService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('confirmMint', () => {
    it('should reject when transaction receipt is missing or fabricated', async () => {
      const mockPendingNft = {
        id: 'pending-nft-uuid',
        contractAddress: '0x498e82d77C29FAf0605a96E3D4F59E9E0C1BEc3A',
        chainId: 84532,
        ownerAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
        status: 'PENDING',
      };

      mockPrismaService.nft.findUnique.mockResolvedValue(mockPendingNft);

      const fakeTxHash = '0x1234567890123456789012345678901234567890123456789012345678901234';

      await expect(
        service.confirmMint(
          'pending-nft-uuid',
          {
            tokenId: 1,
            txHash: fakeTxHash,
            blockNumber: 123456,
          },
          '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
