// ─── Chain config ─────────────────────────────────────────────────────────────

import { baseSepolia, base, mainnet, polygon, arbitrum, optimism } from "wagmi/chains";
import { useChainId } from "wagmi";

/** Chain IDs supported by WCOS on-chain features */
export const SUPPORTED_CHAIN_IDS = [
  baseSepolia.id,
  base.id,
  mainnet.id,
  polygon.id,
  arbitrum.id,
  optimism.id,
] as const;

/** Primary testnet chain — used for development and default chain guard */
export const PRIMARY_TESTNET_CHAIN_ID = baseSepolia.id;

// ─── Multi-Chain Contract addresses ──────────────────────────────────────────

export const MULTI_CHAIN_CONTRACT_ADDRESSES: Record<
  number,
  {
    AINFTMinter: `0x${string}`;
    WcosMarketplace: `0x${string}`;
    WcosStaking: `0x${string}`;
    WcosGovernanceToken: `0x${string}`;
    WcosGovernor: `0x${string}`;
    WcosTreasury: `0x${string}`;
    WcosSwapRouter: `0x${string}`;
  }
> = {
  [baseSepolia.id]: {
    AINFTMinter: (process.env.NEXT_PUBLIC_AINFT_MINTER_ADDRESS || "0x498e82d77C29FAf0605a96E3D4F59E9E0C1BEc3A") as `0x${string}`,
    WcosMarketplace: (process.env.NEXT_PUBLIC_WCOS_MARKETPLACE_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    WcosStaking: (process.env.NEXT_PUBLIC_WCOS_STAKING_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    WcosGovernanceToken: (process.env.NEXT_PUBLIC_WCOS_GOVERNANCE_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    WcosGovernor: (process.env.NEXT_PUBLIC_WCOS_GOVERNOR_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    WcosTreasury: (process.env.NEXT_PUBLIC_WCOS_TREASURY_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    WcosSwapRouter: (process.env.NEXT_PUBLIC_WCOS_SWAP_ROUTER_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`,
  },
  [base.id]: {
    AINFTMinter: (process.env.NEXT_PUBLIC_AINFT_MINTER_ADDRESS_BASE || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    WcosMarketplace: (process.env.NEXT_PUBLIC_WCOS_MARKETPLACE_ADDRESS_BASE || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    WcosStaking: (process.env.NEXT_PUBLIC_WCOS_STAKING_ADDRESS_BASE || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    WcosGovernanceToken: (process.env.NEXT_PUBLIC_WCOS_GOVERNANCE_TOKEN_ADDRESS_BASE || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    WcosGovernor: (process.env.NEXT_PUBLIC_WCOS_GOVERNOR_ADDRESS_BASE || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    WcosTreasury: (process.env.NEXT_PUBLIC_WCOS_TREASURY_ADDRESS_BASE || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    WcosSwapRouter: (process.env.NEXT_PUBLIC_WCOS_SWAP_ROUTER_ADDRESS_BASE || "0x0000000000000000000000000000000000000000") as `0x${string}`,
  },
  [mainnet.id]: {
    AINFTMinter: (process.env.NEXT_PUBLIC_AINFT_MINTER_ADDRESS_MAINNET || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    WcosMarketplace: (process.env.NEXT_PUBLIC_WCOS_MARKETPLACE_ADDRESS_MAINNET || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    WcosStaking: (process.env.NEXT_PUBLIC_WCOS_STAKING_ADDRESS_MAINNET || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    WcosGovernanceToken: (process.env.NEXT_PUBLIC_WCOS_GOVERNANCE_TOKEN_ADDRESS_MAINNET || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    WcosGovernor: (process.env.NEXT_PUBLIC_WCOS_GOVERNOR_ADDRESS_MAINNET || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    WcosTreasury: (process.env.NEXT_PUBLIC_WCOS_TREASURY_ADDRESS_MAINNET || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    WcosSwapRouter: (process.env.NEXT_PUBLIC_WCOS_SWAP_ROUTER_ADDRESS_MAINNET || "0xE592427A0AEce92De3Edee1F18E0157C05861564") as `0x${string}`,
  },
  [polygon.id]: {
    AINFTMinter: (process.env.NEXT_PUBLIC_AINFT_MINTER_ADDRESS_POLYGON || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    WcosMarketplace: (process.env.NEXT_PUBLIC_WCOS_MARKETPLACE_ADDRESS_POLYGON || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    WcosStaking: (process.env.NEXT_PUBLIC_WCOS_STAKING_ADDRESS_POLYGON || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    WcosGovernanceToken: (process.env.NEXT_PUBLIC_WCOS_GOVERNANCE_TOKEN_ADDRESS_POLYGON || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    WcosGovernor: (process.env.NEXT_PUBLIC_WCOS_GOVERNOR_ADDRESS_POLYGON || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    WcosTreasury: (process.env.NEXT_PUBLIC_WCOS_TREASURY_ADDRESS_POLYGON || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    WcosSwapRouter: (process.env.NEXT_PUBLIC_WCOS_SWAP_ROUTER_ADDRESS_POLYGON || "0xE592427A0AEce92De3Edee1F18E0157C05861564") as `0x${string}`,
  },
  [arbitrum.id]: {
    AINFTMinter: (process.env.NEXT_PUBLIC_AINFT_MINTER_ADDRESS_ARBITRUM || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    WcosMarketplace: (process.env.NEXT_PUBLIC_WCOS_MARKETPLACE_ADDRESS_ARBITRUM || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    WcosStaking: (process.env.NEXT_PUBLIC_WCOS_STAKING_ADDRESS_ARBITRUM || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    WcosGovernanceToken: (process.env.NEXT_PUBLIC_WCOS_GOVERNANCE_TOKEN_ADDRESS_ARBITRUM || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    WcosGovernor: (process.env.NEXT_PUBLIC_WCOS_GOVERNOR_ADDRESS_ARBITRUM || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    WcosTreasury: (process.env.NEXT_PUBLIC_WCOS_TREASURY_ADDRESS_ARBITRUM || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    WcosSwapRouter: (process.env.NEXT_PUBLIC_WCOS_SWAP_ROUTER_ADDRESS_ARBITRUM || "0xE592427A0AEce92De3Edee1F18E0157C05861564") as `0x${string}`,
  },
  [optimism.id]: {
    AINFTMinter: (process.env.NEXT_PUBLIC_AINFT_MINTER_ADDRESS_OPTIMISM || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    WcosMarketplace: (process.env.NEXT_PUBLIC_WCOS_MARKETPLACE_ADDRESS_OPTIMISM || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    WcosStaking: (process.env.NEXT_PUBLIC_WCOS_STAKING_ADDRESS_OPTIMISM || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    WcosGovernanceToken: (process.env.NEXT_PUBLIC_WCOS_GOVERNANCE_TOKEN_ADDRESS_OPTIMISM || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    WcosGovernor: (process.env.NEXT_PUBLIC_WCOS_GOVERNOR_ADDRESS_OPTIMISM || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    WcosTreasury: (process.env.NEXT_PUBLIC_WCOS_TREASURY_ADDRESS_OPTIMISM || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    WcosSwapRouter: (process.env.NEXT_PUBLIC_WCOS_SWAP_ROUTER_ADDRESS_OPTIMISM || "0xE592427A0AEce92De3Edee1F18E0157C05861564") as `0x${string}`,
  },
};

export const getContractAddresses = (chainId?: number) => {
  const activeChainId = chainId || baseSepolia.id;
  const addresses = MULTI_CHAIN_CONTRACT_ADDRESSES[activeChainId];
  if (!addresses) {
    return MULTI_CHAIN_CONTRACT_ADDRESSES[baseSepolia.id];
  }
  return addresses;
};

export function useContractAddresses() {
  const chainId = useChainId();
  return getContractAddresses(chainId);
}

export const CONTRACT_ADDRESSES = new Proxy(
  {},
  {
    get(_, prop) {
      const addresses = getContractAddresses(
        typeof window !== "undefined" && (window as any).__WAGMI_ACTIVE_CHAIN_ID__
          ? (window as any).__WAGMI_ACTIVE_CHAIN_ID__
          : baseSepolia.id
      );
      return addresses[prop as keyof typeof addresses];
    },
  }
) as unknown as typeof MULTI_CHAIN_CONTRACT_ADDRESSES[typeof baseSepolia.id];

/** Returns true when the given address is a placeholder zero address */
export const isPlaceholderAddress = (addr: string) =>
  addr === "0x0000000000000000000000000000000000000000";

export const getExplorerTxUrl = (chainId: number, txHash: string): string => {
  const baseUrls: Record<number, string> = {
    84532: "https://sepolia.basescan.org",
    8453: "https://basescan.org",
    1: "https://etherscan.io",
    137: "https://polygonscan.com",
    42161: "https://arbiscan.io",
    10: "https://optimistic.etherscan.io",
  };
  const baseUrl = baseUrls[chainId] || "https://etherscan.io";
  return `${baseUrl}/tx/${txHash}`;
};

export const isContractConfigured = (
  chainId: number,
  contractKey: keyof typeof MULTI_CHAIN_CONTRACT_ADDRESSES[typeof baseSepolia.id]
): boolean => {
  const addresses = MULTI_CHAIN_CONTRACT_ADDRESSES[chainId];
  if (!addresses) return false;
  const addr = addresses[contractKey];
  return addr !== undefined && !isPlaceholderAddress(addr);
};

// ─── AINFTMinter ABI ──────────────────────────────────────────────────────────

export const AINFTMinterABI = [
  {
    type: "function",
    name: "mintNFT",
    stateMutability: "payable",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "tokenURI", type: "string" },
    ],
    outputs: [{ name: "tokenId", type: "uint256" }],
  },
  {
    type: "function",
    name: "mintAINFT",
    stateMutability: "payable",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "_tokenURI", type: "string" },
      { name: "tier", type: "uint8" },
      { name: "_contentHash", type: "bytes32" }
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "mintFee",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
  // ERC-721 approve — required before marketplace listing
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

// ─── WcosMarketplace ABI ──────────────────────────────────────────────────────

export const WcosMarketplaceABI = [
  {
    type: "function",
    name: "listToken",
    stateMutability: "nonpayable",
    inputs: [
      { name: "nftAddress", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "price", type: "uint256" },
    ],
    outputs: [{ name: "listingId", type: "uint256" }],
  },
  {
    type: "function",
    name: "buyToken",
    stateMutability: "payable",
    inputs: [
      { name: "listingId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "cancelListing",
    stateMutability: "nonpayable",
    inputs: [
      { name: "listingId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "pause",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "unpause",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "setFeeBps",
    stateMutability: "nonpayable",
    inputs: [{ name: "_feeBps", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "setFeeRecipient",
    stateMutability: "nonpayable",
    inputs: [{ name: "_feeRecipient", type: "address" }],
    outputs: [],
  },
  {
    type: "function",
    name: "feeBps",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "feeRecipient",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "event",
    name: "TokenListed",
    inputs: [
      { indexed: true, name: "listingId", type: "uint256" },
      { indexed: true, name: "nftAddress", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: false, name: "seller", type: "address" },
      { indexed: false, name: "price", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "TokenBought",
    inputs: [
      { indexed: true, name: "listingId", type: "uint256" },
      { indexed: true, name: "nftAddress", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: false, name: "buyer", type: "address" },
      { indexed: false, name: "seller", type: "address" },
      { indexed: false, name: "price", type: "uint256" },
      { indexed: false, name: "royaltyPaid", type: "uint256" },
      { indexed: false, name: "feePaid", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "TokenListingCancelled",
    inputs: [
      { indexed: true, name: "listingId", type: "uint256" },
      { indexed: true, name: "nftAddress", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: false, name: "seller", type: "address" },
    ],
  },
] as const;

// ─── WcosStaking ABI ──────────────────────────────────────────────────────────

export const WcosStakingABI = [
  {
    type: "function",
    name: "stake",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "stake",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "lockDuration", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "claimRewards",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "emergencyWithdraw",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "balances",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "earned",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "unlockTimes",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "lockDurations",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "stakeTimes",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export const ERC20ApproveABI = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// ─── WcosGovernanceToken ABI ──────────────────────────────────────────────────

export const WcosGovernanceTokenABI = [
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "totalSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "delegates",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "numCheckpoints",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint32" }],
  },
  {
    type: "function",
    name: "getPastVotes",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" },
      { name: "blockNumber", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "delegate",
    stateMutability: "nonpayable",
    inputs: [{ name: "delegatee", type: "address" }],
    outputs: [],
  },
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "event",
    name: "DelegateChanged",
    inputs: [
      { indexed: true, name: "delegator", type: "address" },
      { indexed: true, name: "fromDelegate", type: "address" },
      { indexed: true, name: "toDelegate", type: "address" },
    ],
  },
  {
    type: "event",
    name: "DelegateVotesChanged",
    inputs: [
      { indexed: true, name: "delegate", type: "address" },
      { indexed: false, name: "previousBalance", type: "uint256" },
      { indexed: false, name: "newBalance", type: "uint256" },
    ],
  },
] as const;

// ─── WcosGovernor ABI ─────────────────────────────────────────────────────────

export const WcosGovernorABI = [
  {
    type: "function",
    name: "token",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "proposalCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "quorumPercentage",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "votingDurationBlocks",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "proposals",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "proposer", type: "address" },
      { name: "target", type: "address" },
      { name: "value", type: "uint256" },
      { name: "data", type: "bytes" },
      { name: "description", type: "string" },
      { name: "startBlock", type: "uint256" },
      { name: "endBlock", type: "uint256" },
      { name: "forVotes", type: "uint256" },
      { name: "againstVotes", type: "uint256" },
      { name: "executed", type: "bool" },
      { name: "canceled", type: "bool" },
      { name: "queued", type: "bool" },
      { name: "eta", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "hasVoted",
    stateMutability: "view",
    inputs: [
      { name: "", type: "uint256" },
      { name: "", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "state",
    stateMutability: "view",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "proposalVotes",
    stateMutability: "view",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [
      { name: "forVotes", type: "uint256" },
      { name: "againstVotes", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "proposalProposer",
    stateMutability: "view",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "propose",
    stateMutability: "nonpayable",
    inputs: [
      { name: "target", type: "address" },
      { name: "value", type: "uint256" },
      { name: "data", type: "bytes" },
      { name: "description", type: "string" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "castVote",
    stateMutability: "nonpayable",
    inputs: [
      { name: "proposalId", type: "uint256" },
      { name: "support", type: "bool" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "execute",
    stateMutability: "payable",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "cancel",
    stateMutability: "nonpayable",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "queue",
    stateMutability: "nonpayable",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "event",
    name: "ProposalCreated",
    inputs: [
      { indexed: true, name: "proposalId", type: "uint256" },
      { indexed: true, name: "proposer", type: "address" },
      { indexed: false, name: "target", type: "address" },
      { indexed: false, name: "value", type: "uint256" },
      { indexed: false, name: "description", type: "string" },
      { indexed: false, name: "startBlock", type: "uint256" },
      { indexed: false, name: "endBlock", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "VoteCast",
    inputs: [
      { indexed: true, name: "voter", type: "address" },
      { indexed: true, name: "proposalId", type: "uint256" },
      { indexed: false, name: "support", type: "bool" },
      { indexed: false, name: "weight", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "ProposalQueued",
    inputs: [
      { indexed: true, name: "proposalId", type: "uint256" },
      { indexed: false, name: "eta", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "ProposalExecuted",
    inputs: [{ indexed: true, name: "proposalId", type: "uint256" }],
  },
  {
    type: "event",
    name: "ProposalCanceled",
    inputs: [{ indexed: true, name: "proposalId", type: "uint256" }],
  },
] as const;

// ─── WcosTreasury ABI ─────────────────────────────────────────────────────────

export const WcosTreasuryABI = [
  {
    type: "function",
    name: "governor",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "setGovernor",
    stateMutability: "nonpayable",
    inputs: [{ name: "_newGovernor", type: "address" }],
    outputs: [],
  },
  {
    type: "function",
    name: "executeRelease",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "executeTokenRelease",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "event",
    name: "FundsReleased",
    inputs: [
      { indexed: true, name: "recipient", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "TokenReleased",
    inputs: [
      { indexed: true, name: "token", type: "address" },
      { indexed: true, name: "recipient", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "GovernorUpdated",
    inputs: [
      { indexed: true, name: "previousGovernor", type: "address" },
      { indexed: true, name: "newGovernor", type: "address" },
    ],
  },
] as const;

