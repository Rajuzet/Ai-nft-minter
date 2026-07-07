import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';

dotenv.config();

// Helper for keccak256 topic calculation without heavy external dependencies
function keccak256(input: string): string {
  // Using Node's crypto sha3-256 / keccak or standard pre-calculated hashes
  const precalculated: Record<string, string> = {
    'Transfer(address,address,uint256)': '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    'TokenMinted(address,uint256,string)': '0xd763138b556b6b77c3a0d507bc6e8b7c9fb38a2e1d70bb51e2c918ee08518e87',
    'TokenListed(address,uint256,address,uint256)': '0xb8e390c5ed1033285741b6c003a276eb1c7847c20fa0ee3b9d03823f666cfb71',
    'TokenBought(address,uint256,address,address,uint256,uint256)': '0xbcf4c6f3ad78a57193f4a0a552bf335805561fae4e5cae1a90d402ceecad7992',
    'TokenListingCancelled(address,uint256,address)': '0x327bfcd9c1c4f526315ab3ca3f0e0c031ca3775086be51a8d0554c153835e5d3',
    'ProposalCreated(uint256,address,address,uint256,string)': '0x7d84a6263ae0d98d3329bd7b46db7e35b719468903b4129ebf74c7e3f898305c',
    'VoteCast(address,uint256,bool,uint256)': '0x973a968603b7454c7d0d04c45a7065961d15a51965aa376a91176e737c3584c6',
    'ProposalExecuted(uint256)': '0x712ae1383f79ac84d188b9e0789721448b11b988f6c38221808064d1f2fd3050',
  };

  if (precalculated[input]) {
    return precalculated[input];
  }

  try {
    return '0x' + crypto.createHash('sha3-256').update(input).digest('hex');
  } catch {
    return '0x';
  }
}

export const TOPICS = {
  Transfer: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
  TokenMinted: '0xd763138b556b6b77c3a0d507bc6e8b7c9fb38a2e1d70bb51e2c918ee08518e87',
  TokenListed: '0xb8e390c5ed1033285741b6c003a276eb1c7847c20fa0ee3b9d03823f666cfb71',
  TokenBought: '0xbcf4c6f3ad78a57193f4a0a552bf335805561fae4e5cae1a90d402ceecad7992',
  TokenListingCancelled: '0x327bfcd9c1c4f526315ab3ca3f0e0c031ca3775086be51a8d0554c153835e5d3',
  ProposalCreated: '0x7d84a6263ae0d98d3329bd7b46db7e35b719468903b4129ebf74c7e3f898305c',
  VoteCast: '0x973a968603b7454c7d0d04c45a7065961d15a51965aa376a91176e737c3584c6',
  ProposalExecuted: '0x712ae1383f79ac84d188b9e0789721448b11b988f6c38221808064d1f2fd3050',
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
  private readonly nftContract = process.env.NFT_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS || '0x498e82d77C29FAf0605a96E3D4F59E9E0C1BEc3A';
  private readonly marketplaceContract = process.env.MARKETPLACE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
  private readonly daoContract = process.env.DAO_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
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
  private async processLog(log: any): Promise<boolean> {
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

    const topic0 = log.topics[0];
    let eventName = 'Unknown';
    let dataJson = '{}';

    // 2. Classify and handle log event
    if (topic0 === TOPICS.Transfer && log.topics.length >= 4) {
      eventName = 'Transfer';
      const from = '0x' + log.topics[1].slice(26);
      const to = '0x' + log.topics[2].slice(26);
      const tokenId = parseInt(log.topics[3], 16);

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
          ownerAddress: to.toLowerCase(),
          blockNumber,
          txHash,
        },
        create: {
          contractAddress,
          tokenId,
          ownerAddress: to.toLowerCase(),
          minterAddress: from === '0x0000000000000000000000000000000000000000' ? to.toLowerCase() : from.toLowerCase(),
          blockNumber,
          txHash,
        },
      });
    } else if (topic0 === TOPICS.TokenListed && log.topics.length >= 4) {
      eventName = 'TokenListed';
      const nftAddress = ('0x' + log.topics[1].slice(26)).toLowerCase();
      const tokenId = parseInt(log.topics[2], 16);
      const seller = ('0x' + log.topics[3].slice(26)).toLowerCase();
      const priceWei = parseInt(log.data, 16).toString();

      dataJson = JSON.stringify({ nftAddress, tokenId, seller, priceWei });

      // Upsert MarketplaceListing record
      await this.prisma.marketplaceListing.upsert({
        where: { id: `${nftAddress}-${tokenId}` },
        update: {
          status: 'ACTIVE',
          sellerId: seller,
          price: (parseInt(priceWei, 10) / 1e18).toString(),
          txHash,
        },
        create: {
          id: `${nftAddress}-${tokenId}`,
          nftAddress,
          tokenId,
          sellerId: seller,
          price: (parseInt(priceWei, 10) / 1e18).toString(),
          collectionName: 'AI Studio Collective',
          chain: this.network,
          imageUrl: 'https://gateway.pinata.cloud/ipfs/QmSimulatedHash',
          name: `NFT #${tokenId}`,
          description: 'On-chain indexed marketplace listing',
          status: 'ACTIVE',
          txHash,
        },
      });
    } else if (topic0 === TOPICS.TokenBought && log.topics.length >= 4) {
      eventName = 'TokenBought';
      const nftAddress = ('0x' + log.topics[1].slice(26)).toLowerCase();
      const tokenId = parseInt(log.topics[2], 16);
      const buyer = ('0x' + log.topics[3].slice(26)).toLowerCase();

      dataJson = JSON.stringify({ nftAddress, tokenId, buyer });

      // Mark marketplace listing as BOUGHT and record NftSale
      await this.prisma.marketplaceListing.updateMany({
        where: { nftAddress, tokenId, status: 'ACTIVE' },
        data: { status: 'BOUGHT', buyerId: buyer, txHash },
      });

      await this.prisma.nftSale.create({
        data: {
          nftAddress,
          tokenId,
          sellerAddress: contractAddress,
          buyerAddress: buyer,
          price: '0.05',
          txHash,
          blockNumber,
        },
      });
    } else if (topic0 === TOPICS.TokenListingCancelled && log.topics.length >= 4) {
      eventName = 'TokenListingCancelled';
      const nftAddress = ('0x' + log.topics[1].slice(26)).toLowerCase();
      const tokenId = parseInt(log.topics[2], 16);

      dataJson = JSON.stringify({ nftAddress, tokenId });

      await this.prisma.marketplaceListing.updateMany({
        where: { nftAddress, tokenId, status: 'ACTIVE' },
        data: { status: 'CANCELLED', txHash },
      });
    } else if (topic0 === TOPICS.ProposalCreated) {
      eventName = 'ProposalCreated';
      dataJson = JSON.stringify({ rawData: log.data });
    } else if (topic0 === TOPICS.VoteCast) {
      eventName = 'VoteCast';
      dataJson = JSON.stringify({ rawData: log.data });
    } else if (topic0 === TOPICS.ProposalExecuted) {
      eventName = 'ProposalExecuted';
      dataJson = JSON.stringify({ rawData: log.data });
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
