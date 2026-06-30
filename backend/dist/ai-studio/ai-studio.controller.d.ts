import { AiStudioService } from './ai-studio.service';
declare class GenerateArtDto {
    prompt: string;
    storage?: 's3' | 'ipfs';
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
