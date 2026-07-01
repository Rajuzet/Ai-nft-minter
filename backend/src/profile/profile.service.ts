import { Injectable, NotFoundException } from '@nestjs/common';

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

// In-memory store (production: replace with database)
const profileStore = new Map<string, Partial<CreatorProfile>>();

@Injectable()
export class ProfileService {

  getProfile(address: string): CreatorProfile {
    const stored = profileStore.get(address.toLowerCase()) || {};
    // Merge with simulated on-chain data
    return {
      address,
      displayName: stored.displayName || `Creator ${address.substring(2, 6).toUpperCase()}`,
      bio: stored.bio || 'AI-powered NFT creator on the Web3 Creator Operating System.',
      avatarUrl: stored.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`,
      bannerUrl: stored.bannerUrl || '',
      website: stored.website || '',
      twitter: stored.twitter || '',
      discord: stored.discord || '',
      instagram: stored.instagram || '',
      verified: false,
      joinedAt: '2026-01-15',
      stats: {
        totalNftsMinted: 47,
        totalCollections: 3,
        totalRevenue: '$51,921.00',
        totalRoyalties: '$2,340.50',
        totalHolders: 38,
        avgSalePrice: '$1,902.13',
      },
      featuredCollections: [
        { name: 'Cyberpunk Wanderers', symbol: 'CYBER', coverImage: '', minted: 24, floorPrice: '$1,800' },
        { name: 'Abstract Genesis',   symbol: 'ABGEN', coverImage: '', minted: 15, floorPrice: '$1,200' },
        { name: 'Neon Phantoms',      symbol: 'NEON',  coverImage: '', minted: 8,  floorPrice: '$1,400' },
      ],
      recentActivity: [
        { type: 'mint',     description: 'Minted Cyberpunk Wanderer #0047',       timestamp: '2026-06-29', txHash: '0xabc1...' },
        { type: 'sale',     description: 'Sold Abstract Genesis #0009 for $2,800', timestamp: '2026-06-22', txHash: '0xdef2...' },
        { type: 'listing',  description: 'Listed Neon Phantom #0003 for $2,100',   timestamp: '2026-06-18' },
        { type: 'dao-vote', description: 'Voted YES on DAO Proposal #4',           timestamp: '2026-06-15' },
      ],
    };
  }

  updateProfile(address: string, update: Partial<CreatorProfile>): CreatorProfile {
    const key = address.toLowerCase();
    const existing = profileStore.get(key) || {};
    profileStore.set(key, { ...existing, ...update });
    return this.getProfile(address);
  }

  verifyTokenGate(
    address: string,
    contractAddress: string,
    minBalance: number,
  ): { gated: boolean; address: string; contractAddress: string; minBalance: number } {
    // Production: use Alchemy/ethers.js to check on-chain balance.
    // Testnet simulation: allow all connected wallets.
    return {
      gated: true,
      address,
      contractAddress,
      minBalance,
    };
  }
}
