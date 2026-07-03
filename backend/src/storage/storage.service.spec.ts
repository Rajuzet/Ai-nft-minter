import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should upload image buffer and return public URL', async () => {
    const fakeBuffer = Buffer.from('fake-image-data');
    const result = await service.uploadImage(fakeBuffer, 'image/png');
    expect(result).toBeDefined();
    expect(result.url).toContain('http');
  });

  it('should upload metadata object and return metadata URL', async () => {
    const metadata = { name: 'Test NFT', description: 'Test Description', image: 'https://example.com/nft.png' };
    const result = await service.uploadMetadata(metadata);
    expect(result).toBeDefined();
    expect(result.url).toContain('http');
  });
});
