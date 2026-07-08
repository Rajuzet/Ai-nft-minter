import { Test, TestingModule } from '@nestjs/testing';
import { AiStudioService } from './ai-studio.service';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';

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
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiStudioService,
        { provide: StorageService, useValue: mockStorageService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AiStudioService>(AiStudioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate artwork and return image and metadata URLs', async () => {
    const result = await service.generateArt(
      'Cyberpunk futuristic city neon lights',
      'ipfs',
      { name: 'Cyberpunk Art', description: 'Glow lights', category: 'cyberpunk' },
      '0x1234567890123456789012345678901234567890'
    );

    expect(result).toBeDefined();
    expect(result.imageUrl).toBeDefined();
    expect(result.metadataUrl).toBeDefined();
    expect(result.metadata.name).toBe('Cyberpunk Art');
  });
});
