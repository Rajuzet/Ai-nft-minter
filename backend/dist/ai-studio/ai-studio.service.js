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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiStudioService = void 0;
const common_1 = require("@nestjs/common");
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const storage_service_1 = require("../storage/storage.service");
const crypto = require("crypto");
let AiStudioService = class AiStudioService {
    constructor(storageService) {
        this.storageService = storageService;
    }
    onModuleInit() {
        this.awsRegion = process.env.AWS_REGION || 'us-east-1';
        this.s3BucketName = process.env.S3_BUCKET_NAME;
        this.bedrockClient = new client_bedrock_runtime_1.BedrockRuntimeClient({ region: this.awsRegion });
    }
    async streamToString(stream) {
        const chunks = [];
        for await (const chunk of stream) {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        }
        return Buffer.concat(chunks).toString('utf-8');
    }
    async generateArt(prompt, storage = 's3') {
        if (!prompt || typeof prompt !== 'string') {
            throw new common_1.BadRequestException('A valid prompt string is required.');
        }
        if (storage === 's3' && !this.s3BucketName) {
            throw new common_1.InternalServerErrorException('AWS S3 bucket configuration is missing on the server.');
        }
        try {
            const command = new client_bedrock_runtime_1.InvokeModelCommand({
                modelId: 'amazon.titan-image-generator-v2:0',
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify({
                    inputText: prompt,
                    imageGenerationConfig: {
                        size: { width: 1024, height: 1024 },
                        quality: 'premium',
                    },
                }),
            });
            const result = await this.bedrockClient.send(command);
            const responseBody = await this.streamToString(result.body);
            const payload = JSON.parse(responseBody);
            const imagePayload = payload?.outputs?.[0]?.content?.[0]?.image?.data
                || payload?.image
                || payload?.imageBase64
                || payload?.image_url;
            if (!imagePayload) {
                throw new common_1.InternalServerErrorException('No image data returned from Bedrock model.');
            }
            let imageBuffer;
            if (typeof imagePayload === 'string') {
                imageBuffer = Buffer.from(imagePayload, 'base64');
            }
            else if (Array.isArray(imagePayload)) {
                imageBuffer = Buffer.from(imagePayload);
            }
            else {
                throw new common_1.InternalServerErrorException('Unsupported image payload format from Bedrock.');
            }
            let imageUrl;
            const imageKey = `art/${Date.now()}-${crypto.randomUUID()}.png`;
            if (storage === 'ipfs') {
                imageUrl = await this.storageService.uploadToIpfs(imageBuffer, `${Date.now()}-artwork.png`);
            }
            else {
                imageUrl = await this.storageService.uploadToS3(imageBuffer, imageKey, 'image/png');
            }
            const metadata = {
                name: `AI Studio Collective Artwork #${Date.now()}`,
                description: 'Institutional-grade AI-generated NFT art generated from a secure prompt.',
                image: imageUrl,
                attributes: [
                    { trait_type: 'Generation Engine', value: 'amazon.titan-image-generator-v2:0' },
                    { trait_type: 'Prompt', value: prompt },
                    { trait_type: 'Storage Type', value: storage.toUpperCase() }
                ],
            };
            let metadataUrl;
            const metadataKey = `metadata/${Date.now()}-${crypto.randomUUID()}.json`;
            if (storage === 'ipfs') {
                const metadataBuffer = Buffer.from(JSON.stringify(metadata));
                metadataUrl = await this.storageService.uploadToIpfs(metadataBuffer, `${Date.now()}-metadata.json`);
            }
            else {
                const metadataBuffer = Buffer.from(JSON.stringify(metadata));
                metadataUrl = await this.storageService.uploadToS3(metadataBuffer, metadataKey, 'application/json');
            }
            return {
                metadataUrl,
                imageUrl,
                metadata,
            };
        }
        catch (error) {
            console.error('generateArt error:', error);
            throw new common_1.InternalServerErrorException(error.message ? `Failed to generate art: ${error.message}` : 'Failed to generate art and upload metadata.');
        }
    }
};
exports.AiStudioService = AiStudioService;
exports.AiStudioService = AiStudioService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [storage_service_1.StorageService])
], AiStudioService);
//# sourceMappingURL=ai-studio.service.js.map