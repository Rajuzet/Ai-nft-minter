import { Injectable } from '@nestjs/common';

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

@Injectable()
export class AnalyticsService {
  getCreatorAnalytics(walletAddress: string): CreatorAnalytics {
    // Simulated data — in production this would query an on-chain indexer (e.g. The Graph)
    return {
      walletAddress,
      overview: {
        totalRevenue: '$51,921.00',
        totalRoyalties: '$2,340.50',
        totalNftsMinted: 47,
        totalCollections: 3,
        totalVolume: '$89,450.00',
        avgSalePrice: '$1,902.13',
      },
      revenueTimeSeries: [
        { label: 'Jan', value: 4200 },
        { label: 'Feb', value: 6800 },
        { label: 'Mar', value: 5200 },
        { label: 'Apr', value: 9100 },
        { label: 'May', value: 7400 },
        { label: 'Jun', value: 11200 },
        { label: 'Jul', value: 8021 },
      ],
      mintingTimeSeries: [
        { label: 'Jan', value: 4 },
        { label: 'Feb', value: 8 },
        { label: 'Mar', value: 6 },
        { label: 'Apr', value: 12 },
        { label: 'May', value: 9 },
        { label: 'Jun', value: 5 },
        { label: 'Jul', value: 3 },
      ],
      royaltiesTimeSeries: [
        { label: 'Jan', value: 210 },
        { label: 'Feb', value: 340 },
        { label: 'Mar', value: 260 },
        { label: 'Apr', value: 455 },
        { label: 'May', value: 370 },
        { label: 'Jun', value: 560 },
        { label: 'Jul', value: 145.5 },
      ],
      collectionBreakdown: [
        { name: 'Cyberpunk Wanderers', minted: 24, volume: '$48,000', royalties: '$1,200', floorPrice: '$1,800' },
        { name: 'Abstract Genesis', minted: 15, volume: '$27,450', royalties: '$822', floorPrice: '$1,200' },
        { name: 'Neon Phantoms', minted: 8, volume: '$14,000', royalties: '$318.50', floorPrice: '$1,400' },
      ],
      audienceMetrics: {
        uniqueHolders: 38,
        repeatBuyers: 12,
        avgHoldDuration: '43 days',
        topChain: 'Base Sepolia',
      },
      topSales: [
        { tokenId: '#0024', collection: 'Cyberpunk Wanderers', salePrice: '$3,200', buyer: '0x70997...79C8', timestamp: '2026-06-28' },
        { tokenId: '#0009', collection: 'Abstract Genesis', salePrice: '$2,800', buyer: '0xf39Fd...2266', timestamp: '2026-06-22' },
        { tokenId: '#0031', collection: 'Cyberpunk Wanderers', salePrice: '$2,600', buyer: '0x3c44c...3bc', timestamp: '2026-06-18' },
        { tokenId: '#0003', collection: 'Neon Phantoms', salePrice: '$2,100', buyer: '0xbeef...1234', timestamp: '2026-06-12' },
      ],
    };
  }

  getGlobalMetrics() {
    return {
      totalCreators: 1240,
      totalNftsMinted: 48900,
      totalVolume: '$12.4M',
      activeListings: 3420,
      activeDAOs: 18,
      topCollection: 'Cyberpunk Wanderers',
    };
  }
}
