import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { SiweMessage } from 'siwe';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    id: 'user-uuid-123',
    walletAddress: '0x1234567890123456789012345678901234567890',
    displayName: 'Creator 0x1234',
    avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=0x1234567890123456789012345678901234567890',
    nonce: 'securesiwenonce999',
    role: 'CREATOR',
    createdAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getNonce', () => {
    it('should generate a cryptographically secure SIWE nonce', async () => {
      const result = await service.getNonce();
      expect(result).toBeDefined();
      expect(result.nonce).toBeDefined();
      expect(typeof result.nonce).toBe('string');
      expect(result.nonce.length).toBeGreaterThan(10);
    });

    it('should upsert user with the generated nonce', async () => {
      const address = '0x1234567890123456789012345678901234567890';
      const normalized = address.toLowerCase();

      mockPrismaService.user.upsert.mockResolvedValue(mockUser);

      const result = await service.getNonce(address);

      expect(result.address).toBe(normalized);
      expect(mockPrismaService.user.upsert).toHaveBeenCalledWith({
        where: { walletAddress: normalized },
        create: {
          walletAddress: normalized,
          nonce: expect.any(String),
          displayName: 'Creator 0x1234',
        },
        update: {
          nonce: expect.any(String),
        },
      });
    });
  });

  describe('verifySignature', () => {
    const validMessage = new SiweMessage({
      domain: 'localhost:3000',
      address: mockUser.walletAddress,
      statement: 'Sign in to AI NFT Studio Collective (WCOS).',
      uri: 'http://localhost:3000',
      version: '1',
      chainId: 84532,
      nonce: 'securesiwenonce999',
      issuedAt: new Date().toISOString(),
    }).prepareMessage();

    it('should throw BadRequestException if address or signature is missing', async () => {
      await expect(
        service.verifySignature({ walletAddress: '', signature: '0xsig' }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.verifySignature({ walletAddress: '0x1234', signature: '' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if user does not exist in DB', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.verifySignature({
          walletAddress: '0x1234567890123456789012345678901234567890',
          signature: '0xsig',
          message: validMessage,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if nonce has expired or already been used', async () => {
      const userWithoutNonce = { ...mockUser, nonce: null };
      mockPrismaService.user.findUnique.mockResolvedValue(userWithoutNonce);

      await expect(
        service.verifySignature({
          walletAddress: mockUser.walletAddress,
          signature: '0xsig',
          message: validMessage,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if message nonce does not match DB nonce', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      const invalidNonceMessage = validMessage.replace('securesiwenonce999', 'differentnonce');

      await expect(
        service.verifySignature({
          walletAddress: mockUser.walletAddress,
          signature: '0xsig',
          message: invalidNonceMessage,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should successfully verify SIWE signature and return JWT token + user details', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        nonce: null,
      });

      // Spy on SiweMessage prototype verify method to mock EIP-4361 signature verification
      const verifySpy = jest
        .spyOn(SiweMessage.prototype, 'verify')
        .mockResolvedValue({
          success: true,
          data: {
            address: mockUser.walletAddress,
            nonce: mockUser.nonce,
          } as any,
        });

      const result = await service.verifySignature({
        walletAddress: mockUser.walletAddress,
        signature: '0xvalid-signature',
        message: validMessage,
      });

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.user).toEqual({
        id: mockUser.id,
        walletAddress: mockUser.walletAddress,
        displayName: mockUser.displayName,
        avatarUrl: mockUser.avatarUrl,
        role: mockUser.role,
        createdAt: mockUser.createdAt,
      });

      // Nonce cleared check to prevent replay attacks
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { nonce: null },
      });

      verifySpy.mockRestore();
    });
  });

  describe('logout', () => {
    it('should clear user nonce in database', async () => {
      mockPrismaService.user.updateMany.mockResolvedValue({ count: 1 });
      const result = await service.logout(mockUser.walletAddress);

      expect(result.success).toBe(true);
      expect(mockPrismaService.user.updateMany).toHaveBeenCalledWith({
        where: { walletAddress: mockUser.walletAddress.toLowerCase() },
        data: { nonce: null },
      });
    });
  });
});
