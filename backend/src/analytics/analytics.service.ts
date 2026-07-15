import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface TimeSeriesPoint {
  label: string;
  value: number;
}

export interface CreatorAnalytics {
  walletAddress: string;
  overview: {
    totalRevenue: string;
    totalRoyalties: string;
    totalNftsMinted: number;
    totalCollections: number;
    totalVolume: string;
    avgSalePrice: string;
  };
  revenueTimeSeries: TimeSeriesPoint[];
  mintingTimeSeries: TimeSeriesPoint[];
  royaltiesTimeSeries: TimeSeriesPoint[];
  collectionBreakdown: Array<{
    name: string;
    minted: number;
    volume: string;
    royalties: string;
    floorPrice: string;
  }>;
  audienceMetrics: {
    uniqueHolders: number;
    repeatBuyers: number;
    avgHoldDuration: string;
    topChain: string;
  };
  topSales: Array<{
    tokenId: string;
    collection: string;
    salePrice: string;
    buyer: string;
    timestamp: string;
  }>;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCreatorAnalytics(walletAddress: string): Promise<CreatorAnalytics> {
    const normalized = walletAddress.toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { walletAddress: normalized },
      include: { collections: true, listings: true },
    });

    // Fetch real metrics from the database
    const [nftsMinted, soldListings, allListings, uniqueHolders, recentSales] = await Promise.all([
      this.prisma.nft.count({
        where: { minterAddress: normalized, status: 'MINTED' },
      }),
      this.prisma.marketplaceListing.findMany({
        where: { seller: { walletAddress: normalized }, status: 'SOLD' },
        select: { price: true, soldAt: true, buyerId: true, tokenId: true, name: true, collectionName: true },
        orderBy: { soldAt: 'desc' },
      }),
      this.prisma.marketplaceListing.findMany({
        where: { seller: { walletAddress: normalized } },
        select: { price: true, createdAt: true, status: true },
      }),
      this.prisma.nft.findMany({
        where: { creatorAddress: normalized, status: 'MINTED' },
        select: { ownerAddress: true },
        distinct: ['ownerAddress'],
      }),
      this.prisma.nftSale.findMany({
        where: { sellerAddress: normalized },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { tokenId: true, price: true, buyerAddress: true, createdAt: true, nftAddress: true },
      }),
    ]);

    const collectionsCount = user?.collections.length || 0;

    // Calculate revenue aggregates
    const totalRevenue = soldListings.reduce((sum, l) => sum + (parseFloat(l.price) || 0), 0);
    const totalVolume = allListings.reduce((sum, l) => sum + (parseFloat(l.price) || 0), 0);
    const avgSalePrice = soldListings.length > 0 ? totalRevenue / soldListings.length : 0;
    const totalRoyalties = totalRevenue * 0.05;

    // Build monthly time series from sold listings
    const now = new Date();
    const currentYear = now.getFullYear();
    const revenueByMonth: number[] = new Array(12).fill(0);
    const mintsByMonth: number[] = new Array(12).fill(0);

    for (const listing of soldListings) {
      if (listing.soldAt) {
        const soldDate = new Date(listing.soldAt);
        if (soldDate.getFullYear() === currentYear) {
          revenueByMonth[soldDate.getMonth()] += parseFloat(listing.price) || 0;
        }
      }
    }

    // Build minting time series from NFTs
    const mintedNfts = await this.prisma.nft.findMany({
      where: { minterAddress: normalized, status: 'MINTED' },
      select: { createdAt: true },
    });
    for (const nft of mintedNfts) {
      const mintDate = new Date(nft.createdAt);
      if (mintDate.getFullYear() === currentYear) {
        mintsByMonth[mintDate.getMonth()] += 1;
      }
    }

    // Only include months up to the current month
    const currentMonth = now.getMonth();
    const revenueTimeSeries: TimeSeriesPoint[] = [];
    const mintingTimeSeries: TimeSeriesPoint[] = [];
    const royaltiesTimeSeries: TimeSeriesPoint[] = [];

    for (let i = 0; i <= currentMonth; i++) {
      revenueTimeSeries.push({ label: MONTH_LABELS[i], value: parseFloat(revenueByMonth[i].toFixed(4)) });
      mintingTimeSeries.push({ label: MONTH_LABELS[i], value: mintsByMonth[i] });
      royaltiesTimeSeries.push({ label: MONTH_LABELS[i], value: parseFloat((revenueByMonth[i] * 0.05).toFixed(4)) });
    }

    // Collection breakdown from DB
    const collectionBreakdown = (user?.collections || []).map((c) => {
      const collectionSales = soldListings.filter(s => s.collectionName === c.name);
      const collectionVolume = collectionSales.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);
      const collectionRoyalties = collectionVolume * 0.05;
      return {
        name: c.name,
        minted: c.mintedCount || 0,
        volume: collectionVolume.toFixed(4),
        royalties: collectionRoyalties.toFixed(4),
        floorPrice: '0',
      };
    });

    // Audience metrics
    const buyerIds = soldListings.map(s => s.buyerId).filter(Boolean);
    const uniqueBuyers = new Set(buyerIds);
    const repeatBuyers = buyerIds.length - uniqueBuyers.size;

    // Top sales from NftSale table (if populated) or from sold listings
    const topSales = recentSales.length > 0
      ? recentSales.map(s => ({
          tokenId: `#${s.tokenId}`,
          collection: s.nftAddress ? `${s.nftAddress.substring(0, 10)}...` : 'Unknown',
          salePrice: parseFloat(s.price || '0').toFixed(4),
          buyer: s.buyerAddress ? `${s.buyerAddress.substring(0, 6)}...${s.buyerAddress.slice(-4)}` : 'Unknown',
          timestamp: s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : 'Unknown',
        }))
      : soldListings.slice(0, 5).map(s => ({
          tokenId: `#${s.tokenId}`,
          collection: s.collectionName || 'Unknown',
          salePrice: parseFloat(s.price || '0').toFixed(4),
          buyer: 'Unknown',
          timestamp: s.soldAt ? new Date(s.soldAt).toISOString().split('T')[0] : 'Unknown',
        }));

    return {
      walletAddress,
      overview: {
        totalRevenue: totalRevenue.toFixed(4),
        totalRoyalties: totalRoyalties.toFixed(4),
        totalNftsMinted: nftsMinted,
        totalCollections: collectionsCount,
        totalVolume: totalVolume.toFixed(4),
        avgSalePrice: avgSalePrice.toFixed(4),
      },
      revenueTimeSeries,
      mintingTimeSeries,
      royaltiesTimeSeries,
      collectionBreakdown,
      audienceMetrics: {
        uniqueHolders: uniqueHolders.length,
        repeatBuyers: repeatBuyers > 0 ? repeatBuyers : 0,
        avgHoldDuration: 'N/A',
        topChain: 'Base Sepolia',
      },
      topSales,
    };
  }

  async getGlobalMetrics() {
    const [totalCreators, totalNftsMinted, activeListings, activeDAOs, totalVolume] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.nft.count({ where: { status: 'MINTED' } }),
      this.prisma.marketplaceListing.count({ where: { status: 'ACTIVE' } }),
      this.prisma.daoOrganization.count(),
      this.prisma.marketplaceListing.findMany({
        where: { status: 'SOLD' },
        select: { price: true },
      }),
    ]);

    const totalVolumeValue = totalVolume.reduce((sum, l) => sum + (parseFloat(l.price) || 0), 0);

    return {
      totalCreators,
      totalNftsMinted,
      totalVolume: totalVolumeValue.toFixed(4),
      activeListings,
      activeDAOs,
      topCollection: 'N/A',
    };
  }
}
