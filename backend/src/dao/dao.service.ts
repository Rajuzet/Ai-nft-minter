import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface DaoRecord {
  id: string;
  name: string;
  description: string;
  govType: string;
  votingToken: string;
  threshold: number;
  quorum: number;
  duration: number;
  treasuryAddress: string;
  chainId?: number;
  members: string[];
  timestamp: string;
}

export interface ProposalRecord {
  id: string;
  daoId: string;
  title: string;
  description: string;
  targetAddress: string;
  valueTransferred: string;
  forVotes: number;
  againstVotes: number;
  status: 'ACTIVE' | 'DEFEATED' | 'SUCCEEDED' | 'EXECUTED';
  chainId?: number;
  startBlock: number;
  endBlock: number;
  timestamp: string;
}

@Injectable()
export class DaoService {
  constructor(private readonly prisma: PrismaService) {}

  private defaultDao: DaoRecord = {
    id: 'dao-1',
    name: 'WCOS Core Collective',
    description: 'The genesis governance community managing treasury upgrades and protocol policies.',
    govType: 'Token-weighted',
    votingToken: 'WGT',
    threshold: 100,
    quorum: 10,
    duration: 5760,
    treasuryAddress: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
    chainId: 84532,
    members: [
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
    ],
    timestamp: new Date().toISOString(),
  };

  private defaultProposal: ProposalRecord = {
    id: 'prop-1',
    daoId: 'dao-1',
    title: 'Upgrade NFT Minter Royalty Split',
    description: 'Adjust standard collection royalty split, routing 2% to development escrow and 3% to core community treasury.',
    targetAddress: '0x498e82d77C29FAf0605a96E3D4F59E9E0C1BEc3A',
    valueTransferred: '0',
    forVotes: 52000,
    againstVotes: 12000,
    status: 'ACTIVE',
    chainId: 84532,
    startBlock: 245670,
    endBlock: 251430,
    timestamp: new Date().toISOString(),
  };

  async findAll(): Promise<DaoRecord[]> {
    const daos = await this.prisma.daoOrganization.findMany({
      include: { proposals: true },
      orderBy: { createdAt: 'desc' },
    });

    if (daos.length === 0) {
      return [this.defaultDao];
    }

    return daos.map((d) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      govType: d.govType,
      votingToken: d.votingToken,
      threshold: d.threshold,
      quorum: d.quorum,
      duration: d.duration,
      treasuryAddress: d.treasuryAddress,
      chainId: d.chainId,
      members: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'],
      timestamp: d.createdAt.toISOString(),
    }));
  }

  async findOne(id: string): Promise<DaoRecord> {
    if (id === 'dao-1') return this.defaultDao;

    const d = await this.prisma.daoOrganization.findUnique({
      where: { id },
    });

    if (!d) throw new NotFoundException(`DAO with ID ${id} not found.`);

    return {
      id: d.id,
      name: d.name,
      description: d.description,
      govType: d.govType,
      votingToken: d.votingToken,
      threshold: d.threshold,
      quorum: d.quorum,
      duration: d.duration,
      treasuryAddress: d.treasuryAddress,
      chainId: d.chainId,
      members: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'],
      timestamp: d.createdAt.toISOString(),
    };
  }

  async create(dto: Omit<DaoRecord, 'id' | 'members' | 'timestamp'>): Promise<DaoRecord> {
    const created = await this.prisma.daoOrganization.create({
      data: {
        name: dto.name,
        description: dto.description,
        govType: dto.govType || 'Token-weighted',
        votingToken: dto.votingToken || 'WGT',
        threshold: dto.threshold || 100,
        quorum: dto.quorum || 10,
        duration: dto.duration || 5760,
        treasuryAddress: dto.treasuryAddress || '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
        chainId: dto.chainId ?? 84532,
      },
    });

    return {
      id: created.id,
      name: created.name,
      description: created.description,
      govType: created.govType,
      votingToken: created.votingToken,
      threshold: created.threshold,
      quorum: created.quorum,
      duration: created.duration,
      treasuryAddress: created.treasuryAddress,
      chainId: created.chainId,
      members: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'],
      timestamp: created.createdAt.toISOString(),
    };
  }

  async findProposals(daoId: string): Promise<ProposalRecord[]> {
    if (daoId === 'dao-1') return [this.defaultProposal];

    const proposals = await this.prisma.daoProposal.findMany({
      where: { daoId },
      orderBy: { createdAt: 'desc' },
    });

    return proposals.map((p) => ({
      id: p.id,
      daoId: p.daoId,
      title: p.title,
      description: p.description,
      targetAddress: p.targetAddress,
      valueTransferred: p.valueTransferred,
      forVotes: p.forVotes,
      againstVotes: p.againstVotes,
      status: p.status as any,
      chainId: p.chainId,
      startBlock: 245670,
      endBlock: 251430,
      timestamp: p.createdAt.toISOString(),
    }));
  }

  async createProposal(
    daoId: string, 
    dto: Omit<ProposalRecord, 'id' | 'daoId' | 'forVotes' | 'againstVotes' | 'status' | 'startBlock' | 'endBlock' | 'timestamp'>
  ): Promise<ProposalRecord> {
    let user = await this.prisma.user.findFirst();
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          walletAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
          displayName: 'System Proposer',
        },
      });
    }

    const created = await this.prisma.daoProposal.create({
      data: {
        daoId,
        proposerId: user.id,
        title: dto.title,
        description: dto.description,
        targetAddress: dto.targetAddress,
        valueTransferred: dto.valueTransferred || '0',
        status: 'ACTIVE',
        chainId: dto.chainId ?? 84532,
      },
    });

    return {
      id: created.id,
      daoId: created.daoId,
      title: created.title,
      description: created.description,
      targetAddress: created.targetAddress,
      valueTransferred: created.valueTransferred,
      forVotes: created.forVotes,
      againstVotes: created.againstVotes,
      status: 'ACTIVE',
      chainId: created.chainId,
      startBlock: 250000,
      endBlock: 255760,
      timestamp: created.createdAt.toISOString(),
    };
  }

  async castVote(proposalId: string, voterAddress: string, support: boolean, weight: number): Promise<ProposalRecord> {
    if (proposalId === 'prop-1') {
      if (support) this.defaultProposal.forVotes += weight;
      else this.defaultProposal.againstVotes += weight;
      return this.defaultProposal;
    }

    const prop = await this.prisma.daoProposal.findUnique({
      where: { id: proposalId },
    });

    if (!prop) {
      throw new NotFoundException(`Proposal with ID ${proposalId} not found.`);
    }

    const updated = await this.prisma.daoProposal.update({
      where: { id: proposalId },
      data: {
        forVotes: support ? prop.forVotes + weight : prop.forVotes,
        againstVotes: !support ? prop.againstVotes + weight : prop.againstVotes,
      },
    });

    return {
      id: updated.id,
      daoId: updated.daoId,
      title: updated.title,
      description: updated.description,
      targetAddress: updated.targetAddress,
      valueTransferred: updated.valueTransferred,
      forVotes: updated.forVotes,
      againstVotes: updated.againstVotes,
      status: updated.status as any,
      startBlock: 250000,
      endBlock: 255760,
      timestamp: updated.createdAt.toISOString(),
    };
  }

  async getUserActivity(address: string) {
    const normalized = address.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { walletAddress: normalized },
      include: { daoProposals: true, daoVotes: { include: { proposal: true } } },
    });

    if (!user) return { proposals: [], votes: [] };

    return {
      proposals: user.daoProposals,
      votes: user.daoVotes.map((v) => ({
        id: v.id,
        proposalTitle: v.proposal.title,
        support: v.support,
        weight: v.weight,
        timestamp: v.createdAt.toISOString(),
      })),
    };
  }
}
