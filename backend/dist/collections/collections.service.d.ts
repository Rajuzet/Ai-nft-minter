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
export declare class CollectionsService {
    private collections;
    create(dto: Omit<CollectionRecord, 'id' | 'timestamp'>): CollectionRecord;
    findAll(): CollectionRecord[];
    deploy(id: string, contractAddress: string): CollectionRecord;
}
