import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

export interface DaoRecord {
  id: string;
  name: string;
  description: string;
  govType: string; // Token-weighted, NFT-weighted, Multisig
  votingToken: string;
  threshold: number; // minimum votes to propose
  quorum: number; // quorum %
  duration: number; // duration in blocks
  treasuryAddress: string;
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
  startBlock: number;
  endBlock: number;
  timestamp: string;
}

@Injectable()
export class DaoService {
  private daos: DaoRecord[] = [
    {
      id: 'dao-1',
      name: 'WCOS Core Collective',
      description: 'The genesis governance community managing treasury upgrades and protocol policies.',
      govType: 'Token-weighted',
      votingToken: 'WGT',
      threshold: 100,
      quorum: 10,
      duration: 5760,
      treasuryAddress: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
      members: [
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
      ],
      timestamp: new Date().toLocaleDateString()
    }
  ];

  private proposals: ProposalRecord[] = [
    {
      id: 'prop-1',
      daoId: 'dao-1',
      title: 'Upgrade NFT Minter Royalty Split',
      description: 'Adjust standard collection royalty split, routing 2% to development escrow and 3% to core community treasury.',
      targetAddress: '0x498e82d77C29FAf0605a96E3D4F59E9E0C1BEc3A',
      valueTransferred: '0',
      forVotes: 52000,
      againstVotes: 12000,
      status: 'ACTIVE',
      startBlock: 245670,
      endBlock: 251430,
      timestamp: new Date().toLocaleTimeString()
    }
  ];

  findAll(): DaoRecord[] {
    return this.daos;
  }

  findOne(id: string): DaoRecord {
    const dao = this.daos.find((d) => d.id === id);
    if (!dao) throw new NotFoundException(`DAO with ID ${id} not found.`);
    return dao;
  }

  create(dto: Omit<DaoRecord, 'id' | 'members' | 'timestamp'>): DaoRecord {
    const newDao: DaoRecord = {
      ...dto,
      id: `dao-${Date.now()}`,
      members: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'],
      timestamp: new Date().toLocaleDateString(),
    };
    this.daos.push(newDao);
    return newDao;
  }

  findProposals(daoId: string): ProposalRecord[] {
    return this.proposals.filter((p) => p.daoId === daoId);
  }

  createProposal(daoId: string, dto: Omit<ProposalRecord, 'id' | 'daoId' | 'forVotes' | 'againstVotes' | 'status' | 'startBlock' | 'endBlock' | 'timestamp'>): ProposalRecord {
    this.findOne(daoId); // verify DAO exists

    const newProp: ProposalRecord = {
      ...dto,
      id: `prop-${Date.now()}`,
      daoId,
      forVotes: 0,
      againstVotes: 0,
      status: 'ACTIVE',
      startBlock: 250000,
      endBlock: 255760,
      timestamp: new Date().toLocaleTimeString(),
    };
    this.proposals.push(newProp);
    return newProp;
  }

  castVote(proposalId: string, voter: string, support: boolean, weight: number): ProposalRecord {
    const prop = this.proposals.find((p) => p.id === proposalId);
    if (!prop) {
      throw new NotFoundException(`Proposal with ID ${proposalId} not found.`);
    }
    if (prop.status !== 'ACTIVE') {
      throw new BadRequestException('Proposal voting window is no longer active.');
    }

    if (support) {
      prop.forVotes += weight;
    } else {
      prop.againstVotes += weight;
    }
    return prop;
  }
}
