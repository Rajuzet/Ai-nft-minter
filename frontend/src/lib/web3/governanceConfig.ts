/**
 * Central Governance Configuration
 * Single source of truth for all chain-specific governance deployments.
 * Do NOT hardcode governance addresses in components — always use this module.
 */

import { baseSepolia, base, mainnet, polygon, arbitrum, optimism } from "wagmi/chains";

// ─── Status Types ─────────────────────────────────────────────────────────────

export type GovernanceStatus =
  | "ACTIVE"
  | "TESTNET"
  | "READ_ONLY"
  | "PAUSED"
  | "GOVERNANCE_NOT_DEPLOYED"
  | "DISABLED";

// ─── Governance Deployment Config ─────────────────────────────────────────────

export interface GovernanceDeploymentConfig {
  chainId: number;
  chainName: string;
  /** WcosGovernanceToken address */
  governanceToken: `0x${string}`;
  /** WcosGovernor address */
  governorContract: `0x${string}`;
  /** WcosTreasury address */
  treasuryContract: `0x${string}`;
  /** Timelock address — null because WcosGovernor has no timelock */
  timelockContract: null;
  /** Governance name */
  name: string;
  /** Token symbol */
  tokenSymbol: string;
  /** Token decimals */
  tokenDecimals: number;
  /** Proposal threshold — min token balance to propose (read from contract; this is a display hint) */
  proposalThresholdHint: string;
  /** Quorum percentage hint (e.g. 10 = 10%) — actual value read from contract */
  quorumPercentHint: number;
  /** Voting duration in blocks — actual value read from contract */
  votingDurationBlocksHint: number;
  /** Overall governance status */
  status: GovernanceStatus;
  /** Whether proposal creation is enabled */
  canCreateProposal: boolean;
  /** Whether voting is enabled */
  canVote: boolean;
  /** Whether execution is enabled */
  canExecute: boolean;
  /** Whether cancel is enabled (proposer-only) */
  canCancel: boolean;
  /** Block explorer base URL */
  explorerUrl: string;
}

// ─── Zero Address Helper ───────────────────────────────────────────────────────

const ZERO = "0x0000000000000000000000000000000000000000" as `0x${string}`;
const isDeployed = (addr: string) => addr !== ZERO;

// ─── Chain Configs ─────────────────────────────────────────────────────────────

const BASE_SEPOLIA_TOKEN   = (process.env.NEXT_PUBLIC_WCOS_GOVERNANCE_TOKEN_ADDRESS || ZERO) as `0x${string}`;
const BASE_SEPOLIA_GOV     = (process.env.NEXT_PUBLIC_WCOS_GOVERNOR_ADDRESS           || ZERO) as `0x${string}`;
const BASE_SEPOLIA_TREASURY = (process.env.NEXT_PUBLIC_WCOS_TREASURY_ADDRESS          || ZERO) as `0x${string}`;

const BASE_MAINNET_TOKEN   = (process.env.NEXT_PUBLIC_WCOS_GOVERNANCE_TOKEN_ADDRESS_BASE || ZERO) as `0x${string}`;
const BASE_MAINNET_GOV     = (process.env.NEXT_PUBLIC_WCOS_GOVERNOR_ADDRESS_BASE         || ZERO) as `0x${string}`;
const BASE_MAINNET_TREASURY = (process.env.NEXT_PUBLIC_WCOS_TREASURY_ADDRESS_BASE        || ZERO) as `0x${string}`;

function buildConfig(
  chainId: number,
  chainName: string,
  token: `0x${string}`,
  governor: `0x${string}`,
  treasury: `0x${string}`,
  explorerUrl: string,
  status: GovernanceStatus
): GovernanceDeploymentConfig {
  const active = status === "ACTIVE" || status === "TESTNET";
  const deployed = isDeployed(token) && isDeployed(governor);
  return {
    chainId,
    chainName,
    governanceToken: token,
    governorContract: governor,
    treasuryContract: treasury,
    timelockContract: null,
    name: "WCOS DAO Governance",
    tokenSymbol: "WGT",
    tokenDecimals: 18,
    proposalThresholdHint: ">0 WGT",
    quorumPercentHint: 10,
    votingDurationBlocksHint: 100,
    status: deployed ? status : "GOVERNANCE_NOT_DEPLOYED",
    canCreateProposal: active && deployed,
    canVote: active && deployed,
    canExecute: active && deployed,
    canCancel: active && deployed,
    explorerUrl,
  };
}

export const GOVERNANCE_CONFIGS: Record<number, GovernanceDeploymentConfig> = {
  [baseSepolia.id]: buildConfig(
    baseSepolia.id,
    "Base Sepolia",
    BASE_SEPOLIA_TOKEN,
    BASE_SEPOLIA_GOV,
    BASE_SEPOLIA_TREASURY,
    "https://sepolia.basescan.org",
    "TESTNET"
  ),
  [base.id]: buildConfig(
    base.id,
    "Base Mainnet",
    BASE_MAINNET_TOKEN,
    BASE_MAINNET_GOV,
    BASE_MAINNET_TREASURY,
    "https://basescan.org",
    "GOVERNANCE_NOT_DEPLOYED"
  ),
  [mainnet.id]: buildConfig(
    mainnet.id, "Ethereum Mainnet",
    ZERO, ZERO, ZERO, "https://etherscan.io",
    "GOVERNANCE_NOT_DEPLOYED"
  ),
  [polygon.id]: buildConfig(
    polygon.id, "Polygon",
    ZERO, ZERO, ZERO, "https://polygonscan.com",
    "GOVERNANCE_NOT_DEPLOYED"
  ),
  [arbitrum.id]: buildConfig(
    arbitrum.id, "Arbitrum",
    ZERO, ZERO, ZERO, "https://arbiscan.io",
    "GOVERNANCE_NOT_DEPLOYED"
  ),
  [optimism.id]: buildConfig(
    optimism.id, "Optimism",
    ZERO, ZERO, ZERO, "https://optimistic.etherscan.io",
    "GOVERNANCE_NOT_DEPLOYED"
  ),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Get governance config for a given chainId. Falls back to not-deployed config. */
export function getGovernanceConfig(chainId: number): GovernanceDeploymentConfig {
  return (
    GOVERNANCE_CONFIGS[chainId] ?? {
      ...GOVERNANCE_CONFIGS[baseSepolia.id],
      chainId,
      chainName: "Unknown Network",
      status: "GOVERNANCE_NOT_DEPLOYED",
      canCreateProposal: false,
      canVote: false,
      canExecute: false,
      canCancel: false,
    }
  );
}

/** Returns true when governance is fully deployed and active/testnet on this chain. */
export function isGovernanceActive(chainId: number): boolean {
  const config = getGovernanceConfig(chainId);
  return config.status === "ACTIVE" || config.status === "TESTNET";
}

/** Returns true when the governance contracts are deployed (regardless of status). */
export function isGovernanceDeployed(chainId: number): boolean {
  const config = getGovernanceConfig(chainId);
  return config.status !== "GOVERNANCE_NOT_DEPLOYED" && config.status !== "DISABLED";
}

/** Block explorer URL for a transaction */
export function getGovExplorerTxUrl(chainId: number, txHash: string): string {
  const config = getGovernanceConfig(chainId);
  return `${config.explorerUrl}/tx/${txHash}`;
}

/** Block explorer URL for an address */
export function getGovExplorerAddressUrl(chainId: number, address: string): string {
  const config = getGovernanceConfig(chainId);
  return `${config.explorerUrl}/address/${address}`;
}

// ─── Proposal State Mapping ────────────────────────────────────────────────────

/** Maps WcosGovernor ProposalState enum index to readable label */
export const PROPOSAL_STATE_LABELS: Record<number, string> = {
  0: "Pending",
  1: "Active",
  2: "Defeated",
  3: "Succeeded",
  4: "Executed",
  5: "Canceled",
};

export const PROPOSAL_STATE_COLORS: Record<number, string> = {
  0: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  1: "text-teal-400 bg-teal-500/10 border-teal-500/20",
  2: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  3: "text-green-400 bg-green-500/10 border-green-500/20",
  4: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  5: "text-slate-400 bg-slate-500/10 border-slate-500/20",
};

/** Chain-specific average block time in seconds (for estimated timestamps) */
export const BLOCK_TIME_SECONDS: Record<number, number> = {
  [baseSepolia.id]: 2,
  [base.id]: 2,
  [mainnet.id]: 12,
  [polygon.id]: 2,
  [arbitrum.id]: 1,
  [optimism.id]: 2,
};

/** Estimate timestamp from a block number and current block data */
export function estimateBlockTimestamp(
  targetBlock: number,
  currentBlock: number,
  currentTimestampMs: number,
  chainId: number
): Date {
  const blockTime = BLOCK_TIME_SECONDS[chainId] ?? 2;
  const deltaMs = (targetBlock - currentBlock) * blockTime * 1000;
  return new Date(currentTimestampMs + deltaMs);
}
