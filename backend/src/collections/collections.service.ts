import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CollectionRecord {
  id: string;
  name: string;
  symbol: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  category: string;
  royaltyPercentage: number;
  royaltyReceiver: string;
  maxSupply: number;
  chain: string;
  contractType: 'ERC-721' | 'ERC-1155';
  contractAddress?: string;
  status: 'DRAFT' | 'DEPLOYED' | 'DEPLOYING';
  timestamp: string;
}

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  private defaultCollection: CollectionRecord = {
    id: 'default-col-1',
    name: 'AI Studio Collective',
    symbol: 'AIS',
    description: 'The default collection for WCOS AI creations.',
    logoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=AISLogo',
    bannerUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=AISBanner',
    category: 'art',
    royaltyPercentage: 5,
    royaltyReceiver: '0x0000000000000000000000000000000000000000',
    maxSupply: 10000,
    chain: 'base-sepolia',
    contractType: 'ERC-721',
    contractAddress: process.env.NEXT_PUBLIC_AINFT_MINTER_ADDRESS || '0x498e82d77C29FAf0605a96E3D4F59E9E0C1BEc3A',
    status: 'DEPLOYED',
    timestamp: new Date().toISOString(),
  };

  async create(dto: Omit<CollectionRecord, 'id' | 'timestamp'>, ownerWalletAddress?: string): Promise<CollectionRecord> {
    const wallet = ownerWalletAddress ? ownerWalletAddress.toLowerCase() : '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
    
    let user = await this.prisma.user.findUnique({
      where: { walletAddress: wallet },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          walletAddress: wallet,
          displayName: `Creator ${wallet.substring(0, 6)}`,
        },
      });
    }

    const created = await this.prisma.nftCollection.create({
      data: {
        ownerId: user.id,
        contractAddress: dto.contractAddress || '0x498e82d77C29FAf0605a96E3D4F59E9E0C1BEc3A',
        network: dto.chain || 'base-sepolia',
        name: dto.name,
        symbol: dto.symbol,
        maxSupply: dto.maxSupply || 1000,
        royaltyBps: (dto.royaltyPercentage || 5) * 100,
        description: dto.description,
        coverImage: dto.logoUrl,
        status: dto.status || 'DEPLOYED',
      },
    });

    return {
      id: created.id,
      name: created.name,
      symbol: created.symbol,
      description: created.description || '',
      logoUrl: created.coverImage || this.defaultCollection.logoUrl,
      bannerUrl: this.defaultCollection.bannerUrl,
      category: dto.category || 'art',
      royaltyPercentage: created.royaltyBps / 100,
      royaltyReceiver: dto.royaltyReceiver || user.walletAddress,
      maxSupply: created.maxSupply,
      chain: created.network,
      contractType: dto.contractType || 'ERC-721',
      contractAddress: created.contractAddress,
      status: created.status as any,
      timestamp: created.createdAt.toISOString(),
    };
  }

  async findAll(): Promise<CollectionRecord[]> {
    const dbCollections = await this.prisma.nftCollection.findMany({
      include: { owner: true },
      orderBy: { createdAt: 'desc' },
    });

    if (dbCollections.length === 0) {
      return [this.defaultCollection];
    }

    return dbCollections.map((c) => ({
      id: c.id,
      name: c.name,
      symbol: c.symbol,
      description: c.description || '',
      logoUrl: c.coverImage || this.defaultCollection.logoUrl,
      bannerUrl: this.defaultCollection.bannerUrl,
      category: 'art',
      royaltyPercentage: c.royaltyBps / 100,
      royaltyReceiver: c.owner?.walletAddress || '0x0000000000000000000000000000000000000000',
      maxSupply: c.maxSupply,
      chain: c.network,
      contractType: 'ERC-721',
      contractAddress: c.contractAddress,
      status: c.status as any,
      timestamp: c.createdAt.toISOString(),
    }));
  }

  async findByOwner(address: string): Promise<CollectionRecord[]> {
    const normalized = address.toLowerCase();
    const dbCollections = await this.prisma.nftCollection.findMany({
      where: { owner: { walletAddress: normalized } },
      include: { owner: true },
      orderBy: { createdAt: 'desc' },
    });

    return dbCollections.map((c) => ({
      id: c.id,
      name: c.name,
      symbol: c.symbol,
      description: c.description || '',
      logoUrl: c.coverImage || this.defaultCollection.logoUrl,
      bannerUrl: this.defaultCollection.bannerUrl,
      category: 'art',
      royaltyPercentage: c.royaltyBps / 100,
      royaltyReceiver: c.owner?.walletAddress || normalized,
      maxSupply: c.maxSupply,
      chain: c.network,
      contractType: 'ERC-721',
      contractAddress: c.contractAddress,
      status: c.status as any,
      timestamp: c.createdAt.toISOString(),
    }));
  }

  async deploy(id: string, contractAddress: string, ownerWalletAddress?: string): Promise<CollectionRecord> {
    const collection = await this.prisma.nftCollection.findUnique({
      where: { id },
      include: { owner: true },
    });

    if (!collection) {
      throw new NotFoundException(`Collection with ID ${id} not found.`);
    }

    if (ownerWalletAddress && collection.owner?.walletAddress.toLowerCase() !== ownerWalletAddress.toLowerCase()) {
      throw new ForbiddenException('You do not own this collection.');
    }

    const updated = await this.prisma.nftCollection.update({
      where: { id },
      data: {
        contractAddress,
        status: 'DEPLOYED',
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      symbol: updated.symbol,
      description: updated.description || '',
      logoUrl: updated.coverImage || this.defaultCollection.logoUrl,
      bannerUrl: this.defaultCollection.bannerUrl,
      category: 'art',
      royaltyPercentage: updated.royaltyBps / 100,
      royaltyReceiver: '0x0000000000000000000000000000000000000000',
      maxSupply: updated.maxSupply,
      chain: updated.network,
      contractType: 'ERC-721',
      contractAddress: updated.contractAddress,
      status: 'DEPLOYED',
      timestamp: updated.createdAt.toISOString(),
    };
  }
}
