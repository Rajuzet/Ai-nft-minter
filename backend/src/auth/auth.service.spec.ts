import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { SiweMessage } from 'siwe';
import * as crypto from 'crypto';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    id: 'user-uuid-123',
    walletAddress: '0x1234567890123456789012345678901234567890',
    displayName: 'Creator 0x1234',
    avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=0x1234567890123456789012345678901234567890',
    role: 'CREATOR',
    createdAt: new Date(),
  };

  const mockNonceRecord = {
    id: 'nonce-id-999',
    walletAddress: '0x1234567890123456789012345678901234567890',
    normalizedWallet: '0x1234567890123456789012345678901234567890',
    nonceHash: crypto.createHash('sha256').update('securesiwenonce999').digest('hex'),
    domain: 'localhost:3000',
    chainId: 84532,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiration
    consumedAt: null,
    createdAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    authenticationNonce: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    safe: jest.fn((callback) => callback()),
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

    it('should upsert user and store nonce record in DB', async () => {
      const address = '0x1234567890123456789012345678901234567890';
      const normalized = address.toLowerCase();

      mockPrismaService.user.upsert.mockResolvedValue(mockUser);
      mockPrismaService.authenticationNonce.create.mockResolvedValue(mockNonceRecord);

      const result = await service.getNonce(address);

      expect(result.address).toBe(normalized);
      expect(mockPrismaService.user.upsert).toHaveBeenCalledWith({
        where: { walletAddress: normalized },
        create: {
          walletAddress: normalized,
          displayName: 'Creator 0x1234',
          role: 'CREATOR',
        },
        update: {},
      });
      expect(mockPrismaService.authenticationNonce.create).toHaveBeenCalledWith({
        data: {
          walletAddress: address,
          normalizedWallet: normalized,
          nonceHash: expect.any(String),
          domain: 'localhost:3000',
          expiresAt: expect.any(Date),
        },
      });
    });
  });

  describe('verifySignature', () => {
    const validMessageObj = new SiweMessage({
      domain: 'localhost:3000',
      address: mockUser.walletAddress,
      statement: 'Sign in to AI NFT Studio Collective (WCOS).',
      uri: 'http://localhost:3000',
      version: '1',
      chainId: 84532,
      nonce: 'securesiwenonce999',
      issuedAt: new Date().toISOString(),
    });
    const validMessage = validMessageObj.prepareMessage();

    it('should throw BadRequestException if address or signature is missing', async () => {
      await expect(
        service.verifySignature({ walletAddress: '', signature: '0xsig', message: validMessage }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.verifySignature({ walletAddress: '0x1234', signature: '', message: validMessage }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if nonce has expired', async () => {
      const expiredNonceRecord = {
        ...mockNonceRecord,
        expiresAt: new Date(Date.now() - 1000), // 1 second ago
      };
      mockPrismaService.authenticationNonce.findUnique.mockResolvedValue(expiredNonceRecord);

      await expect(
        service.verifySignature({
          walletAddress: mockUser.walletAddress,
          signature: '0xsig',
          message: validMessage,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if nonce has already been consumed', async () => {
      const consumedNonceRecord = {
        ...mockNonceRecord,
        consumedAt: new Date(),
      };
      mockPrismaService.authenticationNonce.findUnique.mockResolvedValue(consumedNonceRecord);

      await expect(
        service.verifySignature({
          walletAddress: mockUser.walletAddress,
          signature: '0xsig',
          message: validMessage,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should successfully verify SIWE signature, consume nonce and register session', async () => {
      mockPrismaService.authenticationNonce.findUnique.mockResolvedValue(mockNonceRecord);
      mockPrismaService.authenticationNonce.update.mockResolvedValue({
        ...mockNonceRecord,
        consumedAt: new Date(),
      });
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.session.create.mockResolvedValue({
        id: 'session-uuid-1',
        sessionToken: 'hashed-session-token',
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      // Spy on SiweMessage prototype verify method to mock EIP-4361 signature verification
      const verifySpy = jest
        .spyOn(SiweMessage.prototype, 'verify')
        .mockResolvedValue({
          success: true,
          data: {
            address: mockUser.walletAddress,
            nonce: 'securesiwenonce999',
            domain: 'localhost:3000',
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
      expect(mockPrismaService.authenticationNonce.update).toHaveBeenCalledWith({
        where: { id: mockNonceRecord.id },
        data: { consumedAt: expect.any(Date) },
      });

      // Session registered check
      expect(mockPrismaService.session.create).toHaveBeenCalledWith({
        data: {
          sessionToken: expect.any(String),
          userId: mockUser.id,
          expiresAt: expect.any(Date),
        },
      });

      verifySpy.mockRestore();
    });
  });

  describe('logout', () => {
    it('should revoke active session in database', async () => {
      mockPrismaService.session.updateMany.mockResolvedValue({ count: 1 });
      
      const result = await service.logout();
      expect(result.success).toBe(true);
    });
  });
});
