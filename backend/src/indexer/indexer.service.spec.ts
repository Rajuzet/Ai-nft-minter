import { Test, TestingModule } from '@nestjs/testing';
import { IndexerService } from './indexer.service';
import { PrismaService } from '../prisma/prisma.service';
import { encodeEventTopics, encodeAbiParameters, parseAbiParameters } from 'viem';

// Copy ABI for encoding in tests
const WcosGovernorABI = [
  {
    type: 'event',
    name: 'ProposalCreated',
    inputs: [
      { indexed: true, name: 'proposalId', type: 'uint256' },
      { indexed: true, name: 'proposer', type: 'address' },
      { indexed: false, name: 'target', type: 'address' },
      { indexed: false, name: 'value', type: 'uint256' },
      { indexed: false, name: 'description', type: 'string' },
      { indexed: false, name: 'startBlock', type: 'uint256' },
      { indexed: false, name: 'endBlock', type: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'VoteCast',
    inputs: [
      { indexed: true, name: 'voter', type: 'address' },
      { indexed: true, name: 'proposalId', type: 'uint256' },
      { indexed: false, name: 'support', type: 'bool' },
      { indexed: false, name: 'weight', type: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'ProposalExecuted',
    inputs: [{ indexed: true, name: 'proposalId', type: 'uint256' }],
  },
  {
    type: 'event',
    name: 'ProposalCanceled',
    inputs: [{ indexed: true, name: 'proposalId', type: 'uint256' }],
  },
  {
    type: 'event',
    name: 'ProposalQueued',
    inputs: [
      { indexed: true, name: 'proposalId', type: 'uint256' },
      { indexed: false, name: 'eta', type: 'uint256' },
    ],
  },
] as const;

const WcosGovernanceTokenABI = [
  {
    type: 'event',
    name: 'DelegateChanged',
    inputs: [
      { indexed: true, name: 'delegator', type: 'address' },
      { indexed: true, name: 'fromDelegate', type: 'address' },
      { indexed: true, name: 'toDelegate', type: 'address' },
    ],
  },
  {
    type: 'event',
    name: 'DelegateVotesChanged',
    inputs: [
      { indexed: true, name: 'delegate', type: 'address' },
      { indexed: false, name: 'previousBalance', type: 'uint256' },
      { indexed: false, name: 'newBalance', type: 'uint256' },
    ],
  },
] as const;

describe('IndexerService', () => {
  let service: IndexerService;

  const mockUser = { id: 'user-123', walletAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' };
  const mockDaoOrg = { id: 'dao-123', name: 'WCOS DAO Governance', chainId: 84532 };
  const mockProposal = {
    id: 'proposal-123',
    proposalId: '1',
    status: 'ACTIVE',
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
      create: jest.fn().mockResolvedValue(mockProposal),
      update: jest.fn().mockResolvedValue(mockProposal),
    },
    daoVote: {
      upsert: jest.fn().mockResolvedValue({ id: 'vote-123' }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    governanceDelegation: {
      create: jest.fn().mockResolvedValue({ id: 'delegation-123' }),
      findFirst: jest.fn().mockResolvedValue({ id: 'delegation-123' }),
      update: jest.fn().mockResolvedValue({ id: 'delegation-123' }),
    },
    chainEvent: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'event-123' }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IndexerService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<IndexerService>(IndexerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should process ProposalCreated event', async () => {
    (mockPrismaService.daoProposal.findFirst as jest.Mock).mockResolvedValueOnce(null);
    const proposerAddress = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
    const targetAddress = '0x0000000000000000000000000000000000000000';

    const topics = encodeEventTopics({
      abi: WcosGovernorABI,
      eventName: 'ProposalCreated',
      args: [1n, proposerAddress],
    });

    const data = encodeAbiParameters(
      parseAbiParameters('address target, uint256 value, string description, uint256 startBlock, uint256 endBlock'),
      [targetAddress, 0n, 'Test Proposal Description', 100n, 200n]
    );

    const result = await service.processLog({
      topics,
      data,
      transactionHash: '0xhash123',
      blockNumber: '0x64',
      logIndex: '0x0',
      address: '0xgov123',
    });

    expect(result).toBe(true);
    expect(mockPrismaService.daoProposal.create).toHaveBeenCalled();
  });

  it('should process VoteCast event', async () => {
    const voterAddress = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';

    const topics = encodeEventTopics({
      abi: WcosGovernorABI,
      eventName: 'VoteCast',
      args: [voterAddress, 1n],
    });

    const data = encodeAbiParameters(
      parseAbiParameters('bool support, uint256 weight'),
      [true, 1000n]
    );

    const result = await service.processLog({
      topics,
      data,
      transactionHash: '0xhashVote',
      blockNumber: '0x64',
      logIndex: '0x1',
      address: '0xgov123',
    });

    expect(result).toBe(true);
    expect(mockPrismaService.daoVote.upsert).toHaveBeenCalled();
  });

  it('should process ProposalExecuted event', async () => {
    const topics = encodeEventTopics({
      abi: WcosGovernorABI,
      eventName: 'ProposalExecuted',
      args: [1n],
    });

    const result = await service.processLog({
      topics,
      data: '0x',
      transactionHash: '0xhashExec',
      blockNumber: '0x65',
      logIndex: '0x0',
      address: '0xgov123',
    });

    expect(result).toBe(true);
    expect(mockPrismaService.daoProposal.update).toHaveBeenCalled();
  });

  it('should process ProposalQueued event', async () => {
    const topics = encodeEventTopics({
      abi: WcosGovernorABI,
      eventName: 'ProposalQueued',
      args: [1n],
    });

    const data = encodeAbiParameters(
      parseAbiParameters('uint256 eta'),
      [172800n]
    );

    const result = await service.processLog({
      topics,
      data,
      transactionHash: '0xhashQueue',
      blockNumber: '0x66',
      logIndex: '0x0',
      address: '0xgov123',
    });

    expect(result).toBe(true);
    expect(mockPrismaService.daoProposal.update).toHaveBeenCalled();
  });
});
