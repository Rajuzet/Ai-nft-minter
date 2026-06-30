import { CollectionsService, CollectionRecord } from './collections.service';
declare class CreateCollectionDto {
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
    status: 'DRAFT' | 'DEPLOYED' | 'DEPLOYING';
    contractAddress?: string;
}
declare class DeployCollectionDto {
    id: string;
    contractAddress: string;
}
export declare class CollectionsController {
    private readonly collectionsService;
    constructor(collectionsService: CollectionsService);
    findAll(): CollectionRecord[];
    create(dto: CreateCollectionDto): CollectionRecord;
    deploy(dto: DeployCollectionDto): CollectionRecord;
}
export {};
