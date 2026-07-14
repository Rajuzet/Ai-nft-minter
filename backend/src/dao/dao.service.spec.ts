import { Test, TestingModule } from '@nestjs/testing';
import { DaoService } from './dao.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DaoService', () => {
  let service: DaoService;

  const mockUser = { id: 'user-123', walletAddress: '0x1234567890123456789012345678901234567890' };
  const mockDaoOrg = { id: 'dao-123', name: 'WCOS DAO Governance', chainId: 84532 };
  const mockProposal = {
    id: 'proposal-123',
    daoId: 'dao-123',
    proposerId: 'user-123',
    proposalId: '1',
    title: 'Test Proposal',
    description: 'Test description',
    status: 'ACTIVE',
    chainId: 84532,
    creationTransactionHash: '0xhash123',
  };

  const mockPrismaService = {
    safe: jest.fn((fn) => fn()),
    user: {
      findUnique: jest.fn().mockResolvedValue(mockUser),
      create: jest.fn().mockResolvedValue(mockUser),
    },
    daoOrganization: {
      findFirst: jest.fn().mockResolvedValue(mockDaoOrg),
      create: jest.fn().mockResolvedValue(mockDaoOrg),
    },
    daoProposal: {
      findFirst: jest.fn().mockResolvedValue(mockProposal),
      findUnique: jest.fn().mockResolvedValue(mockProposal),
      create: jest.fn().mockResolvedValue(mockProposal),
      update: jest.fn().mockResolvedValue({ ...mockProposal, status: 'ACTIVE' }),
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockResolvedValue([mockProposal]),
    },
    daoVote: {
      upsert: jest.fn().mockResolvedValue({ id: 'vote-123' }),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'vote-123' }),
    },
    governanceDelegation: {
      create: jest.fn().mockResolvedValue({ id: 'delegation-123' }),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    governanceTransaction: {
      create: jest.fn().mockResolvedValue({ id: 'tx-123' }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DaoService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<DaoService>(DaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return governance configuration', () => {
    const config = service.getGovernanceConfig(84532);
    expect(config).toBeDefined();
    expect(config.chainId).toBe(84532);
  });

  it('should register a new proposal', async () => {
    const proposalDto = {
      walletAddress: '0x1234567890123456789012345678901234567890',
      chainId: 84532,
      governorContract: '0xgov123',
      onChainProposalId: '1',
      title: 'Test Proposal',
      description: 'Test description',
      targetAddress: '0x0000000000000000000000000000000000000000',
      snapshotBlock: '100',
      deadlineBlock: '200',
      creationTransactionHash: '0xhash123',
    };

    const result = await service.registerProposal(proposalDto);
    expect(result).toBeDefined();
    expect(result.onChainProposalId).toBe('1');
    expect(mockPrismaService.daoProposal.create).toHaveBeenCalled();
  });

  it('should confirm proposal', async () => {
    const result = await service.confirmProposal({
      creationTransactionHash: '0xhash123',
      status: 'ACTIVE',
    });
    expect(result).toBeDefined();
    expect(mockPrismaService.daoProposal.update).toHaveBeenCalled();
  });

  it('should register vote', async () => {
    const voteDto = {
      walletAddress: '0x1234567890123456789012345678901234567890',
      chainId: 84532,
      onChainProposalId: '1',
      support: true,
      weight: '100',
      transactionHash: '0xvotetx',
    };

    const result = await service.registerVote(voteDto);
    expect(result).toBeDefined();
    expect(mockPrismaService.daoVote.create).toHaveBeenCalled();
  });

  it('should register delegation', async () => {
    const delegationDto = {
      walletAddress: '0x1234567890123456789012345678901234567890',
      delegateAddress: '0xdelegate123',
      chainId: 84532,
      votingPower: '500',
      transactionHash: '0xdelegatetx',
    };

    const result = await service.registerDelegation(delegationDto);
    expect(result).toBeDefined();
    expect(mockPrismaService.governanceDelegation.create).toHaveBeenCalled();
  });
});
