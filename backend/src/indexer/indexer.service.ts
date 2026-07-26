import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as dotenv from 'dotenv';
import { decodeEventLog } from 'viem';
import { id as ethersId } from 'ethers';

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

const WcosNFTCollectionABI = [
  {
    type: 'event',
    name: 'TokenMinted',
    inputs: [
      { indexed: true, name: 'recipient', type: 'address' },
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: false, name: 'tokenURI', type: 'string' },
    ],
  },
] as const;

const WcosMarketplaceABI = [
  {
    type: 'event',
    name: 'TokenListed',
    inputs: [
      { indexed: true, name: 'listingId', type: 'uint256' },
      { indexed: true, name: 'nftAddress', type: 'address' },
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: false, name: 'seller', type: 'address' },
      { indexed: false, name: 'price', type: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'TokenBought',
    inputs: [
      { indexed: true, name: 'listingId', type: 'uint256' },
      { indexed: true, name: 'nftAddress', type: 'address' },
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: false, name: 'buyer', type: 'address' },
      { indexed: false, name: 'seller', type: 'address' },
      { indexed: false, name: 'price', type: 'uint256' },
      { indexed: false, name: 'royaltyPaid', type: 'uint256' },
      { indexed: false, name: 'feePaid', type: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'TokenListingCancelled',
    inputs: [
      { indexed: true, name: 'listingId', type: 'uint256' },
      { indexed: true, name: 'nftAddress', type: 'address' },
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: false, name: 'seller', type: 'address' },
    ],
  },
] as const;

const ERC721TransferABI = [
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: true, name: 'tokenId', type: 'uint256' },
    ],
  },
] as const;

dotenv.config();

// Helper for keccak256 topic calculation
function keccak256(input: string): string {
  const precalculated: Record<string, string> = {
    'Transfer(address,address,uint256)': '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    'TokenMinted(address,uint256,string)': '0xdf92894dc4675a7333caa5903b69cf5d8e8ec0d3f361c88207b6688e525703bb',
    'TokenListed(uint256,address,uint256,address,uint256)': '0x3e56db1ea6c893099b769518f50273b5e3d001e5d1393079c766ef7f78c89a7f',
    'TokenBought(uint256,address,uint256,address,address,uint256,uint256,uint256)': '0x7b1e8083eee240f84431cb3a5d585e1ac31e7aa268806dd21bdeef073bb56350',
    'TokenListingCancelled(uint256,address,uint256,address)': '0x5f3f3b88a669dd4130b91374210c5b501c63d83c08346a61b3f0870e053d5747',
    'ProposalCreated(uint256,address,address,uint256,string,uint256,uint256)': '0x25c32def16a6c469e0f5568c0ca1551c4f41ee022b5dedbdff982b0ffcf67304',
    'VoteCast(address,uint256,bool,uint256)': '0x877856338e13f63d0c36822ff0ef736b80934cd90574a3a5bc9262c39d217c46',
    'ProposalExecuted(uint256)': '0x712ae1383f79ac853f8d882153778e0260ef8f03b504e2866e0593e04d2b291f',
  };

  if (precalculated[input]) {
    return precalculated[input];
  }

  try {
    return ethersId(input);
  } catch {
    return '0x';
  }
}

export const TOPICS = {
  Transfer: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
  TokenMinted: '0xdf92894dc4675a7333caa5903b69cf5d8e8ec0d3f361c88207b6688e525703bb',
  TokenListed: '0x3e56db1ea6c893099b769518f50273b5e3d001e5d1393079c766ef7f78c89a7f',
  TokenBought: '0x7b1e8083eee240f84431cb3a5d585e1ac31e7aa268806dd21bdeef073bb56350',
  TokenListingCancelled: '0x5f3f3b88a669dd4130b91374210c5b501c63d83c08346a61b3f0870e053d5747',
  ProposalCreated: '0x25c32def16a6c469e0f5568c0ca1551c4f41ee022b5dedbdff982b0ffcf67304',
  VoteCast: '0x877856338e13f63d0c36822ff0ef736b80934cd90574a3a5bc9262c39d217c46',
  ProposalExecuted: '0x712ae1383f79ac853f8d882153778e0260ef8f03b504e2866e0593e04d2b291f',
};

export interface IndexerStatus {
  network: string;
  rpcUrl: string;
  latestBlock: number;
  lastProcessedBlock: number;
  indexedEventsCount: number;
  indexedNftsCount: number;
  activeListingsCount: number;
  contracts: {
    nft: string;
    marketplace: string;
    dao: string;
  };
  isSyncing: boolean;
}

@Injectable()
export class IndexerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IndexerService.name);
  private timer: NodeJS.Timeout | null = null;
  private isSyncing = false;

  private readonly network = process.env.CHAIN_NAME || 'base-sepolia';
  private readonly rpcUrl = process.env.RPC_URL || 'https://sepolia.base.org';
  private readonly chainId = parseInt(process.env.CHAIN_ID || '84532', 10);
  private readonly nftContract = process.env.NFT_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS || '0x498e82d77C29FAf0605a96E3D4F59E9E0C1BEc3A';
  private readonly marketplaceContract = process.env.MARKETPLACE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
  private readonly daoContract = process.env.DAO_CONTRACT_ADDRESS || process.env.GOVERNOR_ADDRESS || '0x0000000000000000000000000000000000000000';
  private readonly tokenContract = process.env.GOVERNANCE_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000';
  private readonly defaultStartBlock = parseInt(process.env.INDEXER_START_BLOCK || '18000000', 10);

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.logger.log(`Initializing IndexerService for network: ${this.network} via RPC: ${this.rpcUrl}`);
    // Start periodic background indexing every 15 seconds
    this.timer = setInterval(() => {
      this.syncEvents().catch(err => {
        this.logger.warn(`Background indexer error: ${err.message}`);
      });
    }, 15000);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  /**
   * Safe RPC JSON-RPC caller with automatic retries and backoff
   */
  private async callRpc(method: string, params: any[] = [], retries = 3): Promise<any> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await fetch(this.rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            method,
            params,
          }),
        });

        if (!res.ok) {
          throw new Error(`RPC returned status ${res.status}`);
        }

        const data = await res.json();
        if (data.error) {
          throw new Error(`RPC Error: ${data.error.message || JSON.stringify(data.error)}`);
        }

        return data.result;
      } catch (err: any) {
        if (attempt === retries) {
          throw err;
        }
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
  }

  /**
   * Get latest block number from RPC
   */
  async getLatestBlockNumber(): Promise<number> {
    const hex = await this.callRpc('eth_blockNumber');
    return parseInt(hex, 16);
  }

  /**
   * Returns current indexer status
   */
  async getStatus(): Promise<IndexerStatus> {
    let latestBlock = 0;
    try {
      latestBlock = await this.getLatestBlockNumber();
    } catch {
      this.logger.warn('Could not fetch latest block number from RPC during status check.');
    }

    const state = await this.prisma.indexerState.findUnique({
      where: { network: this.network },
    });

    const indexedEventsCount = await this.prisma.chainEvent.count();
    const indexedNftsCount = await this.prisma.indexedNft.count();
    const activeListingsCount = await this.prisma.marketplaceListing.count({
      where: { status: 'ACTIVE' },
    });

    return {
      network: this.network,
      rpcUrl: this.rpcUrl,
      latestBlock,
      lastProcessedBlock: state ? state.lastProcessedBlock : this.defaultStartBlock,
      indexedEventsCount,
      indexedNftsCount,
      activeListingsCount,
      contracts: {
        nft: this.nftContract,
        marketplace: this.marketplaceContract,
        dao: this.daoContract,
      },
      isSyncing: this.isSyncing,
    };
  }

  /**
   * Main indexer sync function scanning block range and processing log events
   */
  async syncEvents(specifiedFromBlock?: number, specifiedToBlock?: number): Promise<{
    scannedFromBlock: number;
    scannedToBlock: number;
    newEventsCount: number;
  }> {
    if (this.isSyncing && specifiedFromBlock === undefined) {
      return { scannedFromBlock: 0, scannedToBlock: 0, newEventsCount: 0 };
    }

    this.isSyncing = true;
    let newEventsCount = 0;

    try {
      const latestBlock = await this.getLatestBlockNumber();

      // Resolve starting block
      let state = await this.prisma.indexerState.findUnique({
        where: { network: this.network },
      });

      let fromBlock = specifiedFromBlock !== undefined 
        ? specifiedFromBlock 
        : (state ? state.lastProcessedBlock + 1 : this.defaultStartBlock);

      let toBlock = specifiedToBlock !== undefined 
        ? specifiedToBlock 
        : Math.min(fromBlock + 1000, latestBlock); // Limit batch to 1000 blocks per run

      if (fromBlock > latestBlock) {
        this.isSyncing = false;
        return { scannedFromBlock: fromBlock, scannedToBlock: latestBlock, newEventsCount: 0 };
      }

      toBlock = Math.min(toBlock, latestBlock);

      this.logger.log(`Scanning RPC event logs for blocks ${fromBlock} -> ${toBlock} (Latest: ${latestBlock})`);

      // Collect target contract addresses
      const targetAddresses: string[] = [];
      if (this.nftContract && this.nftContract !== '0x0000000000000000000000000000000000000000') {
        targetAddresses.push(this.nftContract.toLowerCase());
      }
      if (this.marketplaceContract && this.marketplaceContract !== '0x0000000000000000000000000000000000000000') {
        targetAddresses.push(this.marketplaceContract.toLowerCase());
      }
      if (this.daoContract && this.daoContract !== '0x0000000000000000000000000000000000000000') {
        targetAddresses.push(this.daoContract.toLowerCase());
      }
      if (this.tokenContract && this.tokenContract !== '0x0000000000000000000000000000000000000000') {
        targetAddresses.push(this.tokenContract.toLowerCase());
      }

      if (targetAddresses.length === 0) {
        this.logger.warn('No active contract addresses configured for indexing.');
        this.isSyncing = false;
        return { scannedFromBlock: fromBlock, scannedToBlock: toBlock, newEventsCount: 0 };
      }

      // Fetch logs from RPC
      const logs = await this.callRpc('eth_getLogs', [
        {
          fromBlock: '0x' + fromBlock.toString(16),
          toBlock: '0x' + toBlock.toString(16),
          address: targetAddresses.length === 1 ? targetAddresses[0] : targetAddresses,
        },
      ]);

      if (Array.isArray(logs) && logs.length > 0) {
        for (const log of logs) {
          const processed = await this.processLog(log);
          if (processed) {
            newEventsCount++;
          }
        }
      }

      // Update indexer state checkpoint
      await this.prisma.indexerState.upsert({
        where: { network: this.network },
        update: { lastProcessedBlock: toBlock },
        create: { network: this.network, lastProcessedBlock: toBlock },
      });

      return {
        scannedFromBlock: fromBlock,
        scannedToBlock: toBlock,
        newEventsCount,
      };
    } catch (error: any) {
      this.logger.error(`Error during event indexing: ${error.message}`);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Process individual log event with duplicate protection & entity updates
   */
  async processLog(log: any): Promise<boolean> {
    const txHash = log.transactionHash;
    const logIndex = parseInt(log.logIndex, 16);
    const blockNumber = parseInt(log.blockNumber, 16);
    const contractAddress = log.address.toLowerCase();
    const eventId = `${txHash}-${logIndex}`;

    // 1. Duplicate check safety
    const existing = await this.prisma.chainEvent.findUnique({
      where: { eventId },
    });
    if (existing) {
      return false;
    }

    let eventName = 'Unknown';
    let dataJson = '{}';

    // 2. Decode using viem and all contract ABIs
    let decoded = null;
    try {
      decoded = decodeEventLog({
        abi: [
          ...ERC721TransferABI,
          ...WcosNFTCollectionABI,
          ...WcosMarketplaceABI,
          ...WcosGovernorABI,
          ...WcosGovernanceTokenABI,
        ],
        data: log.data,
        topics: log.topics,
      });
    } catch (err) {
      // Event not recognized by any of our contract ABIs
    }

    if (decoded) {
      eventName = decoded.eventName;
      const args = decoded.args as any;

      if (eventName === 'Transfer') {
        const from = args.from.toLowerCase();
        const to = args.to.toLowerCase();
        const tokenId = Number(args.tokenId);

        dataJson = JSON.stringify({ from, to, tokenId });

        // Create or update IndexedNft token
        await this.prisma.indexedNft.upsert({
          where: {
            contractAddress_tokenId: {
              contractAddress,
              tokenId,
            },
          },
          update: {
            ownerAddress: to,
            blockNumber,
            txHash,
          },
          create: {
            contractAddress,
            tokenId,
            ownerAddress: to,
            minterAddress: from === '0x0000000000000000000000000000000000000000' ? to : from,
            blockNumber,
            txHash,
          },
        });
      } else if (eventName === 'TokenMinted') {
        const recipient = args.recipient.toLowerCase();
        const tokenId = Number(args.tokenId);
        const tokenURI = args.tokenURI;
        dataJson = JSON.stringify({ recipient, tokenId, tokenURI });
      } else if (eventName === 'TokenListed') {
        const listingId = args.listingId.toString();
        const nftAddress = args.nftAddress.toLowerCase();
        const tokenId = Number(args.tokenId);
        const seller = args.seller.toLowerCase();
        const priceWei = args.price.toString();

        dataJson = JSON.stringify({ listingId, nftAddress, tokenId, seller, priceWei });

        // Upsert MarketplaceListing record
        await this.prisma.marketplaceListing.upsert({
          where: { id: `${nftAddress}-${tokenId}` },
          update: {
            status: 'ACTIVE',
            sellerId: seller,
            price: (parseFloat(priceWei) / 1e18).toString(),
            txHash,
            onChainListingId: Number(listingId),
          },
          create: {
            id: `${nftAddress}-${tokenId}`,
            nftAddress,
            tokenId,
            sellerId: seller,
            price: (parseFloat(priceWei) / 1e18).toString(),
            collectionName: 'AI Studio Collective',
            chain: this.network,
            imageUrl: 'https://gateway.pinata.cloud/ipfs/QmSimulatedHash',
            name: `NFT #${tokenId}`,
            description: 'On-chain indexed marketplace listing',
            status: 'ACTIVE',
            txHash,
            onChainListingId: Number(listingId),
          },
        });
      } else if (eventName === 'TokenBought') {
        const listingId = args.listingId.toString();
        const nftAddress = args.nftAddress.toLowerCase();
        const tokenId = Number(args.tokenId);
        const buyer = args.buyer.toLowerCase();
        const seller = args.seller.toLowerCase();
        const priceWei = args.price.toString();
        const royaltyPaid = args.royaltyPaid.toString();
        const feePaid = args.feePaid.toString();

        dataJson = JSON.stringify({ listingId, nftAddress, tokenId, buyer, seller, priceWei, royaltyPaid, feePaid });

        // Mark marketplace listing as BOUGHT and record NftSale
        await this.prisma.marketplaceListing.updateMany({
          where: { nftAddress, tokenId, status: 'ACTIVE' },
          data: { status: 'BOUGHT', buyerId: buyer, txHash },
        });

        await this.prisma.nftSale.create({
          data: {
            nftAddress,
            tokenId,
            sellerAddress: seller,
            buyerAddress: buyer,
            price: (parseFloat(priceWei) / 1e18).toString(),
            txHash,
            blockNumber,
          },
        });
      } else if (eventName === 'TokenListingCancelled') {
        const listingId = args.listingId.toString();
        const nftAddress = args.nftAddress.toLowerCase();
        const tokenId = Number(args.tokenId);
        const seller = args.seller.toLowerCase();

        dataJson = JSON.stringify({ listingId, nftAddress, tokenId, seller });

        await this.prisma.marketplaceListing.updateMany({
          where: { nftAddress, tokenId, status: 'ACTIVE' },
          data: { status: 'CANCELLED', txHash },
        });
      } else if (eventName === 'ProposalCreated') {
        const onChainProposalId = args.proposalId.toString();
        const proposer = args.proposer.toLowerCase();
        const target = args.target.toLowerCase();
        const value = args.value.toString();
        const description = args.description;
        const startBlock = args.startBlock.toString();
        const endBlock = args.endBlock.toString();

        dataJson = JSON.stringify({ onChainProposalId, proposer, target, value, description, startBlock, endBlock });

        let user = await this.prisma.user.findUnique({
          where: { walletAddress: proposer },
        });
        if (!user) {
          user = await this.prisma.user.create({
            data: { walletAddress: proposer },
          });
        }

        let dao = await this.prisma.daoOrganization.findFirst({
          where: { chainId: this.chainId },
        });
        if (!dao) {
          dao = await this.prisma.daoOrganization.create({
            data: {
              name: 'WCOS DAO Governance',
              description: 'On-chain governance for the WCOS protocol',
              govType: 'Token-weighted',
              votingToken: 'WGT',
              threshold: 1,
              quorum: 10,
              duration: 100,
              treasuryAddress: '0x0000000000000000000000000000000000000000',
              chainId: this.chainId,
            },
          });
        }

        const existingProp = await this.prisma.daoProposal.findFirst({
          where: {
            OR: [
              { proposalId: onChainProposalId, chainId: this.chainId },
              { creationTransactionHash: txHash },
            ]
          }
        });

        if (existingProp) {
          await this.prisma.daoProposal.update({
            where: { id: existingProp.id },
            data: {
              proposalId: onChainProposalId,
              snapshotBlock: startBlock,
              deadlineBlock: endBlock,
              status: 'ACTIVE',
              governorContract: contractAddress,
            }
          });
        } else {
          const title = description.split('\n')[0].slice(0, 100) || 'On-chain Proposal';
          await this.prisma.daoProposal.create({
            data: {
              daoId: dao.id,
              proposerId: user.id,
              proposalId: onChainProposalId,
              title,
              summary: title,
              description,
              targetAddress: target,
              valueTransferred: value,
              snapshotBlock: startBlock,
              deadlineBlock: endBlock,
              status: 'ACTIVE',
              chainId: this.chainId,
              creationTransactionHash: txHash,
              governorContract: contractAddress,
            }
          });
        }
      } else if (eventName === 'VoteCast') {
        const voter = args.voter.toLowerCase();
        const onChainProposalId = args.proposalId.toString();
        const support = args.support;
        const weight = args.weight.toString();

        dataJson = JSON.stringify({ voter, onChainProposalId, support, weight });

        const proposal = await this.prisma.daoProposal.findFirst({
          where: { proposalId: onChainProposalId, chainId: this.chainId },
        });

        if (proposal) {
          let user = await this.prisma.user.findUnique({
            where: { walletAddress: voter },
          });
          if (!user) {
            user = await this.prisma.user.create({
              data: { walletAddress: voter },
            });
          }

          await this.prisma.daoVote.upsert({
            where: {
              proposalId_voterId: {
                proposalId: proposal.id,
                voterId: user.id,
              }
            },
            update: {
              weight,
              support,
              transactionHash: txHash,
              blockNumber,
              status: 'CONFIRMED',
            },
            create: {
              proposalId: proposal.id,
              voterId: user.id,
              chainId: this.chainId,
              support,
              weight,
              transactionHash: txHash,
              blockNumber,
              status: 'CONFIRMED',
            }
          });

          const allVotes = await this.prisma.daoVote.findMany({
            where: { proposalId: proposal.id, status: 'CONFIRMED' },
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
            where: { id: proposal.id },
            data: { forVotes, againstVotes },
          });
        }
      } else if (eventName === 'ProposalExecuted') {
        const onChainProposalId = args.proposalId.toString();
        dataJson = JSON.stringify({ onChainProposalId });

        const proposal = await this.prisma.daoProposal.findFirst({
          where: { proposalId: onChainProposalId, chainId: this.chainId },
        });
        if (proposal) {
          await this.prisma.daoProposal.update({
            where: { id: proposal.id },
            data: {
              status: 'EXECUTED',
              executionTransactionHash: txHash,
            }
          });
        }
      } else if (eventName === 'ProposalQueued') {
        const onChainProposalId = args.proposalId.toString();
        dataJson = JSON.stringify({ onChainProposalId });

        const proposal = await this.prisma.daoProposal.findFirst({
          where: { proposalId: onChainProposalId, chainId: this.chainId },
        });
        if (proposal) {
          await this.prisma.daoProposal.update({
            where: { id: proposal.id },
            data: {
              status: 'QUEUED',
            }
          });
        }
      } else if (eventName === 'ProposalCanceled') {
        const onChainProposalId = args.proposalId.toString();
        dataJson = JSON.stringify({ onChainProposalId });

        const proposal = await this.prisma.daoProposal.findFirst({
          where: { proposalId: onChainProposalId, chainId: this.chainId },
        });
        if (proposal) {
          await this.prisma.daoProposal.update({
            where: { id: proposal.id },
            data: {
              status: 'CANCELED',
              cancellationTransactionHash: txHash,
            }
          });
        }
      } else if (eventName === 'DelegateChanged') {
        const delegator = args.delegator.toLowerCase();
        const toDelegate = args.toDelegate.toLowerCase();
        dataJson = JSON.stringify({ delegator, toDelegate });

        await this.prisma.governanceDelegation.create({
          data: {
            walletAddress: delegator,
            delegateAddress: toDelegate,
            chainId: this.chainId,
            votingPower: '0',
            transactionHash: txHash,
            blockNumber,
          }
        });
      } else if (eventName === 'DelegateVotesChanged') {
        const delegatee = args.delegate.toLowerCase();
        const newBalance = args.newBalance.toString();
        dataJson = JSON.stringify({ delegatee, newBalance });

        const latestDelegation = await this.prisma.governanceDelegation.findFirst({
          where: { delegateAddress: delegatee, chainId: this.chainId },
          orderBy: { createdAt: 'desc' },
        });
        if (latestDelegation) {
          await this.prisma.governanceDelegation.update({
            where: { id: latestDelegation.id },
            data: { votingPower: newBalance },
          });
        }
      }
    }

    // Save ChainEvent log record for audit & duplicate protection
    await this.prisma.chainEvent.create({
      data: {
        eventId,
        network: this.network,
        contractAddress,
        eventName,
        blockNumber,
        logIndex,
        txHash,
        dataJson,
      },
    });

    this.logger.log(`Indexed event [${eventName}] on ${contractAddress} at block ${blockNumber} (tx: ${txHash.slice(0, 10)}…)`);
    return true;
  }
}
