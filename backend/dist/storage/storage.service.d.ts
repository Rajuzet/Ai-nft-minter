import { OnModuleInit } from '@nestjs/common';
export declare class StorageService implements OnModuleInit {
    private s3Client;
    private awsRegion;
    private s3BucketName;
    private s3PublicBaseUrl;
    onModuleInit(): void;
    uploadToS3(fileBuffer: Buffer, path: string, contentType: string): Promise<string>;
    uploadToIpfs(fileBuffer: Buffer, fileName: string): Promise<string>;
}
