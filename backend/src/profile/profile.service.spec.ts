import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from './profile.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProfileService', () => {
  let service: ProfileService;

  const mockUser = {
    id: 'user-uuid-123',
    walletAddress: '0x1234567890123456789012345678901234567890',
    displayName: 'Creator 0x1234',
    bio: 'AI-powered NFT creator on the Web3 Creator Operating System.',
    avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=0x1234567890123456789012345678901234567890',
    bannerUrl: '',
    website: '',
    twitter: '',
    discord: '',
    instagram: '',
    verified: false,
    createdAt: new Date(),
    collections: [],
    listings: [],
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return existing user profile from DB', async () => {
      const address = '0x1234567890123456789012345678901234567890';
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getProfile(address);

      expect(result).toBeDefined();
      expect(result.address).toBe(mockUser.walletAddress);
      expect(result.displayName).toBe(mockUser.displayName);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { walletAddress: address.toLowerCase() },
        include: { collections: true, listings: true },
      });
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });

    it('should automatically create and return a new profile if user does not exist in DB', async () => {
      const address = '0x9999999999999999999999999999999999999999';
      const normalized = address.toLowerCase();

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        ...mockUser,
        walletAddress: normalized,
        displayName: 'Creator 9999',
        avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`,
      });

      const result = await service.getProfile(address);

      expect(result).toBeDefined();
      expect(result.address).toBe(normalized);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          walletAddress: normalized,
          displayName: `Creator ${address.substring(2, 6).toUpperCase()}`,
          bio: 'AI-powered NFT creator on the Web3 Creator Operating System.',
          avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`,
        },
        include: { collections: true, listings: true },
      });
    });
  });

  describe('updateProfile', () => {
    it('should upsert updated profile fields in DB', async () => {
      const address = '0x1234567890123456789012345678901234567890';
      const normalized = address.toLowerCase();
      const updateData = {
        displayName: 'Updated Name',
        bio: 'New Bio',
        website: 'https://newsite.com',
      };

      mockPrismaService.user.upsert.mockResolvedValue({
        ...mockUser,
        displayName: updateData.displayName,
        bio: updateData.bio,
        website: updateData.website,
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        displayName: updateData.displayName,
        bio: updateData.bio,
        website: updateData.website,
      });

      const result = await service.updateProfile(address, updateData as any);

      expect(result.displayName).toBe(updateData.displayName);
      expect(result.bio).toBe(updateData.bio);
      expect(result.website).toBe(updateData.website);
      expect(mockPrismaService.user.upsert).toHaveBeenCalledWith({
        where: { walletAddress: normalized },
        create: expect.objectContaining({
          walletAddress: normalized,
          displayName: updateData.displayName,
          bio: updateData.bio,
          website: updateData.website,
        }),
        update: expect.objectContaining({
          displayName: updateData.displayName,
          bio: updateData.bio,
          website: updateData.website,
        }),
      });
    });
  });
});
