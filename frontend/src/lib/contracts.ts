// ─── Chain config ─────────────────────────────────────────────────────────────

import { baseSepolia, base } from "wagmi/chains";

/** Chain IDs supported by WCOS on-chain features */
export const SUPPORTED_CHAIN_IDS = [baseSepolia.id, base.id] as const;

/** Primary testnet chain — used for development and default chain guard */
export const PRIMARY_TESTNET_CHAIN_ID = baseSepolia.id;

// ─── Contract addresses ───────────────────────────────────────────────────────

export const CONTRACT_ADDRESSES = {
  AINFTMinter: (process.env.NEXT_PUBLIC_AINFT_MINTER_ADDRESS ||
    "0x498e82d77C29FAf0605a96E3D4F59E9E0C1BEc3A") as `0x${string}`,

  // Marketplace — placeholder until deployed to Base Sepolia. Will revert on-chain.
  WcosMarketplace: (process.env.NEXT_PUBLIC_WCOS_MARKETPLACE_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as `0x${string}`,

  // Staking — placeholder until governance token contract is deployed.
  WcosStaking: (process.env.NEXT_PUBLIC_WCOS_STAKING_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as `0x${string}`,

  // Governance token — placeholder.
  WcosGovernanceToken: (process.env.NEXT_PUBLIC_WCOS_GOVERNANCE_TOKEN_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
} as const;

/** Returns true when the given address is a placeholder zero address */
export const isPlaceholderAddress = (addr: string) =>
  addr === "0x0000000000000000000000000000000000000000";

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
    outputs: [],
  },
  {
    type: "function",
    name: "buyToken",
    stateMutability: "payable",
    inputs: [
      { name: "nftAddress", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "cancelListing",
    stateMutability: "nonpayable",
    inputs: [
      { name: "nftAddress", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [],
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
] as const;

// ─── ERC-20 approve ABI (for staking token approval) ─────────────────────────

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
