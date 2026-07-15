import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileService } from '../profile/profile.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { DefiService } from '../defi/defi.service';
import { DaoService } from '../dao/dao.service';
import { NftService } from '../nft/nft.service';
import { MarketplaceService } from '../marketplace/marketplace.service';
import OpenAI from 'openai';

export interface PlanStep {
  id: string;
  tool: string;
  parameters: Record<string, any>;
  status: 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'FAILED';
  result?: any;
}

export interface ExecutionPlan {
  goal: string;
  steps: PlanStep[];
}

export interface PreparedTx {
  to: string;
  data: string;
  value: string;
  estimatedGas?: string;
}

export interface OrchestratorIntent {
  type:
    | 'deploy-erc721'
    | 'deploy-erc20'
    | 'launch-dao'
    | 'estimate-gas'
    | 'stake-tokens'
    | 'optimize-royalties'
    | 'analyze-portfolio'
    | 'swap-tokens'
    | 'general';
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
  plan?: ExecutionPlan;
  preparedTx?: PreparedTx;
  approvalRequired?: boolean;
  approvalDetails?: Record<string, any>;
}

@Injectable()
export class AiOrchestratorService {
  private readonly logger = new Logger(AiOrchestratorService.name);
  private openai: OpenAI | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly profileService: ProfileService,
    private readonly analyticsService: AnalyticsService,
    private readonly defiService: DefiService,
    private readonly daoService: DaoService,
    private readonly nftService: NftService,
    private readonly marketplaceService: MarketplaceService,
  ) {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } else {
      this.logger.warn('OPENAI_API_KEY is not set. AI Orchestrator will run in local deterministic mode.');
    }
  }

  /**
   * Process a natural language command.
   * If OpenAI is set up, it utilizes LLM-based intent recognition and tool execution.
   * Otherwise, it uses deterministic rule-based orchestration to allow complete offline development and execution.
   */
  async processCommand(userMessage: string, walletAddress?: string): Promise<OrchestratorResponse> {
    this.logger.log(`AI Orchestrator processing message: "${userMessage.substring(0, 50)}..."`);
    
    if (this.openai) {
      try {
        return await this.processWithLLM(userMessage, walletAddress);
      } catch (err: any) {
        this.logger.error(`LLM orchestration failed: ${err.message}. Falling back to local handler.`);
        return this.processDeterministic(userMessage, walletAddress);
      }
    }

    return this.processDeterministic(userMessage, walletAddress);
  }

  /**
   * AI-Agent Tool Execution & Planning utilizing OpenAI
   */
  private async processWithLLM(userMessage: string, walletAddress?: string): Promise<OrchestratorResponse> {
    const systemPrompt = `You are WCOS-Agent, the execution orchestrator for the Web3 Creator Operating System.
Your job is to understand natural-language creator requests and map them to structured actions or replies.

Supported intent types:
1. deploy-erc721 (NFT generation, uploading metadata, creating collection, preparing mints)
2. deploy-erc20 (Launching creator tokens)
3. launch-dao (Creating Governor DAOs)
4. estimate-gas (Gas preview)
5. stake-tokens (Staking configurations)
6. optimize-royalties (Royalty advice)
7. analyze-portfolio (Portfolio details)
8. swap-tokens (Token swap quotes & preparations)
9. general (Standard chat or help)

Available Read-Only Tools (safe to execute instantly):
- getProfile(walletAddress)
- getCreatorAnalytics(walletAddress)
- getGlobalMetrics()
- getMarketplaceListings()
- getStakingPositions(walletAddress, chainId)
- getGovernanceProposals(chainId)

Available Transactional Tools (high-risk, prepare transaction but REQUIRE user confirmation):
- prepareNFTMint(contractAddress, chainId, ownerAddress, name, description)
- prepareNFTListing(nftAddress, tokenId, price, sellerAddress, collectionName)
- prepareSwapQuote(sellToken, buyToken, sellAmount, walletAddress, chainId)
- prepareStaking(walletAddress, amount, durationDays)
- prepareVote(proposalId, support, weight, walletAddress)

Response Format Requirement:
You MUST respond with a single, valid JSON object containing:
{
  "reply": "Friendly response explaining details",
  "intent": {
    "type": "deploy-erc721" | "deploy-erc20" | "launch-dao" | "estimate-gas" | "stake-tokens" | "optimize-royalties" | "analyze-portfolio" | "swap-tokens" | "general",
    "title": "Short title",
    "description": "Short description",
    "data": {},
    "navigateTo": "optional routing path"
  },
  "suggestions": ["suggested user reply 1", "suggested user reply 2"],
  "plan": {
    "goal": "Explain the goal",
    "steps": [
      { "id": "step-1", "tool": "toolName", "parameters": {}, "status": "PENDING" }
    ]
  },
  "approvalRequired": true/false
}
Do not wrap JSON in markdown block code. Output raw JSON only.`;

    const response = await this.openai!.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Message: "${userMessage}". Wallet address context: ${walletAddress || 'None'}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    const payload = JSON.parse(content);
    const resolvedResponse: OrchestratorResponse = {
      reply: payload.reply || 'Request processed.',
      intent: payload.intent || null,
      suggestions: payload.suggestions || [],
    };

    // Execute read-only plan steps directly inside the backend
    if (payload.plan?.steps) {
      const plan: ExecutionPlan = {
        goal: payload.plan.goal || 'Execution plan',
        steps: [],
      };

      for (const step of payload.plan.steps) {
        const executedStep = await this.executeStep(step, walletAddress);
        plan.steps.push(executedStep);
      }

      resolvedResponse.plan = plan;

      // Extract transaction result or approval details if generated by step executions
      const txStep = plan.steps.find((s) => s.tool.startsWith('prepare') && s.status === 'COMPLETED');
      if (txStep?.result?.preparedTx) {
        resolvedResponse.preparedTx = txStep.result.preparedTx;
        resolvedResponse.approvalRequired = true;
        resolvedResponse.approvalDetails = txStep.result.approvalDetails;
      }
    }

    return resolvedResponse;
  }

  /**
   * Execute a single step in the generated plan
   */
  private async executeStep(step: PlanStep, walletAddress?: string): Promise<PlanStep> {
    const updatedStep: PlanStep = { ...step, status: 'EXECUTING' };
    const wallet = walletAddress?.toLowerCase();

    try {
      switch (step.tool) {
        case 'getProfile': {
          const addr = step.parameters.walletAddress || wallet;
          if (!addr) throw new BadRequestException('Wallet address is required for profile query.');
          const res = await this.profileService.getProfile(addr);
          updatedStep.result = res;
          updatedStep.status = 'COMPLETED';
          break;
        }
        case 'getCreatorAnalytics': {
          const addr = step.parameters.walletAddress || wallet;
          if (!addr) throw new BadRequestException('Wallet address is required for analytics.');
          const res = await this.analyticsService.getCreatorAnalytics(addr);
          updatedStep.result = res;
          updatedStep.status = 'COMPLETED';
          break;
        }
        case 'getGlobalMetrics': {
          const res = await this.analyticsService.getGlobalMetrics();
          updatedStep.result = res;
          updatedStep.status = 'COMPLETED';
          break;
        }
        case 'getMarketplaceListings': {
          const res = await this.marketplaceService.findAll();
          updatedStep.result = res;
          updatedStep.status = 'COMPLETED';
          break;
        }
        case 'getStakingPositions': {
          const addr = step.parameters.walletAddress || wallet;
          const chainId = step.parameters.chainId || 84532;
          if (!addr) throw new BadRequestException('Wallet address required.');
          const res = await this.defiService.getStakingPositions(addr, chainId);
          updatedStep.result = res;
          updatedStep.status = 'COMPLETED';
          break;
        }
        case 'getGovernanceProposals': {
          const chainId = step.parameters.chainId || 84532;
          const res = await this.daoService.getProposals(chainId);
          updatedStep.result = res;
          updatedStep.status = 'COMPLETED';
          break;
        }
        case 'prepareNFTMint': {
          const addr = step.parameters.ownerAddress || wallet;
          if (!addr) throw new BadRequestException('Owner wallet address required.');
          const chainId = Number(step.parameters.chainId) || 84532;

          // Call the NFT service to create a pending mint entry in the database
          const record = await this.nftService.createPendingMint({
            contractAddress: step.parameters.contractAddress || '0x498e82d77c29faf0605a96e3d4f59e9e0c1bec3a',
            chainId,
            ownerAddress: addr,
            name: step.parameters.name || 'AI Space Explorer',
            description: step.parameters.description || 'AI-generated space collectible',
          });

          // Prepare the transaction details (ERC-721 mint function calldata approximation)
          // ABI selector for standard mint: 0x40c10f19 (mint(address,uint256))
          const mockData = `0x40c10f19000000000000000000000000${addr.substring(2)}`;

          updatedStep.result = {
            recordId: record.id,
            preparedTx: {
              to: record.contractAddress,
              data: mockData,
              value: '0',
            },
            approvalDetails: {
              action: 'MINT_NFT',
              description: `Minting new NFT asset "${record.name}" on Chain ${chainId}`,
              estimatedGas: '0.00015 ETH',
            },
          };
          updatedStep.status = 'COMPLETED';
          break;
        }
        case 'prepareSwapQuote': {
          const addr = step.parameters.walletAddress || wallet;
          if (!addr) throw new BadRequestException('Wallet address required.');
          const chainId = Number(step.parameters.chainId) || 84532;

          const quote = await this.defiService.getSwapQuote({
            chainId,
            walletAddress: addr as `0x${string}`,
            sellToken: step.parameters.sellToken || 'NATIVE',
            buyToken: step.parameters.buyToken || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
            sellAmount: step.parameters.sellAmount || '100000000000000000', // 0.1 ETH
            slippageBps: 50,
          });

          updatedStep.result = {
            quote,
            preparedTx: {
              to: quote.transactionTarget,
              data: quote.transactionCalldata,
              value: quote.transactionValue,
            },
            approvalDetails: {
              action: 'TOKEN_SWAP',
              description: `Swap ${quote.sellToken} to ${quote.buyToken} via OpenOcean`,
              slippage: '0.5%',
            },
          };
          updatedStep.status = 'COMPLETED';
          break;
        }
        default:
          throw new BadRequestException(`Unknown step tool: ${step.tool}`);
      }
    } catch (err: any) {
      this.logger.error(`Error executing step ${step.tool}: ${err.message}`);
      updatedStep.status = 'FAILED';
      updatedStep.result = { error: err.message };
    }

    return updatedStep;
  }

  /**
   * Deterministic local route handler (replaces mock placeholders with actual database/service calls)
   */
  private async processDeterministic(userMessage: string, walletAddress?: string): Promise<OrchestratorResponse> {
    const lower = userMessage.toLowerCase().trim();
    const wallet = walletAddress?.toLowerCase();

    // ── 1. PORTFOLIO & ANALYTICS VIEW ────────────────────────────────────────
    if (lower.includes('portfolio') || lower.includes('balance') || lower.includes('analytics') || lower.includes('revenue')) {
      if (wallet) {
        const stats = await this.analyticsService.getCreatorAnalytics(wallet);
        return {
          reply: `I've fetched your live creator portfolio analytics. Your total revenue is ${stats.overview.totalRevenue} ETH with ${stats.overview.totalNftsMinted} minted NFTs.`,
          intent: {
            type: 'analyze-portfolio',
            title: 'Live Creator Analytics',
            description: 'Retrieved actual data from your creator dashboard.',
            data: stats,
            navigateTo: 'analytics',
            confidence: 1.0,
          },
          suggestions: ['Show collections breakdown', 'View recent activity'],
        };
      }
    }

    // ── 2. NFT PREPARATION ────────────────────────────────────────────────────
    if (lower.includes('mint') || lower.includes('create nft') || lower.includes('cyberpunk nft')) {
      if (wallet) {
        const plan: ExecutionPlan = {
          goal: 'Prepare NFT minting transaction',
          steps: [
            {
              id: 'step-1',
              tool: 'prepareNFTMint',
              parameters: {
                contractAddress: '0x498e82d77C29FAf0605a96E3D4F59E9E0C1BEc3A',
                chainId: 84532,
                ownerAddress: wallet,
                name: 'Space Nomad',
                description: 'Cyberpunk inspired space collection',
              },
              status: 'PENDING',
            },
          ],
        };

        const executedPlan = {
          goal: plan.goal,
          steps: [await this.executeStep(plan.steps[0], wallet)],
        };

        const tx = executedPlan.steps[0].result?.preparedTx;

        return {
          reply: `I've prepared the transaction to mint "Space Nomad" on Base Sepolia. Review details below and click approve to submit to your wallet.`,
          intent: {
            type: 'deploy-erc721',
            title: 'Mint NFT Asset',
            description: 'Deploy collectible on Base Sepolia',
            data: { name: 'Space Nomad', price: '0 ETH' },
            confidence: 1.0,
          },
          suggestions: ['Change name', 'Mint on Mainnet'],
          plan: executedPlan,
          preparedTx: tx,
          approvalRequired: true,
          approvalDetails: executedPlan.steps[0].result?.approvalDetails,
        };
      }
    }

    // ── 3. TOKEN SWAP PREPARATION ──────────────────────────────────────────────
    if (lower.includes('swap') || lower.includes('exchange') || lower.includes('trade')) {
      if (wallet) {
        const plan: ExecutionPlan = {
          goal: 'Prepare swap token quote and transaction',
          steps: [
            {
              id: 'step-1',
              tool: 'prepareSwapQuote',
              parameters: {
                sellToken: 'NATIVE',
                buyToken: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // WGT
                sellAmount: '100000000000000000', // 0.1 ETH
                walletAddress: wallet,
                chainId: 84532,
              },
              status: 'PENDING',
            },
          ],
        };

        const executedPlan = {
          goal: plan.goal,
          steps: [await this.executeStep(plan.steps[0], wallet)],
        };

        const quote = executedPlan.steps[0].result?.quote;
        const tx = executedPlan.steps[0].result?.preparedTx;

        if (quote) {
          return {
            reply: `I retrieved a live swap quote to trade 0.1 ETH for ${quote.expectedBuyAmount} WGT. Review route parameters and confirm transaction below.`,
            intent: {
              type: 'swap-tokens',
              title: 'Swap Quote via OpenOcean',
              description: 'Trade native ETH for WCOS Governance Token.',
              data: quote,
              navigateTo: 'defi/swap',
              confidence: 1.0,
            },
            suggestions: ['Adjust slippage to 1%', 'Compare other pairs'],
            plan: executedPlan,
            preparedTx: tx,
            approvalRequired: true,
            approvalDetails: executedPlan.steps[0].result?.approvalDetails,
          };
        }
      }
    }

    // ── 4. STAKING PREVIEW ────────────────────────────────────────────────────
    if (lower.includes('stake') || lower.includes('staking')) {
      return {
        reply: `Staking is active. Lock WGT governance tokens to earn linear yield: 30-day yields 8% APY, 90-day yields 12% APY, and 1-year locks yield 18% APY.`,
        intent: {
          type: 'stake-tokens',
          title: 'WGT Token Staking',
          description: 'Lock WGT to participate in platform revenue sharing.',
          data: {
            contractAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
            lockAPY: { '30-day': '8%', '90-day': '12%', '365-day': '18%' },
          },
          navigateTo: 'defi/staking',
          confidence: 1.0,
        },
        suggestions: ['Stake WGT', 'View my staking positions'],
      };
    }

    // ── 5. DAO BLUEPRINT ──────────────────────────────────────────────────────
    if (lower.includes('dao') || lower.includes('governance')) {
      const proposals = await this.daoService.getProposals(84532);
      return {
        reply: `Found ${proposals.proposals.length} live governance proposals on WCOS DAO. You can vote, delegate power, or register a new blueprint.`,
        intent: {
          type: 'launch-dao',
          title: 'DAO governance status',
          description: 'Active proposal ballot count.',
          data: { activeProposals: proposals.proposals.length },
          navigateTo: 'dao',
          confidence: 1.0,
        },
        suggestions: ['View proposals list', 'Check voting weight'],
      };
    }

    // ── 6. GENERAL FALLBACK ───────────────────────────────────────────────────
    return {
      reply: `Hello! I am WCOS-Agent, your AI Web3 Creator execution assistant. I can fetch live metrics, prepare DEX token swaps, schedule NFT mints, and inspect DAO proposals. Try: "Show my portfolio balance", "Swap 0.1 ETH to WGT", or "Mint a new NFT on Base".`,
      intent: null,
      suggestions: ['Show portfolio balance', 'Swap 0.1 ETH to WGT', 'Mint NFT on Base', 'Check DAO proposals'],
    };
  }
}
