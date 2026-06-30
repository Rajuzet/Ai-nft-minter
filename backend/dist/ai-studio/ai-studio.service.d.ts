import { OnModuleInit } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
export interface CustomMetadataDto {
    name?: string;
    description?: string;
    category?: string;
    traits?: Array<{
        traitType: string;
        value: string;
    }>;
    royaltyPercentage?: number;
    externalUrl?: string;
    unlockableContent?: string;
}
export declare class AiStudioService implements OnModuleInit {
    private readonly storageService;
    private bedrockClient;
    private awsRegion;
    private s3BucketName;
    constructor(storageService: StorageService);
    onModuleInit(): void;
    private streamToString;
    generateArt(prompt: string, storage?: 's3' | 'ipfs', customMetadata?: CustomMetadataDto): Promise<{
        metadataUrl: string;
        imageUrl: string;
        metadata: any;
    }>;
}
