import { Test, TestingModule } from '@nestjs/testing';
import { AiStudioService } from './ai-studio.service';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { OpenAiProvider } from './providers/openai.provider';

describe('AiStudioService', () => {
  let service: AiStudioService;

  const mockStorageService = {
    uploadImage: jest.fn().mockResolvedValue({ url: 'https://storage.example.com/art.png' }),
    uploadMetadata: jest.fn().mockResolvedValue({ url: 'https://storage.example.com/metadata.json' }),
    uploadImageToIPFS: jest.fn().mockResolvedValue({
      ipfsHash: 'QmHash123',
      ipfsUrl: 'ipfs://QmHash123',
      gatewayUrl: 'https://gateway.pinata.cloud/ipfs/QmHash123',
    }),
    createNFTMetadata: jest.fn().mockReturnValue({
      name: 'Cyberpunk Art',
      description: 'Glow lights',
      image: 'ipfs://QmHash123',
      attributes: [],
    }),
    uploadMetadataToIPFS: jest.fn().mockResolvedValue({
      ipfsHash: 'QmMetaHash123',
      ipfsUrl: 'ipfs://QmMetaHash123',
      gatewayUrl: 'https://gateway.pinata.cloud/ipfs/QmMetaHash123',
    }),
  };

  const mockPrismaService = {
    safe: jest.fn((fn) => fn()),
    user: {
      findUnique: jest.fn().mockResolvedValue({ id: 'user-123' }),
      create: jest.fn().mockResolvedValue({ id: 'user-123' }),
    },
    aiAsset: {
      create: jest.fn().mockResolvedValue({
        id: 'asset-1',
        imageUrl: 'https://storage.example.com/art.png',
        metadataUrl: 'https://storage.example.com/metadata.json',
      }),
      update: jest.fn().mockResolvedValue({ id: 'asset-1' }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiStudioService,
        { provide: StorageService, useValue: mockStorageService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: OpenAiProvider, useValue: { enhancePrompt: jest.fn(), generateImage: jest.fn() } },
      ],
    }).compile();

    service = module.get<AiStudioService>(AiStudioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate artwork in the background and return asset details', async () => {
    const result = await service.generateArt(
      { prompt: 'Cyberpunk futuristic city neon lights' },
      { name: 'Cyberpunk Art', description: 'Glow lights', category: 'cyberpunk' },
      '0x1234567890123456789012345678901234567890'
    );

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.assetId).toBeDefined();
    expect(result.status).toBe('QUEUED');
  });
});
