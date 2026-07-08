import { base, baseSepolia, mainnet, polygon, arbitrum, optimism } from "wagmi/chains";
import { Chain } from "viem";

export interface WcosChainConfig {
  chain: Chain;
  id: number;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorerUrl: string;
  rpcUrl: string;
  isTestnet: boolean;
  enabled: boolean;
  features: {
    mint: boolean;
    marketplace: boolean;
    staking: boolean;
    dao: boolean;
    swap: boolean;
  };
}

const isProd = process.env.NODE_ENV === "production";

const getRpcAndStatus = (
  envRpc: string | undefined,
  fallbackRpc: string,
  chainName: string
): { rpc: string; enabled: boolean } => {
  if (envRpc) {
    return { rpc: envRpc, enabled: true };
  }
  if (isProd) {
    if (typeof window !== "undefined") {
      console.warn(`[WCOS Chain Config] Production RPC URL missing for ${chainName}. Disabling chain.`);
    }
    return { rpc: "", enabled: false };
  } else {
    if (typeof window !== "undefined") {
      console.warn(`[WCOS Chain Config] Dev mode: Using public fallback RPC for ${chainName}.`);
    }
    return { rpc: fallbackRpc, enabled: true };
  }
};

const baseSepoliaConfig = getRpcAndStatus(
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL,
  "https://sepolia.base.org",
  "Base Sepolia"
);

const baseMainnetConfig = getRpcAndStatus(
  process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL,
  "https://mainnet.base.org",
  "Base Mainnet"
);

const ethereumConfig = getRpcAndStatus(
  process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL,
  "https://eth.llamarpc.com",
  "Ethereum Mainnet"
);

const polygonConfig = getRpcAndStatus(
  process.env.NEXT_PUBLIC_POLYGON_RPC_URL,
  "https://polygon.llamarpc.com",
  "Polygon"
);

const arbitrumConfig = getRpcAndStatus(
  process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL,
  "https://arbitrum.llamarpc.com",
  "Arbitrum"
);

const optimismConfig = getRpcAndStatus(
  process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL,
  "https://optimism.llamarpc.com",
  "Optimism"
);

export const WCOS_CHAINS: Record<number, WcosChainConfig> = {
  [baseSepolia.id]: {
    chain: baseSepolia,
    id: baseSepolia.id,
    name: "Base Sepolia",
    nativeCurrency: baseSepolia.nativeCurrency,
    blockExplorerUrl: baseSepolia.blockExplorers.default.url,
    rpcUrl: baseSepoliaConfig.rpc,
    isTestnet: true,
    enabled: baseSepoliaConfig.enabled,
    features: {
      mint: true,
      marketplace: true,
      staking: true,
      dao: true,
      swap: true,
    },
  },
  [base.id]: {
    chain: base,
    id: base.id,
    name: "Base Mainnet",
    nativeCurrency: base.nativeCurrency,
    blockExplorerUrl: base.blockExplorers.default.url,
    rpcUrl: baseMainnetConfig.rpc,
    isTestnet: false,
    enabled: baseMainnetConfig.enabled,
    features: {
      mint: false,
      marketplace: false,
      staking: false,
      dao: false,
      swap: false,
    },
  },
  [mainnet.id]: {
    chain: mainnet,
    id: mainnet.id,
    name: "Ethereum Mainnet",
    nativeCurrency: mainnet.nativeCurrency,
    blockExplorerUrl: mainnet.blockExplorers.default.url,
    rpcUrl: ethereumConfig.rpc,
    isTestnet: false,
    enabled: ethereumConfig.enabled,
    features: {
      mint: false,
      marketplace: false,
      staking: false,
      dao: false,
      swap: false,
    },
  },
  [polygon.id]: {
    chain: polygon,
    id: polygon.id,
    name: "Polygon",
    nativeCurrency: polygon.nativeCurrency,
    blockExplorerUrl: polygon.blockExplorers.default.url,
    rpcUrl: polygonConfig.rpc,
    isTestnet: false,
    enabled: polygonConfig.enabled,
    features: {
      mint: false,
      marketplace: false,
      staking: false,
      dao: false,
      swap: false,
    },
  },
  [arbitrum.id]: {
    chain: arbitrum,
    id: arbitrum.id,
    name: "Arbitrum One",
    nativeCurrency: arbitrum.nativeCurrency,
    blockExplorerUrl: arbitrum.blockExplorers.default.url,
    rpcUrl: arbitrumConfig.rpc,
    isTestnet: false,
    enabled: arbitrumConfig.enabled,
    features: {
      mint: false,
      marketplace: false,
      staking: false,
      dao: false,
      swap: false,
    },
  },
  [optimism.id]: {
    chain: optimism,
    id: optimism.id,
    name: "OP Mainnet",
    nativeCurrency: optimism.nativeCurrency,
    blockExplorerUrl: optimism.blockExplorers.default.url,
    rpcUrl: optimismConfig.rpc,
    isTestnet: false,
    enabled: optimismConfig.enabled,
    features: {
      mint: false,
      marketplace: false,
      staking: false,
      dao: false,
      swap: false,
    },
  },
};

export const supportedChains = Object.values(WCOS_CHAINS)
  .filter((c) => c.enabled)
  .map((c) => c.chain) as unknown as [Chain, ...Chain[]];

export type SupportedChainId = typeof supportedChains[number]["id"];

const defaultChainId = Number(
  process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID || baseSepolia.id
);

export const DEFAULT_CHAIN =
  Object.values(WCOS_CHAINS).find((c) => c.id === defaultChainId && c.enabled)?.chain || baseSepolia;
