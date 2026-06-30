"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const client_s3_1 = require("@aws-sdk/client-s3");
const crypto = require("crypto");
let StorageService = class StorageService {
    onModuleInit() {
        this.awsRegion = process.env.AWS_REGION || 'us-east-1';
        this.s3BucketName = process.env.S3_BUCKET_NAME;
        this.s3PublicBaseUrl = process.env.S3_PUBLIC_BASE_URL || `https://${this.s3BucketName}.s3.${this.awsRegion}.amazonaws.com`;
        if (this.s3BucketName) {
            this.s3Client = new client_s3_1.S3Client({ region: this.awsRegion });
        }
    }
    async uploadToS3(fileBuffer, path, contentType) {
        if (!this.s3BucketName) {
            throw new common_1.InternalServerErrorException('AWS S3 bucket configuration is missing.');
        }
        try {
            await this.s3Client.send(new client_s3_1.PutObjectCommand({
                Bucket: this.s3BucketName,
                Key: path,
                Body: fileBuffer,
                ContentType: contentType,
                ACL: 'public-read',
            }));
            return `${this.s3PublicBaseUrl}/${path}`;
        }
        catch (error) {
            console.error('S3 upload error:', error);
            throw new common_1.InternalServerErrorException(`S3 upload failed: ${error.message}`);
        }
    }
    async uploadToIpfs(fileBuffer, fileName) {
        const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
        const mockCid = 'Qm' + hash.slice(0, 44);
        return `https://ipfs.io/ipfs/${mockCid}`;
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = __decorate([
    (0, common_1.Injectable)()
], StorageService);
//# sourceMappingURL=storage.service.js.map