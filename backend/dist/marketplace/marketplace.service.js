"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceService = void 0;
const common_1 = require("@nestjs/common");
let MarketplaceService = class MarketplaceService {
    constructor() {
        this.listings = [
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
    }
    findAll() {
        return this.listings.filter((l) => l.status === 'LISTED');
    }
    create(dto) {
        const newListing = {
            ...dto,
            id: `list-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            status: 'LISTED',
            timestamp: new Date().toLocaleTimeString(),
        };
        this.listings.push(newListing);
        return newListing;
    }
    buy(id, buyer, txHash) {
        const listing = this.listings.find((l) => l.id === id);
        if (!listing) {
            throw new common_1.NotFoundException(`Listing with ID ${id} not found.`);
        }
        if (listing.status !== 'LISTED') {
            throw new common_1.BadRequestException('Listing is no longer active.');
        }
        listing.status = 'BOUGHT';
        listing.buyer = buyer;
        listing.txHash = txHash;
        return listing;
    }
    cancel(id) {
        const listing = this.listings.find((l) => l.id === id);
        if (!listing) {
            throw new common_1.NotFoundException(`Listing with ID ${id} not found.`);
        }
        if (listing.status !== 'LISTED') {
            throw new common_1.BadRequestException('Listing is no longer active.');
        }
        listing.status = 'CANCELLED';
        return listing;
    }
};
exports.MarketplaceService = MarketplaceService;
exports.MarketplaceService = MarketplaceService = __decorate([
    (0, common_1.Injectable)()
], MarketplaceService);
//# sourceMappingURL=marketplace.service.js.map