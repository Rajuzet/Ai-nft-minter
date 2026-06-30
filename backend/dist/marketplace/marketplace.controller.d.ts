import { MarketplaceService, ListingRecord } from './marketplace.service';
declare class CreateListingDto {
    nftAddress: string;
    tokenId: number;
    seller: string;
    price: string;
    collectionName: string;
    chain: string;
    imageUrl: string;
    name: string;
    description: string;
}
declare class BuyListingDto {
    id: string;
    buyer: string;
    txHash: string;
}
declare class CancelListingDto {
    id: string;
}
export declare class MarketplaceController {
    private readonly marketplaceService;
    constructor(marketplaceService: MarketplaceService);
    findAll(): ListingRecord[];
    create(dto: CreateListingDto): ListingRecord;
    buy(dto: BuyListingDto): ListingRecord;
    cancel(dto: CancelListingDto): ListingRecord;
}
export {};
