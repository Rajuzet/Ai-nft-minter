import { base, baseSepolia } from "wagmi/chains";

export const supportedChains = [baseSepolia, base] as const;

export type SupportedChainId = typeof supportedChains[number]["id"];

export const DEFAULT_CHAIN = baseSepolia;
