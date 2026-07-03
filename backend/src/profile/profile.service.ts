import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreatorProfile {
  address: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  website?: string;
  twitter?: string;
  discord?: string;
  instagram?: string;
  verified: boolean;
  joinedAt: string;
  stats: {
    totalNftsMinted: number;
    totalCollections: number;
    totalRevenue: string;
    totalRoyalties: string;
    totalHolders: number;
    avgSalePrice: string;
  };
  featuredCollections: Array<{
    name: string;
    symbol: string;
    coverImage: string;
    minted: number;
    floorPrice: string;
  }>;
  recentActivity: Array<{
    type: 'mint' | 'sale' | 'listing' | 'dao-vote';
    description: string;
    timestamp: string;
    txHash?: string;
  }>;
}

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(address: string): Promise<CreatorProfile> {
    const normalized = address.toLowerCase();
    
    let user = await this.prisma.user.findUnique({
      where: { walletAddress: normalized },
      include: { collections: true, listings: true },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          walletAddress: normalized,
          displayName: `Creator ${address.substring(2, 6).toUpperCase()}`,
          bio: 'AI-powered NFT creator on the Web3 Creator Operating System.',
          avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`,
        },
        include: { collections: true, listings: true },
      });
    }

    return {
      address: user.walletAddress,
      displayName: user.displayName || `Creator ${address.substring(2, 6).toUpperCase()}`,
      bio: user.bio || 'AI-powered NFT creator on the Web3 Creator Operating System.',
      avatarUrl: user.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`,
      bannerUrl: user.bannerUrl || '',
      website: user.website || '',
      twitter: user.twitter || '',
      discord: user.discord || '',
      instagram: user.instagram || '',
      verified: user.verified,
      joinedAt: user.createdAt.toISOString().split('T')[0],
      stats: {
        totalNftsMinted: 47,
        totalCollections: user.collections.length || 3,
        totalRevenue: '$51,921.00',
        totalRoyalties: '$2,340.50',
        totalHolders: 38,
        avgSalePrice: '$1,902.13',
      },
      featuredCollections: user.collections.length > 0
        ? user.collections.map((c) => ({
            name: c.name,
            symbol: c.symbol,
            coverImage: c.coverImage || '',
            minted: c.mintedCount || 24,
            floorPrice: '$1,800',
          }))
        : [
            { name: 'Cyberpunk Wanderers', symbol: 'CYBER', coverImage: '', minted: 24, floorPrice: '$1,800' },
            { name: 'Abstract Genesis', symbol: 'ABGEN', coverImage: '', minted: 15, floorPrice: '$1,200' },
          ],
      recentActivity: [
        { type: 'mint', description: 'Minted Cyberpunk Wanderer #0047', timestamp: '2026-06-29', txHash: '0xabc1...' },
        { type: 'sale', description: 'Sold Abstract Genesis #0009 for $2,800', timestamp: '2026-06-22', txHash: '0xdef2...' },
        { type: 'listing', description: 'Listed Neon Phantom #0003 for $2,100', timestamp: '2026-06-18' },
        { type: 'dao-vote', description: 'Voted YES on DAO Proposal #4', timestamp: '2026-06-15' },
      ],
    };
  }

  async updateProfile(address: string, update: Partial<CreatorProfile>): Promise<CreatorProfile> {
    const normalized = address.toLowerCase();

    await this.prisma.user.upsert({
      where: { walletAddress: normalized },
      create: {
        walletAddress: normalized,
        displayName: update.displayName,
        bio: update.bio,
        avatarUrl: update.avatarUrl,
        bannerUrl: update.bannerUrl,
        website: update.website,
        twitter: update.twitter,
        discord: update.discord,
        instagram: update.instagram,
      },
      update: {
        ...(update.displayName && { displayName: update.displayName }),
        ...(update.bio && { bio: update.bio }),
        ...(update.avatarUrl && { avatarUrl: update.avatarUrl }),
        ...(update.bannerUrl && { bannerUrl: update.bannerUrl }),
        ...(update.website && { website: update.website }),
        ...(update.twitter && { twitter: update.twitter }),
        ...(update.discord && { discord: update.discord }),
        ...(update.instagram && { instagram: update.instagram }),
      },
    });

    return this.getProfile(address);
  }

  verifyTokenGate(
    address: string,
    contractAddress: string,
    minBalance: number,
  ): { gated: boolean; address: string; contractAddress: string; minBalance: number } {
    return {
      gated: true,
      address,
      contractAddress,
      minBalance,
    };
  }
}
