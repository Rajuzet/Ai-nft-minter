import { Test, TestingModule } from '@nestjs/testing';
import { DefiService } from './defi.service';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainPortfolioProvider } from './blockchain-portfolio-provider.service';
import { LlamaPriceProvider } from './llama-price-provider.service';
import { UniswapLPAdapter, AaveLendingAdapter } from './protocol-adapters';
import { OpenOceanSwapProvider } from './openocean-swap-provider.service';
import { ZeroxSwapProvider } from './zerox-swap-provider.service';
import { OneInchSwapProvider } from './oneinch-swap-provider.service';
import { SwapQuoteRequest } from './swap-provider.interface';
import { BadRequestException } from '@nestjs/common';

describe('DefiService - Swap Quote', () => {
  let service: DefiService;
  let zeroxProvider: ZeroxSwapProvider;

  const mockPrismaService = {
    safe: jest.fn((fn) => fn()),
    stakingPool: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
    },
  };
  const mockPortfolioProvider = {};
  const mockPriceProvider = {};
  const mockUniswapLP = {};
  const mockAaveLending = {};
  const mockOpenOcean = {
    getQuote: jest.fn(),
  };
  const mockZerox = {
    supportsChain: jest.fn().mockReturnValue(true),
    getQuote: jest.fn(),
  };
  const mockOneInch = {
    supportsChain: jest.fn().mockReturnValue(true),
    getQuote: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DefiService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: BlockchainPortfolioProvider, useValue: mockPortfolioProvider },
        { provide: LlamaPriceProvider, useValue: mockPriceProvider },
        { provide: UniswapLPAdapter, useValue: mockUniswapLP },
        { provide: AaveLendingAdapter, useValue: mockAaveLending },
        { provide: OpenOceanSwapProvider, useValue: mockOpenOcean },
        { provide: ZeroxSwapProvider, useValue: mockZerox },
        { provide: OneInchSwapProvider, useValue: mockOneInch },
      ],
    }).compile();

    service = module.get<DefiService>(DefiService);
    zeroxProvider = module.get<ZeroxSwapProvider>(ZeroxSwapProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.SWAP_MOCK;
    delete process.env.DEFI_ZEROX_API_KEY;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSwapQuote', () => {
    const request: SwapQuoteRequest = {
      chainId: 84532,
      walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      sellToken: 'NATIVE',
      buyToken: '0x036cbd53842c5426634e7929541ec2318f3dcf7e',
      sellAmount: '100000000000000000', // 0.1 ETH
      slippageBps: 50,
    };

    it('should successfully get a quote from ZeroxSwapProvider for Base Sepolia (chainId 84532)', async () => {
      const mockResult = {
        quoteId: '0x-mock-quote-id',
        provider: '0x',
        chainId: 84532,
        sellToken: 'NATIVE',
        buyToken: '0x036cbd53842c5426634e7929541ec2318f3dcf7e',
        sellAmount: '100000000000000000',
        expectedBuyAmount: '350000000',
        minimumReceived: '348250000',
        exchangeRate: '3500.00',
        estimatedGas: '150000',
        estimatedGasCostEth: '0.00015',
        route: 'Uniswap_V3',
        allowanceTarget: '0x1234567890123456789012345678901234567890',
        transactionTarget: '0x0000000000000000000000000000000000000000',
        transactionCalldata: '0x00000000',
        transactionValue: '100000000000000000',
        quoteExpiration: Math.floor(Date.now() / 1000) + 300,
        generatedTimestamp: Date.now(),
      };

      jest.spyOn(zeroxProvider, 'getQuote').mockResolvedValue(mockResult);

      const result = await service.getSwapQuote(request);

      expect(result).toBeDefined();
      expect(result.provider).toBe('0x');
      expect(result.expectedBuyAmount).toBe('350000000');
      expect(zeroxProvider.getQuote).toHaveBeenCalledWith(request);
    });

    it('should throw BadRequestException for unsupported token pair', async () => {
      jest.spyOn(zeroxProvider, 'getQuote').mockRejectedValue(new Error('Unsupported token pair or insufficient liquidity'));

      await expect(service.getSwapQuote(request)).rejects.toThrow(BadRequestException);
      expect(zeroxProvider.getQuote).toHaveBeenCalledWith(request);
    });

    it('should fallback to simulated quote when ZeroxSwapProvider throws a generic API failure', async () => {
      jest.spyOn(zeroxProvider, 'getQuote').mockRejectedValue(new Error('API rate limit exceeded'));

      const result = await service.getSwapQuote(request);

      expect(result).toBeDefined();
      expect(result.provider).toBe('MockRouter');
      expect(result.warnings).toContain('Fallback activated: 0x Swap API Failure: API rate limit exceeded');
      expect(zeroxProvider.getQuote).toHaveBeenCalledWith(request);
    });

    it('should return simulated quote when SWAP_MOCK=true', async () => {
      process.env.SWAP_MOCK = 'true';

      const result = await service.getSwapQuote(request);

      expect(result).toBeDefined();
      expect(result.provider).toBe('MockRouter');
      expect(result.warnings).toContain('SWAP_MOCK=true: This quote is simulated and not executable on-chain.');
      expect(zeroxProvider.getQuote).not.toHaveBeenCalled();
    });
  });
});
