import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ethers } from 'ethers';

// Simple minimal ERC-721 ABI for reading ownerOf
const ERC721_ABI = [
  "function ownerOf(uint256 tokenId) view returns (address)"
];

@Injectable()
export class NftService {
  private readonly logger = new Logger(NftService.name);

  constructor(private prisma: PrismaService) {}

  async createPendingMint(data: {
    contractAddress: string;
    chainId: number;
    ownerAddress: string;
    creatorAddress?: string;
    name?: string;
    description?: string;
    tokenUri?: string;
    imageUrl?: string;
    attributes?: string;
    prompt?: string;
    aiModel?: string;
  }) {
    // Generate a temporary unique negative token ID to satisfy the unique constraint until it is minted
    const tempTokenId = -Math.floor(Math.random() * 1000000000) - 1;

    return this.prisma.nft.create({
      data: {
        contractAddress: data.contractAddress.toLowerCase(),
        chainId: data.chainId,
        tokenId: tempTokenId,
        ownerAddress: data.ownerAddress.toLowerCase(),
        minterAddress: data.ownerAddress.toLowerCase(),
        creatorAddress: data.creatorAddress ? data.creatorAddress.toLowerCase() : data.ownerAddress.toLowerCase(),
        name: data.name,
        description: data.description,
        tokenUri: data.tokenUri,
        imageUrl: data.imageUrl,
        attributes: data.attributes,
        prompt: data.prompt,
        aiModel: data.aiModel,
        status: 'PENDING',
        txHash: '',
        blockNumber: 0,
      }
    });
  }

  async confirmMint(id: string, data: { tokenId: number, txHash: string, blockNumber: number }) {
    const record = await this.prisma.nft.findUnique({ where: { id } });
    if (!record) {
      throw new NotFoundException('Pending mint record not found');
    }
    
    // Check if another record already has this tokenId and contractAddress
    const existing = await this.prisma.nft.findFirst({
      where: {
        chainId: record.chainId,
        contractAddress: record.contractAddress,
        tokenId: data.tokenId,
        id: { not: id }
      }
    });
    
    if (existing) {
      // If we somehow tracked this already via another process, just return it
      this.logger.warn(`NFT already exists with token ID ${data.tokenId} on ${record.contractAddress}. Updating existing.`);
      // Delete the pending record and return existing
      await this.prisma.nft.delete({ where: { id } });
      return existing;
    }

    return this.prisma.nft.update({
      where: { id },
      data: {
        tokenId: data.tokenId,
        txHash: data.txHash,
        blockNumber: data.blockNumber,
        status: 'MINTED'
      }
    });
  }

  async markFailed(id: string, txHash: string) {
    return this.prisma.nft.update({
      where: { id },
      data: {
        status: 'FAILED',
        txHash: txHash
      }
    });
  }

  async findByWallet(walletAddress: string, chainId?: number) {
    const whereClause: any = { 
      ownerAddress: walletAddress.toLowerCase(),
      status: 'MINTED'
    };
    if (chainId) {
      whereClause.chainId = chainId;
    }

    return this.prisma.nft.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });
  }

  async findHistory(walletAddress: string) {
    return this.prisma.nft.findMany({
      where: {
        OR: [
          { ownerAddress: walletAddress.toLowerCase() },
          { minterAddress: walletAddress.toLowerCase() }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(contractAddress: string, chainId: number, tokenId: number) {
    const nft = await this.prisma.nft.findFirst({
      where: {
        contractAddress: contractAddress.toLowerCase(),
        chainId,
        tokenId,
        status: 'MINTED'
      }
    });
    if (!nft) throw new NotFoundException('NFT not found');
    return nft;
  }

  async verifyOnChain(id: string) {
    const nft = await this.prisma.nft.findUnique({ where: { id } });
    if (!nft || nft.status !== 'MINTED') {
      throw new BadRequestException('NFT is not valid or not minted');
    }
    
    let rpcUrl = '';
    switch (nft.chainId) {
      case 84532: rpcUrl = process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'; break;
      case 8453: rpcUrl = process.env.BASE_MAINNET_RPC_URL || 'https://mainnet.base.org'; break;
      case 1: rpcUrl = process.env.ETH_MAINNET_RPC_URL || 'https://eth.llamarpc.com'; break;
      case 137: rpcUrl = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com'; break;
      default:
        throw new BadRequestException('Unsupported chain for RPC verification');
    }

    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const contract = new ethers.Contract(nft.contractAddress, ERC721_ABI, provider);
      
      const onChainOwner = await contract.ownerOf(nft.tokenId);
      
      // Sync to database if different
      if (onChainOwner.toLowerCase() !== nft.ownerAddress.toLowerCase()) {
        await this.prisma.nft.update({
          where: { id: nft.id },
          data: { ownerAddress: onChainOwner.toLowerCase() }
        });
        nft.ownerAddress = onChainOwner.toLowerCase();
      }
      
      return { verified: true, onChainOwner: onChainOwner.toLowerCase(), dbRecord: nft };
    } catch (err: any) {
      this.logger.error(`Error verifying owner for NFT ${nft.id}: ${err.message}`);
      throw new BadRequestException(`RPC Error verifying NFT: ${err.message}`);
    }
  }
}
