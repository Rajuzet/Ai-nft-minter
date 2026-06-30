"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const marketplace_service_1 = require("./marketplace.service");
const class_validator_1 = require("class-validator");
class CreateListingDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'NFT Smart Contract Address', example: '0x...' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateListingDto.prototype, "nftAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Token ID of listed NFT', example: 1 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateListingDto.prototype, "tokenId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Seller wallet address', example: '0x...' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateListingDto.prototype, "seller", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Price in Ether', example: '0.1' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateListingDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Collection Name', example: 'Neo Wanderers' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateListingDto.prototype, "collectionName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Chain Name', example: 'base-sepolia' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateListingDto.prototype, "chain", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'NFT Image URL', example: 'https://image.png' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateListingDto.prototype, "imageUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'NFT Item Name', example: 'Cyberpunk Visor #04' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateListingDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'NFT Item Description', example: 'A futuristic visor.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateListingDto.prototype, "description", void 0);
class BuyListingDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Listing identifier ID', example: 'list-123' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], BuyListingDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Buyer wallet address', example: '0x...' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], BuyListingDto.prototype, "buyer", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'On-chain transaction hash', example: '0x...' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], BuyListingDto.prototype, "txHash", void 0);
class CancelListingDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Listing identifier ID', example: 'list-123' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CancelListingDto.prototype, "id", void 0);
let MarketplaceController = class MarketplaceController {
    constructor(marketplaceService) {
        this.marketplaceService = marketplaceService;
    }
    findAll() {
        return this.marketplaceService.findAll();
    }
    create(dto) {
        return this.marketplaceService.create(dto);
    }
    buy(dto) {
        return this.marketplaceService.buy(dto.id, dto.buyer, dto.txHash);
    }
    cancel(dto) {
        return this.marketplaceService.cancel(dto.id);
    }
};
exports.MarketplaceController = MarketplaceController;
__decorate([
    (0, common_1.Get)('listings'),
    (0, swagger_1.ApiOperation)({ summary: 'List all active marketplace listings' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Success' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MarketplaceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('list'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'List an NFT for fixed price' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Success' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateListingDto]),
    __metadata("design:returntype", void 0)
], MarketplaceController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('buy'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Purchase a listed NFT' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Success' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [BuyListingDto]),
    __metadata("design:returntype", void 0)
], MarketplaceController.prototype, "buy", null);
__decorate([
    (0, common_1.Post)('cancel'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel an active NFT listing' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Success' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CancelListingDto]),
    __metadata("design:returntype", void 0)
], MarketplaceController.prototype, "cancel", null);
exports.MarketplaceController = MarketplaceController = __decorate([
    (0, swagger_1.ApiTags)('Marketplace'),
    (0, common_1.Controller)('api/v1/marketplace'),
    __metadata("design:paramtypes", [marketplace_service_1.MarketplaceService])
], MarketplaceController);
//# sourceMappingURL=marketplace.controller.js.map