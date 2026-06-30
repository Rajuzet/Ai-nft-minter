import { Injectable, NotFoundException } from '@nestjs/common';

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
  private collections: CollectionRecord[] = [
    {
      id: 'default-col-1',
      name: 'AI Studio Collective',
      symbol: 'AIS',
      description: 'The default collection for WCOS AI creations.',
      logoUrl: 'https://wcos-nft-assets.s3.amazonaws.com/mock-assets/default-logo.png',
      bannerUrl: 'https://wcos-nft-assets.s3.amazonaws.com/mock-assets/default-banner.png',
      category: 'art',
      royaltyPercentage: 5,
      royaltyReceiver: '0x0000000000000000000000000000000000000000',
      maxSupply: 10000,
      chain: 'base-sepolia',
      contractType: 'ERC-721',
      contractAddress: process.env.NEXT_PUBLIC_AINFT_MINTER_ADDRESS || '0x498e82d77C29FAf0605a96E3D4F59E9E0C1BEc3A',
      status: 'DEPLOYED',
      timestamp: new Date().toLocaleTimeString(),
    }
  ];

  create(dto: Omit<CollectionRecord, 'id' | 'timestamp'>): CollectionRecord {
    const newRecord: CollectionRecord = {
      ...dto,
      id: `col-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleTimeString(),
    };
    this.collections.push(newRecord);
    return newRecord;
  }

  findAll(): CollectionRecord[] {
    return this.collections;
  }

  deploy(id: string, contractAddress: string): CollectionRecord {
    const collection = this.collections.find((c) => c.id === id);
    if (!collection) {
      throw new NotFoundException(`Collection with ID ${id} not found.`);
    }
    collection.status = 'DEPLOYED';
    collection.contractAddress = contractAddress;
    return collection;
  }
}
