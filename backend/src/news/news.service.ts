import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

export interface ParsedRssItem {
  title: string;
  link: string;
  summary: string;
  pubDate: string;
  imageUrl?: string;
  source: string;
  category: string;
}

@Injectable()
export class NewsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NewsService.name);
  private syncTimer: NodeJS.Timeout | null = null;
  private isSyncing = false;

  private readonly enableSync = process.env.ENABLE_NEWS_SYNC !== 'false';
  private readonly rssFeedUrls = process.env.RSS_FEED_URLS ? process.env.RSS_FEED_URLS.split(',') : [];

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    this.logger.log('Initializing NewsService module...');
    await this.seedDefaultCategoriesAndSources();
    await this.seedInitialMagazineArticles();

    if (this.enableSync) {
      // Trigger initial sync scan after 5 seconds
      setTimeout(() => {
        this.syncNewsFeeds().catch(err => this.logger.warn(`Initial news sync error: ${err.message}`));
      }, 5000);

      // Schedule periodic RSS ingestion every 1 hour (3600,000 ms)
      this.syncTimer = setInterval(() => {
        this.syncNewsFeeds().catch(err => this.logger.warn(`Periodic news sync error: ${err.message}`));
      }, 3600000);
    }
  }

  onModuleDestroy() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
  }

  /**
   * Helper to slugify titles safely
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Helper to validate HTTP/HTTPS URLs
   */
  private isValidUrl(urlStr: string): boolean {
    try {
      const parsed = new URL(urlStr);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Seed default categories & RSS sources if empty
   */
  private async seedDefaultCategoriesAndSources() {
    const categories = [
      { name: 'NFT', slug: 'nft', description: 'NFT collections, 1-of-1 digital art, and royalties' },
      { name: 'DeFi', slug: 'defi', description: 'Decentralized finance, yield staking, and AMM swaps' },
      { name: 'DAO', slug: 'dao', description: 'Governance proposals, token voting, and treasury vaults' },
      { name: 'Web3', slug: 'web3', description: 'General Web3 ecosystem and creator economy updates' },
      { name: 'AI + Blockchain', slug: 'ai-blockchain', description: 'AI generative models, agents, and smart contract automation' },
      { name: 'Regulation', slug: 'regulation', description: 'Crypto legal frameworks, compliance, and policy' },
      { name: 'Marketplace', slug: 'marketplace', description: 'E-commerce trading volume and secondary market trends' },
      { name: 'Creator Economy', slug: 'creator-economy', description: 'Monetization tools and creator platforms' },
    ];

    for (const cat of categories) {
      await this.prisma.newsCategory.upsert({
        where: { slug: cat.slug },
        update: {},
        create: cat,
      });
    }

    // Load default RSS sources from config file
    try {
      const configPath = path.join(__dirname, 'default-rss-sources.json');
      if (fs.existsSync(configPath)) {
        const fileContent = fs.readFileSync(configPath, 'utf-8');
        const defaultSources = JSON.parse(fileContent);

        for (const src of defaultSources) {
          await this.prisma.newsSource.upsert({
            where: { feedUrl: src.feedUrl },
            update: {},
            create: {
              name: src.name,
              feedUrl: src.feedUrl,
              category: src.category || 'Web3',
              isTrusted: src.isTrusted !== false,
              isActive: true,
            },
          });
        }
      }
    } catch (err: any) {
      this.logger.warn(`Could not load default-rss-sources.json: ${err.message}`);
    }

    // Additional sources from process.env.RSS_FEED_URLS
    if (this.rssFeedUrls.length > 0) {
      for (const url of this.rssFeedUrls) {
        const trimmed = url.trim();
        if (this.isValidUrl(trimmed)) {
          await this.prisma.newsSource.upsert({
            where: { feedUrl: trimmed },
            update: {},
            create: {
              name: new URL(trimmed).hostname,
              feedUrl: trimmed,
              category: 'Web3',
              isTrusted: true,
              isActive: true,
            },
          });
        }
      }
    }
  }

  /**
   * Seed initial magazine long-form articles
   */

  async seedInitialMagazineArticles() {
    const existingCount = await this.prisma.magazineArticle.count();
    if (existingCount > 0) return;

    const seedArticles = [
      {
        slug: 'founder-notes-building-non-custodial-creator-os-on-base',
        title: 'Founder Notes: Building a Non-Custodial Creator OS on Base Network',
        excerpt: 'Why we chose Base Layer 2, SIWE Sign-In with Ethereum, Pinata IPFS pinning, and standard ERC-721 royalties to empower digital creators without corporate lock-in.',
        content: `### Architecture Decisions Behind WCOS

Building a modern Web3 platform requires balancing decentralization, cost-efficiency, and user experience. 

When we started designing WCOS, our goal was simple: provide creators with a seamless workspace where AI artwork synthesis, IPFS metadata pinning, on-chain minting, and marketplace trading feel as fluid as traditional SaaS applications.

#### 1. Why Base Layer 2?
Base offers sub-second finality and transaction fees costing fractions of a cent ($0.0005 vs $15+ on Ethereum L1). This makes high-frequency creator actions — like generating metadata and minting multi-edition collections — accessible worldwide.

#### 2. Non-Custodial SIWE Sign-In
Instead of storing user passwords on centralized servers, WCOS implements EIP-4361 Sign-In with Ethereum (SIWE). Users sign a cryptographic nonce with their wallet, obtaining a secure JWT session token without giving up private keys.

#### 3. Decentralized IPFS Metadata Pinning
Token images and metadata JSON shouldn't rely on fragile web servers. By integrating Pinata IPFS pinning, every NFT minted on WCOS carries an immutable \`ipfs://\` URI that resolves permanently on the IPFS gateway network.`,
        authorName: 'WCOS Founder',
        authorRole: 'Core Architect',
        authorAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=FounderWCOS',
        category: 'founder-notes',
        imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80',
        isEditorPick: true,
        isFeatured: true,
        readTime: '8 min',
        tags: JSON.stringify(['Web3', 'Base', 'IPFS', 'Architecture']),
      },
      {
        slug: 'artist-spotlight-nya-ai-collectibles',
        title: 'Artist Spotlight: How Cyber-Visualist Nya Generates & Mints 1-of-1 AI Collectibles',
        excerpt: 'An inside look at Nya\'s workflow — combining custom seed prompts, IPFS Pinata metadata pinning, and automated Base Sepolia smart contract deployment.',
        content: `### Digital Artistry in the Age of Generative AI

Nya is a digital artist who has minted over 150 unique 1-of-1 pieces on Base network using WCOS.

> "AI is an extension of my imagination. It gives me a canvas where lighting, futuristic cybernetics, and abstract motion blend together instantly."

#### The Creator Workflow
1. **Prompt Crafting**: Experimenting with seed weights and lens parameters in WCOS AI Studio.
2. **IPFS Pinning**: Pinning standard metadata JSON with custom trait attributes.
3. **Smart Contract Minting**: Triggering non-custodial minting on Base Sepolia.
4. **Marketplace Listing**: Setting 5% EIP-2981 royalties for secondary trading.`,
        authorName: 'Maya Lin',
        authorRole: 'Editorial Director',
        category: 'artist-spotlight',
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        isEditorPick: true,
        isFeatured: false,
        readTime: '6 min',
        tags: JSON.stringify(['AI Art', 'Creator Spotlight', 'NFTs']),
      },
      {
        slug: 'web3-deep-dive-smart-contract-escrows',
        title: 'Web3 Deep Dive: How Smart Contract Escrows Eliminate Counterparty Risk',
        excerpt: 'A technical breakdown of atomic swaps, EIP-2981 royalty calculations, and non-custodial token escrow mechanics built into WCOS Marketplace.',
        content: `### Atomic Swaps in Decentralized Marketplaces

Traditional secondary market transactions rely on third-party escrows that hold seller funds and buyer tokens. WCOS Marketplace uses smart contract logic to perform atomic swaps in a single transaction.

\`\`\`solidity
function buyToken(address nftAddress, uint256 tokenId) external payable nonReentrant {
    Listing storage listing = listings[nftAddress][tokenId];
    require(listing.status == ListingStatus.Active, "Listing not active");
    require(msg.value >= listing.price, "Insufficient payment");

    // Pay royalty via EIP-2981
    (address royaltyReceiver, uint256 royaltyAmount) = IERC2981(nftAddress).royaltyInfo(tokenId, listing.price);
    
    // Transfer ETH & NFT atomically
    payable(listing.seller).transfer(listing.price - royaltyAmount);
    payable(royaltyReceiver).transfer(royaltyAmount);
    IERC721(nftAddress).safeTransferFrom(address(this), msg.sender, tokenId);
}
\`\`\``,
        authorName: 'Dr. Aris Vance',
        authorRole: 'Smart Contract Lead',
        category: 'web3-deep-dives',
        imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
        isEditorPick: false,
        isFeatured: false,
        readTime: '10 min',
        tags: JSON.stringify(['Smart Contracts', 'Solidity', 'Security']),
      },
    ];

    for (const art of seedArticles) {
      await this.prisma.magazineArticle.create({
        data: art,
      });
    }

    this.logger.log('Seeded initial magazine articles into database.');
  }

  /**
   * Parse simple XML/RSS feed using regex & node fetch (avoids heavy external npm libs)
   */
  private async fetchRssFeed(feedUrl: string, defaultCategory: string): Promise<ParsedRssItem[]> {
    try {
      const res = await fetch(feedUrl, {
        headers: { 'User-Agent': 'WCOS-News-Indexer/1.0' },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const xmlText = await res.text();
      const items: ParsedRssItem[] = [];

      // Regex matching <item> or <entry> blocks
      const itemRegex = /<(?:item|entry)[\s\S]*?<\/(?:item|entry)>/gi;
      const matchedBlocks = xmlText.match(itemRegex) || [];

      for (const block of matchedBlocks.slice(0, 10)) {
        // Extract title
        const titleMatch = block.match(/<title[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/title>/i);
        const rawTitle = titleMatch ? (titleMatch[1] || titleMatch[2] || '').trim() : '';

        // Extract link
        const linkMatch = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*>|<link[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/link>/i);
        const rawLink = linkMatch ? (linkMatch[1] || linkMatch[2] || linkMatch[3] || '').trim() : '';

        // Extract summary/description
        const descMatch = block.match(/<(?:description|summary|content:encoded)[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/(?:description|summary|content:encoded)>/i);
        let rawDesc = descMatch ? (descMatch[1] || descMatch[2] || '').trim() : '';
        // Strip HTML tags from summary
        rawDesc = rawDesc.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').slice(0, 280);

        // Extract pubDate
        const dateMatch = block.match(/<(?:pubDate|updated|dc:date)[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/(?:pubDate|updated|dc:date)>/i);
        const rawDate = dateMatch ? (dateMatch[1] || dateMatch[2] || '').trim() : new Date().toISOString();

        // Extract image if available
        const imgMatch = block.match(/<media:content[^>]*url=["']([^"']+)["']|<enclosure[^>]*url=["']([^"']+)["']|<img[^>]*src=["']([^"']+)["']/i);
        const imageUrl = imgMatch ? (imgMatch[1] || imgMatch[2] || imgMatch[3] || '').trim() : undefined;

        if (rawTitle && rawLink && this.isValidUrl(rawLink)) {
          items.push({
            title: rawTitle,
            link: rawLink,
            summary: rawDesc || rawTitle,
            pubDate: rawDate,
            imageUrl,
            source: new URL(feedUrl).hostname.replace('www.', ''),
            category: defaultCategory,
          });
        }
      }

      return items;
    } catch (err: any) {
      this.logger.warn(`Could not fetch RSS feed from ${feedUrl}: ${err.message}`);
      return [];
    }
  }

  /**
   * Main sync engine scanning active RSS sources and persisting new articles
   */
  async syncNewsFeeds(): Promise<{ syncedSources: number; newArticlesCount: number }> {
    if (this.isSyncing) {
      return { syncedSources: 0, newArticlesCount: 0 };
    }

    this.isSyncing = true;
    let newArticlesCount = 0;
    let syncedSources = 0;

    try {
      const sources = await this.prisma.newsSource.findMany({
        where: { isActive: true },
      });

      for (const src of sources) {
        syncedSources++;
        const items = await this.fetchRssFeed(src.feedUrl, src.category);

        for (const item of items) {
          // 1. Check duplicate by sourceUrl
          const existing = await this.prisma.newsArticle.findUnique({
            where: { sourceUrl: item.link },
          });

          if (existing) continue;

          // 2. Generate unique slug
          let slug = this.slugify(item.title);
          if (!slug) slug = `article-${Date.now()}`;

          const existingSlug = await this.prisma.newsArticle.findUnique({
            where: { slug },
          });
          if (existingSlug) {
            slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
          }

          // 3. Status moderation check: untrusted sources -> DRAFT
          const status = src.isTrusted ? 'PUBLISHED' : 'DRAFT';

          // 4. Save to database
          await this.prisma.newsArticle.create({
            data: {
              slug,
              title: item.title,
              summary: item.summary,
              source: src.name || item.source,
              sourceUrl: item.link,
              imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80',
              category: src.category || 'Web3',
              publishedAt: new Date(item.pubDate),
              status,
              readTime: '3 min',
            },
          });

          newArticlesCount++;
        }
      }

      this.logger.log(`News sync completed: scanned ${syncedSources} sources, added ${newArticlesCount} new articles.`);
      return { syncedSources, newArticlesCount };
    } catch (err: any) {
      this.logger.error(`Error during news sync: ${err.message}`);
      throw err;
    } finally {
      this.isSyncing = false;
    }
  }

  // ── Database Access Methods ──────────────────────────────────────────────────

  async findAllNews(category?: string, limit = 20) {
    const where: any = { status: 'PUBLISHED' };
    if (category && category !== 'all') {
      where.category = { equals: category };
    }

    return this.prisma.newsArticle.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });
  }

  async findLatestNews(limit = 6) {
    return this.prisma.newsArticle.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });
  }

  async findByCategory(category: string) {
    return this.prisma.newsArticle.findMany({
      where: { status: 'PUBLISHED', category: { equals: category } },
      orderBy: { publishedAt: 'desc' },
      take: 20,
    });
  }

  async findAllMagazine(category?: string) {
    const where: any = {};
    if (category && category !== 'all') {
      where.category = category;
    }

    return this.prisma.magazineArticle.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
    });
  }

  async findMagazineBySlug(slug: string) {
    return this.prisma.magazineArticle.findUnique({
      where: { slug },
    });
  }
}
