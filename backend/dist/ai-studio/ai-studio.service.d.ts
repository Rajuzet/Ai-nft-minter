import { OnModuleInit } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
export declare class AiStudioService implements OnModuleInit {
    private readonly storageService;
    private bedrockClient;
    private awsRegion;
    private s3BucketName;
    constructor(storageService: StorageService);
    onModuleInit(): void;
    private streamToString;
    generateArt(prompt: string, storage?: 's3' | 'ipfs'): Promise<{
        metadataUrl: string;
        imageUrl: string;
        metadata: any;
    }>;
}
