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
exports.AiStudioController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const ai_studio_service_1 = require("./ai-studio.service");
const class_validator_1 = require("class-validator");
class CustomMetadataInputDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'NFT metadata name', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CustomMetadataInputDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'NFT metadata description', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CustomMetadataInputDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'NFT category classification', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CustomMetadataInputDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'NFT custom traits array', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CustomMetadataInputDto.prototype, "traits", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Royalty fee percentage', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CustomMetadataInputDto.prototype, "royaltyPercentage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'External project URL link', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CustomMetadataInputDto.prototype, "externalUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Details of any unlockable content', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CustomMetadataInputDto.prototype, "unlockableContent", void 0);
class GenerateArtDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The prompt text to generate the AI image', example: 'A futuristic cybernetic operating system logo' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GenerateArtDto.prototype, "prompt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Storage destination target (s3 or ipfs)', example: 's3', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GenerateArtDto.prototype, "storage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Custom metadata parameters', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", CustomMetadataInputDto)
], GenerateArtDto.prototype, "customMetadata", void 0);
let AiStudioController = class AiStudioController {
    constructor(aiStudioService) {
        this.aiStudioService = aiStudioService;
    }
    async generateArtLegacy(dto) {
        return this.aiStudioService.generateArt(dto.prompt, dto.storage || 's3', dto.customMetadata);
    }
    async generateArt(dto) {
        return this.aiStudioService.generateArt(dto.prompt, dto.storage || 's3', dto.customMetadata);
    }
};
exports.AiStudioController = AiStudioController;
__decorate([
    (0, common_1.Post)('api/generate-art'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Generate AI Art and upload metadata (Legacy endpoint)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Success' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [GenerateArtDto]),
    __metadata("design:returntype", Promise)
], AiStudioController.prototype, "generateArtLegacy", null);
__decorate([
    (0, common_1.Post)('api/v1/ai/generate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Generate AI Art and upload metadata (WCOS standard endpoint)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Success' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [GenerateArtDto]),
    __metadata("design:returntype", Promise)
], AiStudioController.prototype, "generateArt", null);
exports.AiStudioController = AiStudioController = __decorate([
    (0, swagger_1.ApiTags)('AI Studio'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [ai_studio_service_1.AiStudioService])
], AiStudioController);
//# sourceMappingURL=ai-studio.controller.js.map