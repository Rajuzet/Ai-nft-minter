import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ListingRecord {
  id: string;
  nftAddress: string;
  tokenId: number;
  seller: string;
  price: string;
  collectionName: string;
  chain: string;
  imageUrl: string;
  name: string;
  description: string;
  status: 'LISTED' | 'BOUGHT' | 'CANCELLED';
  buyer?: string;
  txHash?: string;
  timestamp: string;
}

@Injectable()
export class MarketplaceService {
  constructor(private readonly prisma: PrismaService) {}

  private defaultListing: ListingRecord = {
    id: 'list-1',
    nftAddress: '0x498e82d77C29FAf0605a96E3D4F59E9E0C1BEc3A',
    tokenId: 0,
    seller: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    price: '0.05',
    collectionName: 'AI Studio Collective',
    chain: 'base-sepolia',
    imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=MarketItem1',
    name: 'Neo Cyber Wanderer #001',
    description: 'First edition visual asset listed on WCOS Foundation.',
    status: 'LISTED',
    timestamp: new Date().toISOString(),
  };

  async findAll(): Promise<ListingRecord[]> {
    const listings = await this.prisma.marketplaceListing.findMany({
      where: { status: 'ACTIVE' },
      include: { seller: true, buyer: true },
      orderBy: { createdAt: 'desc' },
    });

    if (listings.length === 0) {
      return [this.defaultListing];
    }

    return listings.map((l) => ({
      id: l.id,
      nftAddress: l.nftAddress,
      tokenId: l.tokenId,
      seller: l.seller?.walletAddress || '0x0000000000000000000000000000000000000000',
      price: l.price,
      collectionName: l.collectionName,
      chain: l.chain,
      imageUrl: l.imageUrl,
      name: l.name,
      description: l.description,
      status: 'LISTED',
      buyer: l.buyer?.walletAddress,
      txHash: l.txHash || undefined,
      timestamp: l.createdAt.toISOString(),
    }));
  }

  async create(dto: Omit<ListingRecord, 'id' | 'status' | 'timestamp'>): Promise<ListingRecord> {
    const sellerAddress = dto.seller.toLowerCase();
    
    let seller = await this.prisma.user.findUnique({
      where: { walletAddress: sellerAddress },
    });

    if (!seller) {
      seller = await this.prisma.user.create({
        data: {
          walletAddress: sellerAddress,
          displayName: `Creator ${sellerAddress.substring(0, 6)}`,
        },
      });
    }

    const created = await this.prisma.marketplaceListing.create({
      data: {
        nftAddress: dto.nftAddress,
        tokenId: dto.tokenId,
        sellerId: seller.id,
        price: dto.price,
        collectionName: dto.collectionName,
        chain: dto.chain || 'base-sepolia',
        imageUrl: dto.imageUrl,
        name: dto.name,
        description: dto.description,
        status: 'ACTIVE',
      },
    });

    return {
      id: created.id,
      nftAddress: created.nftAddress,
      tokenId: created.tokenId,
      seller: seller.walletAddress,
      price: created.price,
      collectionName: created.collectionName,
      chain: created.chain,
      imageUrl: created.imageUrl,
      name: created.name,
      description: created.description,
      status: 'LISTED',
      timestamp: created.createdAt.toISOString(),
    };
  }

  async buy(id: string, buyerAddress: string, txHash: string): Promise<ListingRecord> {
    const normalizedBuyer = buyerAddress.toLowerCase();
    
    let buyer = await this.prisma.user.findUnique({
      where: { walletAddress: normalizedBuyer },
    });

    if (!buyer) {
      buyer = await this.prisma.user.create({
        data: {
          walletAddress: normalizedBuyer,
          displayName: `Collector ${normalizedBuyer.substring(0, 6)}`,
        },
      });
    }

    try {
      const updated = await this.prisma.marketplaceListing.update({
        where: { id },
        data: {
          status: 'SOLD',
          buyerId: buyer.id,
          txHash,
        },
        include: { seller: true },
      });

      // Record transaction
      await this.prisma.transactionRecord.create({
        data: {
          txHash,
          network: updated.chain,
          type: 'BUY',
          userId: buyer.id,
          details: { listingId: updated.id, price: updated.price, tokenId: updated.tokenId },
        },
      });

      return {
        id: updated.id,
        nftAddress: updated.nftAddress,
        tokenId: updated.tokenId,
        seller: updated.seller?.walletAddress || '0x0000000000000000000000000000000000000000',
        price: updated.price,
        collectionName: updated.collectionName,
        chain: updated.chain,
        imageUrl: updated.imageUrl,
        name: updated.name,
        description: updated.description,
        status: 'BOUGHT',
        buyer: buyer.walletAddress,
        txHash,
        timestamp: updated.updatedAt.toISOString(),
      };
    } catch {
      throw new NotFoundException(`Listing with ID ${id} not found.`);
    }
  }

  async cancel(id: string): Promise<ListingRecord> {
    try {
      const updated = await this.prisma.marketplaceListing.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: { seller: true },
      });

      return {
        id: updated.id,
        nftAddress: updated.nftAddress,
        tokenId: updated.tokenId,
        seller: updated.seller?.walletAddress || '0x0000000000000000000000000000000000000000',
        price: updated.price,
        collectionName: updated.collectionName,
        chain: updated.chain,
        imageUrl: updated.imageUrl,
        name: updated.name,
        description: updated.description,
        status: 'CANCELLED',
        timestamp: updated.updatedAt.toISOString(),
      };
    } catch {
      throw new NotFoundException(`Listing with ID ${id} not found.`);
    }
  }
}
