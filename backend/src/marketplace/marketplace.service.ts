import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

export interface ListingRecord {
  id: string;
  nftAddress: string;
  tokenId: number;
  seller: string;
  price: string; // in Ether
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
  private listings: ListingRecord[] = [
    {
      id: 'list-1',
      nftAddress: '0x498e82d77C29FAf0605a96E3D4F59E9E0C1BEc3A',
      tokenId: 0,
      seller: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      price: '0.05',
      collectionName: 'AI Studio Collective',
      chain: 'base-sepolia',
      imageUrl: 'https://wcos-nft-assets.s3.amazonaws.com/mock-assets/default-logo.png',
      name: 'Neo Cyber Wanderer #001',
      description: 'First edition visual asset listed on WCOS Foundation.',
      status: 'LISTED',
      timestamp: new Date().toLocaleTimeString()
    }
  ];

  findAll(): ListingRecord[] {
    return this.listings.filter((l) => l.status === 'LISTED');
  }

  create(dto: Omit<ListingRecord, 'id' | 'status' | 'timestamp'>): ListingRecord {
    const newListing: ListingRecord = {
      ...dto,
      id: `list-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'LISTED',
      timestamp: new Date().toLocaleTimeString(),
    };
    this.listings.push(newListing);
    return newListing;
  }

  buy(id: string, buyer: string, txHash: string): ListingRecord {
    const listing = this.listings.find((l) => l.id === id);
    if (!listing) {
      throw new NotFoundException(`Listing with ID ${id} not found.`);
    }
    if (listing.status !== 'LISTED') {
      throw new BadRequestException('Listing is no longer active.');
    }
    listing.status = 'BOUGHT';
    listing.buyer = buyer;
    listing.txHash = txHash;
    return listing;
  }

  cancel(id: string): ListingRecord {
    const listing = this.listings.find((l) => l.id === id);
    if (!listing) {
      throw new NotFoundException(`Listing with ID ${id} not found.`);
    }
    if (listing.status !== 'LISTED') {
      throw new BadRequestException('Listing is no longer active.');
    }
    listing.status = 'CANCELLED';
    return listing;
  }
}
