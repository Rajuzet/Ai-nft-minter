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
export declare class MarketplaceService {
    private listings;
    findAll(): ListingRecord[];
    create(dto: Omit<ListingRecord, 'id' | 'status' | 'timestamp'>): ListingRecord;
    buy(id: string, buyer: string, txHash: string): ListingRecord;
    cancel(id: string): ListingRecord;
}
