import { Test, TestingModule } from '@nestjs/testing';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileService } from '../profile/profile.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { DefiService } from '../defi/defi.service';
import { DaoService } from '../dao/dao.service';
import { NftService } from '../nft/nft.service';
import { MarketplaceService } from '../marketplace/marketplace.service';

describe('AiOrchestratorService', () => {
  let service: AiOrchestratorService;

  const mockPrismaService = {};
  const mockProfileService = {
    getProfile: jest.fn().mockResolvedValue({ address: '0x123', displayName: 'Alice' }),
    getUserNfts: jest.fn().mockResolvedValue([]),
  };
  const mockAnalyticsService = {
    getCreatorAnalytics: jest.fn().mockResolvedValue({
      overview: { totalRevenue: '1.5', totalRolyalties: '0.075', totalNftsMinted: 5 },
    }),
    getGlobalMetrics: jest.fn().mockResolvedValue({ totalCreators: 10 }),
  };
  const mockDefiService = {
    getSwapQuote: jest.fn().mockResolvedValue({
      transactionTarget: '0xUniswap',
      transactionCalldata: '0xSwapData',
      transactionValue: '0',
      expectedBuyAmount: '100',
      sellToken: 'ETH',
      buyToken: 'WGT',
    }),
    getUserStakingPositions: jest.fn().mockResolvedValue([]),
  };
  const mockDaoService = {
    getProposals: jest.fn().mockResolvedValue([]),
  };
  const mockNftService = {
    createPendingMint: jest.fn().mockResolvedValue({
      id: 'pending-1',
      contractAddress: '0xNFTContract',
      name: 'Space Nomad',
    }),
  };
  const mockMarketplaceService = {
    findAll: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiOrchestratorService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ProfileService, useValue: mockProfileService },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: DefiService, useValue: mockDefiService },
        { provide: DaoService, useValue: mockDaoService },
        { provide: NftService, useValue: mockNftService },
        { provide: MarketplaceService, useValue: mockMarketplaceService },
      ],
    }).compile();

    service = module.get<AiOrchestratorService>(AiOrchestratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should process general fallback commands correctly', async () => {
    const res = await service.processCommand('hello agent');
    expect(res).toBeDefined();
    expect(res.reply).toContain('WCOS-Agent');
    expect(res.intent).toBeNull();
    expect(res.suggestions.length).toBeGreaterThan(0);
  });

  it('should parse portfolio commands and call analytics service', async () => {
    const wallet = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
    const res = await service.processCommand('show my portfolio balance', wallet);

    expect(res.intent?.type).toBe('analyze-portfolio');
    expect(mockAnalyticsService.getCreatorAnalytics).toHaveBeenCalledWith(wallet);
    expect(res.reply).toContain('1.5 ETH');
  });

  it('should prepare NFT minting plans and request approval', async () => {
    const wallet = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
    const res = await service.processCommand('mint a cyberpunk nft', wallet);

    expect(res.intent?.type).toBe('deploy-erc721');
    expect(mockNftService.createPendingMint).toHaveBeenCalled();
    expect(res.plan?.steps[0].status).toBe('COMPLETED');
    expect(res.preparedTx?.to).toBe('0xNFTContract');
    expect(res.approvalRequired).toBe(true);
    expect(res.approvalDetails?.action).toBe('MINT_NFT');
  });

  it('should prepare swap quotes and call DeFi swap provider', async () => {
    const wallet = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
    const res = await service.processCommand('swap 0.1 ETH to WGT', wallet);

    expect(res.intent?.type).toBe('swap-tokens');
    expect(mockDefiService.getSwapQuote).toHaveBeenCalled();
    expect(res.preparedTx?.to).toBe('0xUniswap');
    expect(res.preparedTx?.data).toBe('0xSwapData');
    expect(res.approvalRequired).toBe(true);
    expect(res.approvalDetails?.action).toBe('TOKEN_SWAP');
  });
});
