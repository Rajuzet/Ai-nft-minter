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
