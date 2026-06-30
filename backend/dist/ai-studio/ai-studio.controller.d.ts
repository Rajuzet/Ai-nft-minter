import { AiStudioService, CustomMetadataDto } from './ai-studio.service';
declare class CustomMetadataInputDto implements CustomMetadataDto {
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
declare class GenerateArtDto {
    prompt: string;
    storage?: 's3' | 'ipfs';
    customMetadata?: CustomMetadataInputDto;
}
export declare class AiStudioController {
    private readonly aiStudioService;
    constructor(aiStudioService: AiStudioService);
    generateArtLegacy(dto: GenerateArtDto): Promise<{
        metadataUrl: string;
        imageUrl: string;
        metadata: any;
    }>;
    generateArt(dto: GenerateArtDto): Promise<{
        metadataUrl: string;
        imageUrl: string;
        metadata: any;
    }>;
}
export {};
