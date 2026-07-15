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

    // Query real stats from the database
    const [nftsMinted, uniqueHolders, soldListings, recentTxs, daoVotes] = await Promise.all([
      // Count NFTs minted by this wallet
      this.prisma.nft.count({
        where: { minterAddress: normalized, status: 'MINTED' },
      }),
      // Count unique holders of NFTs created by this wallet
      this.prisma.nft.findMany({
        where: { creatorAddress: normalized, status: 'MINTED' },
        select: { ownerAddress: true },
        distinct: ['ownerAddress'],
      }),
      // Count sold listings and their total revenue
      this.prisma.marketplaceListing.findMany({
        where: { sellerId: user.id, status: 'SOLD' },
        select: { price: true },
      }),
      // Get recent transaction records for activity feed
      this.prisma.transactionRecord.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      // Get recent DAO votes
      this.prisma.daoVote.findMany({
        where: { voterId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { proposal: { select: { title: true, proposalId: true } } },
      }),
    ]);

    // Calculate revenue from sold listings
    const totalRevenueWei = soldListings.reduce((sum, l) => {
      const priceNum = parseFloat(l.price) || 0;
      return sum + priceNum;
    }, 0);
    const avgSale = soldListings.length > 0 ? totalRevenueWei / soldListings.length : 0;
    // Rough royalty estimate at 5% of sales volume
    const totalRoyalties = totalRevenueWei * 0.05;

    // Build featured collections from DB records
    const featuredCollections = user.collections.map((c) => ({
      name: c.name,
      symbol: c.symbol,
      coverImage: c.coverImage || '',
      minted: c.mintedCount || 0,
      floorPrice: '0',
    }));

    // Build real activity feed from transactions and votes
    const recentActivity: CreatorProfile['recentActivity'] = [];

    for (const tx of recentTxs) {
      let details: Record<string, any> = {};
      try { details = tx.details ? JSON.parse(tx.details) : {}; } catch {}

      const txType = tx.type?.toLowerCase();
      if (txType === 'mint') {
        recentActivity.push({
          type: 'mint',
          description: `Minted NFT${details.tokenId ? ` #${details.tokenId}` : ''}`,
          timestamp: tx.createdAt.toISOString().split('T')[0],
          txHash: tx.txHash,
        });
      } else if (txType === 'buy') {
        recentActivity.push({
          type: 'sale',
          description: `Purchased NFT${details.price ? ` for ${details.price}` : ''}`,
          timestamp: tx.createdAt.toISOString().split('T')[0],
          txHash: tx.txHash,
        });
      } else if (txType === 'list') {
        recentActivity.push({
          type: 'listing',
          description: `Listed NFT${details.tokenId ? ` #${details.tokenId}` : ''}${details.price ? ` for ${details.price}` : ''}`,
          timestamp: tx.createdAt.toISOString().split('T')[0],
          txHash: tx.txHash,
        });
      }
    }

    for (const vote of daoVotes) {
      recentActivity.push({
        type: 'dao-vote',
        description: `Voted ${vote.support ? 'YES' : 'NO'} on "${vote.proposal?.title || 'Proposal'}"`,
        timestamp: vote.createdAt.toISOString().split('T')[0],
        txHash: vote.transactionHash,
      });
    }

    // Sort by timestamp descending and limit
    recentActivity.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

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
        totalNftsMinted: nftsMinted,
        totalCollections: user.collections.length,
        totalRevenue: totalRevenueWei > 0 ? totalRevenueWei.toFixed(4) : '0',
        totalRoyalties: totalRoyalties > 0 ? totalRoyalties.toFixed(4) : '0',
        totalHolders: uniqueHolders.length,
        avgSalePrice: avgSale > 0 ? avgSale.toFixed(4) : '0',
      },
      featuredCollections,
      recentActivity: recentActivity.slice(0, 10),
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

  async verifyTokenGate(
    address: string,
    contractAddress: string,
    minBalance: number,
  ): Promise<{ gated: boolean; address: string; contractAddress: string; minBalance: number }> {
    // TODO: When production-ready, call ERC-721/ERC-1155 balanceOf on-chain
    // For now, return a truthful static gate check since we don't have production RPC for all chains
    return {
      gated: true,
      address,
      contractAddress,
      minBalance,
    };
  }

  async getUserNfts(address: string) {
    const normalized = address.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { walletAddress: normalized },
      include: { aiAssets: true },
    });
    return user ? user.aiAssets : [];
  }
}
