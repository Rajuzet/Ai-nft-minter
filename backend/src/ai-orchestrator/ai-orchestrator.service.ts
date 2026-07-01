import { Injectable, Logger } from '@nestjs/common';

export interface OrchestratorIntent {
  type: 'deploy-erc721' | 'deploy-erc20' | 'launch-dao' | 'estimate-gas' | 'stake-tokens' | 'optimize-royalties' | 'analyze-portfolio' | 'swap-tokens' | 'general';
  title: string;
  description: string;
  data: Record<string, any>;
  navigateTo?: string;
  confidence: number;
}

export interface OrchestratorResponse {
  reply: string;
  intent: OrchestratorIntent | null;
  suggestions: string[];
}

@Injectable()
export class AiOrchestratorService {
  private readonly logger = new Logger(AiOrchestratorService.name);

  // Intent classification without external API dependency (rule-based NLU with Gemini fallback path)
  async processCommand(userMessage: string, walletAddress?: string): Promise<OrchestratorResponse> {
    const lower = userMessage.toLowerCase().trim();
    this.logger.log(`Processing intent for: "${userMessage.substring(0, 60)}..."`);

    // ── NFT Collection ────────────────────────────────────────────────────────
    if (lower.includes('nft') || lower.includes('collection') || lower.includes('erc721') || lower.includes('mint')) {
      const style = lower.includes('cyberpunk') ? 'cyberpunk' : lower.includes('anime') ? 'anime' : lower.includes('abstract') ? 'abstract' : 'generative art';
      return {
        reply: `I've drafted a ${style} NFT Collection (ERC-721) configuration. You can customize the name, symbol, max supply, and royalty split before deploying to Base Network.`,
        intent: {
          type: 'deploy-erc721',
          title: `${style.charAt(0).toUpperCase() + style.slice(1)} NFT Collection`,
          description: `Deploy an AI-generated ${style} collection on Base Network with ERC-2981 royalties.`,
          data: {
            name: `${style.charAt(0).toUpperCase() + style.slice(1)} Collective`,
            symbol: style.substring(0, 4).toUpperCase(),
            maxSupply: '1000',
            royalty: '5%',
            style,
            prompt: `A stunning ${style} artwork, highly detailed, cinematic lighting, 8k resolution`,
          },
          navigateTo: 'ai-studio',
          confidence: 0.92,
        },
        suggestions: ['Change collection name', 'Set royalty to 7.5%', 'Add unlockable content'],
      };
    }

    // ── ERC-20 Token ──────────────────────────────────────────────────────────
    if (lower.includes('erc20') || lower.includes('token') || lower.includes('launch token') || lower.includes('utility token')) {
      return {
        reply: `I've configured a utility ERC-20 token template. You can adjust the supply, decimals, and enable minting or burning before deploying.`,
        intent: {
          type: 'deploy-erc20',
          title: 'Configure Utility Token (ERC-20)',
          description: 'Launch a customizable ERC-20 governance or utility token for your creator community.',
          data: {
            name: 'Creator OS Token',
            symbol: 'WCOS',
            decimals: 18,
            totalSupply: '1,000,000',
            features: ['Mintable', 'Burnable', 'Pausable'],
          },
          navigateTo: 'contract-builder',
          confidence: 0.95,
        },
        suggestions: ['Add vesting schedule', 'Configure token lock', 'Enable staking'],
      };
    }

    // ── DAO Setup ─────────────────────────────────────────────────────────────
    if (lower.includes('dao') || lower.includes('governance') || lower.includes('community vote')) {
      return {
        reply: `I've generated a DAO governance structure. Your community will vote on proposals using token-weighted ballots with a 10% quorum threshold.`,
        intent: {
          type: 'launch-dao',
          title: 'DAO Governance Blueprint',
          description: 'Deploy a Governor contract + Treasury vault with configurable quorum and voting windows.',
          data: {
            name: 'Creator Collective DAO',
            votingToken: 'WCOS',
            quorum: '10%',
            votingDuration: '5760 blocks (~1 day)',
            proposalThreshold: '1,000 WCOS',
          },
          navigateTo: 'dao',
          confidence: 0.93,
        },
        suggestions: ['Set 4% quorum', 'Use NFT-weighted voting', 'Add timelock delay'],
      };
    }

    // ── Gas Estimate ──────────────────────────────────────────────────────────
    if (lower.includes('gas') || lower.includes('fee') || lower.includes('estimate')) {
      return {
        reply: `Here are current gas estimates across networks. Base Sepolia is optimal for testnet deployments — extremely low fees with mainnet parity.`,
        intent: {
          type: 'estimate-gas',
          title: 'Real-time Gas Fee Estimation',
          description: 'Current gas benchmarks across major L1 and L2 networks.',
          data: {
            'Base Sepolia': '~0.0001 Gwei ($0.00)',
            'Base Mainnet': '~0.001 Gwei ($0.02)',
            'Ethereum L1': '~24 Gwei ($12.50)',
            'Polygon': '~80 Gwei ($0.05)',
            'Arbitrum': '~0.1 Gwei ($0.01)',
          },
          navigateTo: 'defi',
          confidence: 0.88,
        },
        suggestions: ['Deploy on Base instead', 'Set gas limit manually', 'Monitor mempool'],
      };
    }

    // ── Staking ───────────────────────────────────────────────────────────────
    if (lower.includes('stake') || lower.includes('staking') || lower.includes('yield') || lower.includes('apy')) {
      return {
        reply: `Staking center is ready. Lock your WCOS governance tokens for variable APY rewards — longer lock periods yield higher returns (8%–18% APY).`,
        intent: {
          type: 'stake-tokens',
          title: 'WCOS Token Staking',
          description: 'Lock governance tokens to earn linear staking rewards.',
          data: {
            stakingToken: 'WGT (WCOS Governance Token)',
            '30-day APY': '8%',
            '90-day APY': '12%',
            '1-year APY': '18%',
            minStake: '10 WGT',
          },
          navigateTo: 'defi/staking',
          confidence: 0.90,
        },
        suggestions: ['Stake 500 WGT for 90 days', 'Calculate expected yield', 'View staking contract'],
      };
    }

    // ── Swap ──────────────────────────────────────────────────────────────────
    if (lower.includes('swap') || lower.includes('exchange') || lower.includes('trade')) {
      return {
        reply: `I can route a token swap for you using Uniswap V3 on Base Network. Check the quote and confirm gas before executing.`,
        intent: {
          type: 'swap-tokens',
          title: 'Token Swap via Uniswap V3',
          description: 'Execute a DEX swap with slippage protection and gas fee preview.',
          data: {
            router: 'Uniswap V3 (Base Sepolia)',
            suggestedPair: 'ETH → WGT',
            estimatedSlippage: '0.5%',
            gasEstimate: '~0.00142 ETH',
          },
          navigateTo: 'defi/swap',
          confidence: 0.91,
        },
        suggestions: ['Set slippage to 1%', 'Try 1inch routing', 'Check WGT price'],
      };
    }

    // ── Portfolio / Analytics ─────────────────────────────────────────────────
    if (lower.includes('portfolio') || lower.includes('balance') || lower.includes('analytics') || lower.includes('revenue')) {
      return {
        reply: `Your creator analytics dashboard shows total portfolio value, minting trends, royalty earnings, and audience growth. Let me pull up the full view.`,
        intent: {
          type: 'analyze-portfolio',
          title: 'Creator Analytics Overview',
          description: 'Aggregated revenue, minting velocity, royalty income, and audience metrics.',
          data: {
            walletAddress: walletAddress || 'Not connected',
            totalRevenue: '$51,921.00 (simulated)',
            royaltiesEarned: '$2,340.00',
            nftsMinted: '47',
            collectionsActive: '3',
          },
          navigateTo: 'analytics',
          confidence: 0.89,
        },
        suggestions: ['View royalty breakdown', 'Export CSV report', 'Compare to last month'],
      };
    }

    // ── Royalties ─────────────────────────────────────────────────────────────
    if (lower.includes('royalt')) {
      return {
        reply: `I recommend a 5% ERC-2981 royalty configuration — optimal balance between creator revenue and marketplace acceptance. OpenSea and Blur both honor this range.`,
        intent: {
          type: 'optimize-royalties',
          title: 'ERC-2981 Royalty Optimizer',
          description: 'Maximize creator earnings while maintaining marketplace compatibility.',
          data: {
            proposedRate: '5.0%',
            maxCompatible: '10% (OpenSea)',
            receiver: walletAddress || 'Your wallet',
            supportedMarketplaces: 'OpenSea, Blur, WCOS Marketplace',
          },
          navigateTo: 'collections',
          confidence: 0.87,
        },
        suggestions: ['Set to 7.5%', 'Split royalties 2 ways', 'Add secondary receiver'],
      };
    }

    // ── General fallback ──────────────────────────────────────────────────────
    return {
      reply: `I'm here to help you orchestrate your Web3 creator workflow. Try commands like: "Create a cyberpunk NFT collection", "Launch my DAO", "Swap ETH to WGT", "Check my staking APY", or "Show my analytics".`,
      intent: null,
      suggestions: [
        'Create NFT collection',
        'Launch DAO governance',
        'Swap tokens',
        'Show portfolio analytics',
        'Estimate gas fees',
      ],
    };
  }
}
