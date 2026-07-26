import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createPublicClient, http, decodeEventLog, parseAbiItem } from 'viem';
import { baseSepolia, base, mainnet, polygon, arbitrum, optimism } from 'viem/chains';

export interface ListingRecord {
  id: string;
  onChainListingId?: number;
  nftAddress: string;
  tokenId: number;
  seller: string;
  price: string;
  collectionName: string;
  chain: string;
  chainId?: number;
  imageUrl: string;
  name: string;
  description: string;
  status: string;
  buyer?: string;
  txHash?: string;
  timestamp: string;
}

const getViemChain = (chainId: number) => {
  switch (chainId) {
    case 8453: return base;
    case 1: return mainnet;
    case 137: return polygon;
    case 42161: return arbitrum;
    case 10: return optimism;
    case 84532:
    default: return baseSepolia;
  }
};

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<ListingRecord[]> {
    const listings = await this.prisma.marketplaceListing.findMany({
      where: { status: 'ACTIVE' },
      include: { seller: true, buyer: true },
      orderBy: { createdAt: 'desc' },
    });

    return listings.map((l) => ({
      id: l.id,
      onChainListingId: l.onChainListingId ?? undefined,
      nftAddress: l.nftAddress,
      tokenId: l.tokenId,
      seller: l.seller?.walletAddress || '0x0000000000000000000000000000000000000000',
      price: l.price,
      collectionName: l.collectionName,
      chain: l.chain,
      chainId: l.chainId,
      imageUrl: l.imageUrl,
      name: l.name,
      description: l.description,
      status: l.status,
      buyer: l.buyer?.walletAddress,
      txHash: l.listingTransactionHash || undefined,
      timestamp: l.createdAt.toISOString(),
    }));
  }

  async create(dto: any): Promise<ListingRecord> {
    const sellerAddress = dto.seller.toLowerCase();
    
    let seller = await this.prisma.user.findUnique({
      where: { walletAddress: sellerAddress },
    });

    if (!seller) {
      seller = await this.prisma.user.create({
        data: {
          walletAddress: sellerAddress,
          displayName: `Creator ${sellerAddress.substring(0, 6)}`,
        },
      });
    }

    const chainId = dto.chainId || 84532;
    const client = createPublicClient({
      chain: getViemChain(chainId),
      transport: http(),
    });

    let onChainListingId: number | undefined;

    // Verify transaction hash
    if (dto.txHash) {
      try {
        const receipt = await client.getTransactionReceipt({ hash: dto.txHash as `0x${string}` });
        if (receipt.status !== 'success') {
          throw new BadRequestException('Transaction failed on-chain');
        }

        // Parse TokenListed event
        for (const log of receipt.logs) {
          try {
            const decoded = decodeEventLog({
              abi: [parseAbiItem('event TokenListed(uint256 indexed listingId, address indexed nftAddress, uint256 indexed tokenId, address seller, uint256 price)')],
              data: log.data,
              topics: log.topics,
            });
            if (
              decoded.eventName === 'TokenListed' &&
              decoded.args.nftAddress.toLowerCase() === dto.nftAddress.toLowerCase() &&
              Number(decoded.args.tokenId) === dto.tokenId &&
              decoded.args.seller.toLowerCase() === dto.seller.toLowerCase()
            ) {
              const eventPrice = decoded.args.price;
              const expectedPrice = BigInt(Math.round(parseFloat(dto.price) * 1e18));
              const diff = eventPrice > expectedPrice ? eventPrice - expectedPrice : expectedPrice - eventPrice;
              if (diff > 1000n) {
                throw new BadRequestException(`Price mismatch. On-chain: ${eventPrice.toString()} wei, expected: ${expectedPrice.toString()} wei`);
              }
              onChainListingId = Number(decoded.args.listingId);
              break;
            }
          } catch (e) {
            // Ignore other events
          }
        }

        if (onChainListingId === undefined) {
          throw new BadRequestException('TokenListed event matching nftAddress, tokenId, and seller not found in transaction logs');
        }
      } catch (err: any) {
        this.logger.error(`Error verifying transaction: ${err.message}`);
        throw new BadRequestException(err.message || 'Invalid transaction hash or receipt not found');
      }
    }

    const created = await this.prisma.marketplaceListing.create({
      data: {
        nftAddress: dto.nftAddress,
        tokenId: dto.tokenId,
        sellerId: seller.id,
        price: dto.price,
        collectionName: dto.collectionName,
        chain: dto.chain || 'base-sepolia',
        chainId,
        imageUrl: dto.imageUrl,
        name: dto.name,
        description: dto.description,
        status: onChainListingId ? 'ACTIVE' : 'PENDING_LISTING',
        listingTransactionHash: dto.txHash,
        onChainListingId,
        listedAt: new Date(),
      },
    });

    return {
      id: created.id,
      onChainListingId: created.onChainListingId ?? undefined,
      nftAddress: created.nftAddress,
      tokenId: created.tokenId,
      seller: seller.walletAddress,
      price: created.price,
      collectionName: created.collectionName,
      chain: created.chain,
      chainId: created.chainId,
      imageUrl: created.imageUrl,
      name: created.name,
      description: created.description,
      status: created.status,
      timestamp: created.createdAt.toISOString(),
    };
  }

  async buy(id: string, buyerAddress: string, txHash: string): Promise<ListingRecord> {
    const normalizedBuyer = buyerAddress.toLowerCase();
    
    let buyer = await this.prisma.user.findUnique({
      where: { walletAddress: normalizedBuyer },
    });

    if (!buyer) {
      buyer = await this.prisma.user.create({
        data: {
          walletAddress: normalizedBuyer,
          displayName: `Collector ${normalizedBuyer.substring(0, 6)}`,
        },
      });
    }

    const listing = await this.prisma.marketplaceListing.findUnique({ where: { id }, include: { seller: true } });
    if (!listing) throw new NotFoundException('Listing not found');

    const client = createPublicClient({
      chain: getViemChain(listing.chainId),
      transport: http(),
    });

    try {
      const receipt = await client.getTransactionReceipt({ hash: txHash as `0x${string}` });
      if (receipt.status !== 'success') {
        throw new BadRequestException('Transaction failed on-chain');
      }

      let matched = false;
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: [parseAbiItem('event TokenBought(uint256 indexed listingId, address indexed nftAddress, uint256 indexed tokenId, address buyer, address seller, uint256 price, uint256 royaltyPaid, uint256 feePaid)')],
            data: log.data,
            topics: log.topics,
          });
          if (
            decoded.eventName === 'TokenBought' &&
            decoded.args.nftAddress.toLowerCase() === listing.nftAddress.toLowerCase() &&
            Number(decoded.args.tokenId) === listing.tokenId &&
            decoded.args.buyer.toLowerCase() === buyerAddress.toLowerCase() &&
            decoded.args.seller.toLowerCase() === listing.seller.walletAddress.toLowerCase()
          ) {
            matched = true;
            break;
          }
        } catch {
          // ignore
        }
      }

      if (!matched) {
        throw new BadRequestException('TokenBought event matching nftAddress, tokenId, buyer, and seller not found in transaction logs');
      }
    } catch (err: any) {
      throw new BadRequestException(err.message || 'Invalid transaction hash or receipt not found');
    }

    const updated = await this.prisma.marketplaceListing.update({
      where: { id },
      data: {
        status: 'SOLD',
        buyerId: buyer.id,
        saleTransactionHash: txHash,
        soldAt: new Date(),
      },
      include: { seller: true },
    });

    await this.prisma.transactionRecord.create({
      data: {
        txHash,
        network: updated.chain,
        type: 'BUY',
        userId: buyer.id,
        details: JSON.stringify({ listingId: updated.id, price: updated.price, tokenId: updated.tokenId }),
      },
    });

    return {
      id: updated.id,
      nftAddress: updated.nftAddress,
      tokenId: updated.tokenId,
      seller: updated.seller?.walletAddress || '0x0000000000000000000000000000000000000000',
      price: updated.price,
      collectionName: updated.collectionName,
      chain: updated.chain,
      imageUrl: updated.imageUrl,
      name: updated.name,
      description: updated.description,
      status: updated.status,
      buyer: buyer.walletAddress,
      txHash,
      timestamp: updated.updatedAt.toISOString(),
    };
  }

  async cancel(id: string, txHash: string, sellerWalletAddress?: string): Promise<ListingRecord> {
    const listing = await this.prisma.marketplaceListing.findUnique({ where: { id }, include: { seller: true } });
    if (!listing) throw new NotFoundException('Listing not found');

    if (!sellerWalletAddress || !listing.seller || listing.seller.walletAddress.toLowerCase() !== sellerWalletAddress.toLowerCase()) {
      throw new ForbiddenException('You do not own this listing and cannot cancel it.');
    }

    const client = createPublicClient({
      chain: getViemChain(listing.chainId),
      transport: http(),
    });

    try {
      const receipt = await client.getTransactionReceipt({ hash: txHash as `0x${string}` });
      if (receipt.status !== 'success') {
        throw new BadRequestException('Transaction failed on-chain');
      }
    } catch (err) {
      throw new BadRequestException('Invalid transaction hash or receipt not found');
    }

    const updated = await this.prisma.marketplaceListing.update({
      where: { id },
      data: { 
        status: 'CANCELLED',
        cancelTransactionHash: txHash,
        cancelledAt: new Date()
      },
      include: { seller: true },
    });

    return {
      id: updated.id,
      nftAddress: updated.nftAddress,
      tokenId: updated.tokenId,
      seller: updated.seller?.walletAddress || '0x0000000000000000000000000000000000000000',
      price: updated.price,
      collectionName: updated.collectionName,
      chain: updated.chain,
      imageUrl: updated.imageUrl,
      name: updated.name,
      description: updated.description,
      status: updated.status,
      timestamp: updated.updatedAt.toISOString(),
    };
  }
}
