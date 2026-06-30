"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectionsService = void 0;
const common_1 = require("@nestjs/common");
let CollectionsService = class CollectionsService {
    constructor() {
        this.collections = [
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
    }
    create(dto) {
        const newRecord = {
            ...dto,
            id: `col-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            timestamp: new Date().toLocaleTimeString(),
        };
        this.collections.push(newRecord);
        return newRecord;
    }
    findAll() {
        return this.collections;
    }
    deploy(id, contractAddress) {
        const collection = this.collections.find((c) => c.id === id);
        if (!collection) {
            throw new common_1.NotFoundException(`Collection with ID ${id} not found.`);
        }
        collection.status = 'DEPLOYED';
        collection.contractAddress = contractAddress;
        return collection;
    }
};
exports.CollectionsService = CollectionsService;
exports.CollectionsService = CollectionsService = __decorate([
    (0, common_1.Injectable)()
], CollectionsService);
//# sourceMappingURL=collections.service.js.map