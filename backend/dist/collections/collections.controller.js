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
exports.CollectionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const collections_service_1 = require("./collections.service");
const class_validator_1 = require("class-validator");
class CreateCollectionDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Collection name', example: 'Neo Wanderers' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCollectionDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Collection symbol', example: 'NEOW' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCollectionDto.prototype, "symbol", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Collection description', example: 'Obsidian collection' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCollectionDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Logo URL', example: 'https://logo.png' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCollectionDto.prototype, "logoUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Banner URL', example: 'https://banner.png' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCollectionDto.prototype, "bannerUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Category', example: 'art' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCollectionDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Royalty fee percentage (e.g. 5 for 5%)', example: 5 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateCollectionDto.prototype, "royaltyPercentage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Royalty payout receiver address', example: '0x0...' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCollectionDto.prototype, "royaltyReceiver", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Max token supply limit', example: 1000 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateCollectionDto.prototype, "maxSupply", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Deployment network chain target', example: 'base-sepolia' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCollectionDto.prototype, "chain", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'EVM Token collection standard', example: 'ERC-721' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCollectionDto.prototype, "contractType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Deployment status', example: 'DRAFT' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCollectionDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Deployed contract address', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCollectionDto.prototype, "contractAddress", void 0);
class DeployCollectionDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Collection record ID', example: 'col-123' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], DeployCollectionDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Deployed contract address on-chain', example: '0x...' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], DeployCollectionDto.prototype, "contractAddress", void 0);
let CollectionsController = class CollectionsController {
    constructor(collectionsService) {
        this.collectionsService = collectionsService;
    }
    findAll() {
        return this.collectionsService.findAll();
    }
    create(dto) {
        return this.collectionsService.create(dto);
    }
    deploy(dto) {
        return this.collectionsService.deploy(dto.id, dto.contractAddress);
    }
};
exports.CollectionsController = CollectionsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all registered creator collections' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Success' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CollectionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Register a new collection profile or draft' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Success' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateCollectionDto]),
    __metadata("design:returntype", void 0)
], CollectionsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('deploy'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Update collection status to deployed with contract address' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Success' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [DeployCollectionDto]),
    __metadata("design:returntype", void 0)
], CollectionsController.prototype, "deploy", null);
exports.CollectionsController = CollectionsController = __decorate([
    (0, swagger_1.ApiTags)('Collections'),
    (0, common_1.Controller)('api/v1/collections'),
    __metadata("design:paramtypes", [collections_service_1.CollectionsService])
], CollectionsController);
//# sourceMappingURL=collections.controller.js.map