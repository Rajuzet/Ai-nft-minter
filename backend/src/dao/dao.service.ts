import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// ─── DTOs ──────────────────────────────────────────────────────────────────────

export interface RegisterProposalDto {
  walletAddress: string;
  chainId: number;
  governorContract: string;
  onChainProposalId: string;  // from ProposalCreated event
  title: string;
  summary?: string;
  description: string;
  category?: string;
  proposalType?: string;
  targetAddress: string;
  calldata?: string;
  valueTransferred?: string;
  snapshotBlock: string;
  deadlineBlock: string;
  creationTransactionHash: string;
  descriptionHash?: string;
  contentUri?: string;
}

export interface ConfirmProposalDto {
  creationTransactionHash: string;
  blockNumber?: number;
  status?: string;
}

export interface RegisterVoteDto {
  walletAddress: string;
  chainId: number;
  proposalDbId?: string;
  onChainProposalId: string;
  support: boolean;
  weight: string;   // raw bigint as string
  transactionHash: string;
}

export interface ConfirmVoteDto {
  transactionHash: string;
  blockNumber?: number;
}

export interface RegisterDelegationDto {
  walletAddress: string;
  delegateAddress: string;
  chainId: number;
  votingPower: string;
  transactionHash: string;
  blockNumber?: number;
}

export interface RegisterGovernanceTxDto {
  walletAddress: string;
  chainId: number;
  proposalId?: string;
  onChainId?: string;
  transactionType: 'DELEGATE' | 'CREATE_PROPOSAL' | 'VOTE' | 'EXECUTE_PROPOSAL' | 'CANCEL_PROPOSAL';
  transactionHash: string;
  blockNumber?: number;
  gasUsed?: string;
  gasCost?: string;
}

// ─── Governance Config ────────────────────────────────────────────────────────

export interface ChainGovernanceConfig {
  chainId: number;
  governanceToken: string | null;
  governorContract: string | null;
  treasuryContract: string | null;
  status: string;
  quorumPercentHint: number;
  votingDurationBlocksHint: number;
}

function buildChainConfig(chainId: number): ChainGovernanceConfig {
  const suffix = chainId === 84532 ? '' : `_${chainId}`;
  const token = process.env[`GOVERNANCE_TOKEN_ADDRESS${suffix}`] || null;
  const governor = process.env[`GOVERNOR_ADDRESS${suffix}`] || null;
  const treasury = process.env[`TREASURY_ADDRESS${suffix}`] || null;
  const deployed = !!token && !!governor;

  return {
    chainId,
    governanceToken: token,
    governorContract: governor,
    treasuryContract: treasury,
    status: deployed ? (chainId === 84532 ? 'TESTNET' : 'GOVERNANCE_NOT_DEPLOYED') : 'GOVERNANCE_NOT_DEPLOYED',
    quorumPercentHint: 10,
    votingDurationBlocksHint: 100,
  };
}

@Injectable()
export class DaoService {
  private readonly logger = new Logger(DaoService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Governance Config ──────────────────────────────────────────────────────

  getGovernanceConfig(chainId: number): ChainGovernanceConfig {
    return buildChainConfig(chainId);
  }

  // ─── Proposals ──────────────────────────────────────────────────────────────

  async getProposals(chainId?: number, status?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (chainId) where.chainId = chainId;
    if (status) where.status = status;

    const [proposals, total] = await Promise.all([
      this.prisma.daoProposal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          proposer: { select: { walletAddress: true, displayName: true } },
          votes: { select: { support: true, weight: true } },
        },
      }),
      this.prisma.daoProposal.count({ where }),
    ]);

    return {
      proposals: proposals.map(this.mapProposal),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getProposalByDbId(id: string) {
    const p = await this.prisma.daoProposal.findUnique({
      where: { id },
      include: {
        proposer: { select: { walletAddress: true, displayName: true } },
        votes: { select: { support: true, weight: true, transactionHash: true } },
      },
    });
    if (!p) throw new NotFoundException(`Proposal ${id} not found`);
    return this.mapProposal(p);
  }

  async getProposalByOnChainId(onChainProposalId: string, chainId: number) {
    const p = await this.prisma.daoProposal.findFirst({
      where: { proposalId: onChainProposalId, chainId },
      include: {
        proposer: { select: { walletAddress: true, displayName: true } },
        votes: { select: { support: true, weight: true, transactionHash: true } },
      },
    });
    if (!p) throw new NotFoundException(`On-chain proposal ${onChainProposalId} not found on chain ${chainId}`);
    return this.mapProposal(p);
  }

  async registerProposal(dto: RegisterProposalDto) {
    // Upsert user
    let user = await this.prisma.user.findUnique({
      where: { walletAddress: dto.walletAddress.toLowerCase() },
    });
    if (!user) {
      user = await this.prisma.user.create({
        data: { walletAddress: dto.walletAddress.toLowerCase() },
      });
    }

    // Ensure DAO organization record exists (create canonical one if missing)
    let dao = await this.prisma.daoOrganization.findFirst({
      where: { chainId: dto.chainId },
    });
    if (!dao) {
      const config = buildChainConfig(dto.chainId);
      dao = await this.prisma.daoOrganization.create({
        data: {
          name: 'WCOS DAO Governance',
          description: 'On-chain governance for the WCOS protocol',
          govType: 'Token-weighted',
          votingToken: 'WGT',
          threshold: 1,
          quorum: config.quorumPercentHint,
          duration: config.votingDurationBlocksHint,
          treasuryAddress: config.treasuryContract || '0x0000000000000000000000000000000000000000',
          chainId: dto.chainId,
        },
      });
    }

    const proposal = await this.prisma.daoProposal.create({
      data: {
        daoId: dao.id,
        proposerId: user.id,
        proposalId: dto.onChainProposalId,
        title: dto.title,
        summary: dto.summary || null,
        description: dto.description,
        category: dto.category || 'GENERAL',
        proposalType: dto.proposalType || 'INFORMATIONAL',
        targetAddress: dto.targetAddress,
        calldata: dto.calldata || null,
        valueTransferred: dto.valueTransferred || '0',
        descriptionHash: dto.descriptionHash || null,
        contentUri: dto.contentUri || null,
        snapshotBlock: dto.snapshotBlock,
        deadlineBlock: dto.deadlineBlock,
        governorContract: dto.governorContract,
        forVotes: '0',
        againstVotes: '0',
        status: 'ACTIVE',
        chainId: dto.chainId,
        creationTransactionHash: dto.creationTransactionHash,
      },
    });

    // Log governance transaction
    await this.logGovernanceTx({
      walletAddress: dto.walletAddress,
      chainId: dto.chainId,
      proposalId: proposal.id,
      onChainId: dto.onChainProposalId,
      transactionType: 'CREATE_PROPOSAL',
      transactionHash: dto.creationTransactionHash,
    });

    return this.mapProposal(proposal);
  }

  async confirmProposal(dto: ConfirmProposalDto) {
    const proposal = await this.prisma.daoProposal.findFirst({
      where: { creationTransactionHash: dto.creationTransactionHash },
    });
    if (!proposal) throw new NotFoundException('Proposal not found for this transaction hash');

    const updated = await this.prisma.daoProposal.update({
      where: { id: proposal.id },
      data: {
        status: dto.status || 'ACTIVE',
      },
    });

    await this.prisma.governanceTransaction.updateMany({
      where: { transactionHash: dto.creationTransactionHash },
      data: { status: 'CONFIRMED', blockNumber: dto.blockNumber, confirmedAt: new Date() },
    });

    return this.mapProposal(updated);
  }

  async updateProposalState(onChainProposalId: string, chainId: number, status: string, extraData?: {
    forVotes?: string;
    againstVotes?: string;
    executionTransactionHash?: string;
    cancellationTransactionHash?: string;
  }) {
    const existing = await this.prisma.daoProposal.findFirst({
      where: { proposalId: onChainProposalId, chainId },
    });
    if (!existing) return;

    await this.prisma.daoProposal.update({
      where: { id: existing.id },
      data: {
        status,
        ...(extraData?.forVotes !== undefined ? { forVotes: extraData.forVotes } : {}),
        ...(extraData?.againstVotes !== undefined ? { againstVotes: extraData.againstVotes } : {}),
        ...(extraData?.executionTransactionHash ? { executionTransactionHash: extraData.executionTransactionHash } : {}),
        ...(extraData?.cancellationTransactionHash ? { cancellationTransactionHash: extraData.cancellationTransactionHash } : {}),
      },
    });
  }

  // ─── Votes ───────────────────────────────────────────────────────────────────

  async registerVote(dto: RegisterVoteDto) {
    // Upsert user
    let user = await this.prisma.user.findUnique({
      where: { walletAddress: dto.walletAddress.toLowerCase() },
    });
    if (!user) {
      user = await this.prisma.user.create({
        data: { walletAddress: dto.walletAddress.toLowerCase() },
      });
    }

    // Find proposal
    const proposal = await this.prisma.daoProposal.findFirst({
      where: { proposalId: dto.onChainProposalId, chainId: dto.chainId },
    });
    if (!proposal) throw new NotFoundException(`Proposal ${dto.onChainProposalId} not found`);

    // Check for duplicate
    const existing = await this.prisma.daoVote.findUnique({
      where: { proposalId_voterId: { proposalId: proposal.id, voterId: user.id } },
    });
    if (existing) {
      throw new BadRequestException('User has already voted on this proposal');
    }

    const vote = await this.prisma.daoVote.create({
      data: {
        proposalId: proposal.id,
        voterId: user.id,
        chainId: dto.chainId,
        support: dto.support,
        weight: dto.weight,
        transactionHash: dto.transactionHash,
        status: 'PENDING',
      },
    });

    await this.logGovernanceTx({
      walletAddress: dto.walletAddress,
      chainId: dto.chainId,
      proposalId: proposal.id,
      onChainId: dto.onChainProposalId,
      transactionType: 'VOTE',
      transactionHash: dto.transactionHash,
    });

    return vote;
  }

  async confirmVote(dto: ConfirmVoteDto) {
    const vote = await this.prisma.daoVote.findFirst({
      where: { transactionHash: dto.transactionHash },
      include: { proposal: true },
    });
    if (!vote) throw new NotFoundException('Vote not found for this transaction hash');

    // Update vote status
    await this.prisma.daoVote.update({
      where: { id: vote.id },
      data: { status: 'CONFIRMED', blockNumber: dto.blockNumber },
    });

    // Recalculate vote totals
    const allVotes = await this.prisma.daoVote.findMany({
      where: { proposalId: vote.proposalId, status: 'CONFIRMED' },
    });
    const forVotes = allVotes
      .filter(v => v.support)
      .reduce((acc, v) => acc + BigInt(v.weight), BigInt(0))
      .toString();
    const againstVotes = allVotes
      .filter(v => !v.support)
      .reduce((acc, v) => acc + BigInt(v.weight), BigInt(0))
      .toString();

    await this.prisma.daoProposal.update({
      where: { id: vote.proposalId },
      data: { forVotes, againstVotes },
    });

    await this.prisma.governanceTransaction.updateMany({
      where: { transactionHash: dto.transactionHash },
      data: { status: 'CONFIRMED', blockNumber: dto.blockNumber, confirmedAt: new Date() },
    });

    return { success: true };
  }

  // ─── Delegation ──────────────────────────────────────────────────────────────

  async registerDelegation(dto: RegisterDelegationDto) {
    // Upsert (overwrite most recent delegation for this wallet+chain)
    const existing = await this.prisma.governanceDelegation.findFirst({
      where: { walletAddress: dto.walletAddress.toLowerCase(), chainId: dto.chainId },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      await this.prisma.governanceDelegation.update({
        where: { id: existing.id },
        data: {
          delegateAddress: dto.delegateAddress.toLowerCase(),
          votingPower: dto.votingPower,
          transactionHash: dto.transactionHash,
          blockNumber: dto.blockNumber,
        },
      });
    } else {
      await this.prisma.governanceDelegation.create({
        data: {
          walletAddress: dto.walletAddress.toLowerCase(),
          delegateAddress: dto.delegateAddress.toLowerCase(),
          chainId: dto.chainId,
          votingPower: dto.votingPower,
          transactionHash: dto.transactionHash,
          blockNumber: dto.blockNumber,
        },
      });
    }

    await this.logGovernanceTx({
      walletAddress: dto.walletAddress,
      chainId: dto.chainId,
      transactionType: 'DELEGATE',
      transactionHash: dto.transactionHash,
      blockNumber: dto.blockNumber,
    });

    return { success: true };
  }

  // ─── User Governance History ─────────────────────────────────────────────────

  async getWalletGovernanceHistory(address: string) {
    const normalized = address.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { walletAddress: normalized },
      include: {
        daoProposals: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            proposalId: true,
            title: true,
            status: true,
            chainId: true,
            creationTransactionHash: true,
            createdAt: true,
          },
        },
        daoVotes: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            proposal: {
              select: { id: true, proposalId: true, title: true, status: true, chainId: true },
            },
          },
        },
      },
    });

    if (!user) return { proposals: [], votes: [], delegations: [] };

    const delegations = await this.prisma.governanceDelegation.findMany({
      where: { walletAddress: normalized },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      proposals: user.daoProposals,
      votes: user.daoVotes.map(v => ({
        id: v.id,
        proposalId: v.proposal?.proposalId,
        proposalTitle: v.proposal?.title,
        proposalStatus: v.proposal?.status,
        chainId: v.proposal?.chainId,
        support: v.support,
        weight: v.weight,
        transactionHash: v.transactionHash,
        createdAt: v.createdAt,
      })),
      delegations: delegations.map(d => ({
        delegate: d.delegateAddress,
        votingPower: d.votingPower,
        transactionHash: d.transactionHash,
        chainId: d.chainId,
        createdAt: d.createdAt,
      })),
    };
  }

  // ─── Analytics ───────────────────────────────────────────────────────────────

  async getGovernanceAnalytics(chainId?: number) {
    const where: any = {};
    if (chainId) where.chainId = chainId;

    const [total, active, succeeded, defeated, executed, canceled] = await Promise.all([
      this.prisma.daoProposal.count({ where }),
      this.prisma.daoProposal.count({ where: { ...where, status: 'ACTIVE' } }),
      this.prisma.daoProposal.count({ where: { ...where, status: 'SUCCEEDED' } }),
      this.prisma.daoProposal.count({ where: { ...where, status: 'DEFEATED' } }),
      this.prisma.daoProposal.count({ where: { ...where, status: 'EXECUTED' } }),
      this.prisma.daoProposal.count({ where: { ...where, status: 'CANCELED' } }),
    ]);

    const voteCount = await this.prisma.daoVote.count({
      where: chainId ? { chainId } : {},
    });

    const uniqueVoters = await this.prisma.daoVote.groupBy({
      by: ['voterId'],
      where: chainId ? { chainId } : {},
    });

    return {
      totalProposals: total,
      activeProposals: active,
      succeededProposals: succeeded,
      defeatedProposals: defeated,
      executedProposals: executed,
      canceledProposals: canceled,
      totalVotesCast: voteCount,
      uniqueVoters: uniqueVoters.length,
      participationRate: total > 0 ? Math.round((voteCount / total) * 100) / 100 : 0,
    };
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────────

  private async logGovernanceTx(dto: RegisterGovernanceTxDto) {
    try {
      // Upsert by transactionHash to prevent duplicates
      const existing = await this.prisma.governanceTransaction.findUnique({
        where: { transactionHash: dto.transactionHash },
      });
      if (existing) return;

      await this.prisma.governanceTransaction.create({
        data: {
          walletAddress: dto.walletAddress.toLowerCase(),
          chainId: dto.chainId,
          proposalId: dto.proposalId || null,
          onChainId: dto.onChainId || null,
          transactionType: dto.transactionType,
          transactionHash: dto.transactionHash,
          blockNumber: dto.blockNumber || null,
          gasUsed: dto.gasUsed || null,
          gasCost: dto.gasCost || null,
          status: 'PENDING',
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to log governance tx: ${err}`);
    }
  }

  private mapProposal(p: any) {
    return {
      id: p.id,
      onChainProposalId: p.proposalId || null,
      daoId: p.daoId,
      proposer: p.proposer?.walletAddress || p.proposerId,
      title: p.title,
      summary: p.summary || null,
      description: p.description,
      category: p.category || 'GENERAL',
      proposalType: p.proposalType || 'INFORMATIONAL',
      targetAddress: p.targetAddress,
      calldata: p.calldata || '0x',
      valueTransferred: p.valueTransferred,
      descriptionHash: p.descriptionHash || null,
      contentUri: p.contentUri || null,
      snapshotBlock: p.snapshotBlock || null,
      deadlineBlock: p.deadlineBlock || null,
      governorContract: p.governorContract || null,
      forVotes: p.forVotes,
      againstVotes: p.againstVotes,
      status: p.status,
      chainId: p.chainId,
      creationTransactionHash: p.creationTransactionHash || null,
      executionTransactionHash: p.executionTransactionHash || null,
      cancellationTransactionHash: p.cancellationTransactionHash || null,
      voteCount: p.votes?.length ?? 0,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }
}
