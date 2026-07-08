"use client";

import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { baseSepolia, base, mainnet, polygon, arbitrum, optimism } from "wagmi/chains";

export const SUPPORTED_CHAINS = {
  [baseSepolia.id]: { name: "Base Sepolia", chainId: baseSepolia.id, testnet: true },
  [base.id]: { name: "Base Mainnet", chainId: base.id, testnet: false },
  [mainnet.id]: { name: "Ethereum Mainnet", chainId: mainnet.id, testnet: false },
  [polygon.id]: { name: "Polygon", chainId: polygon.id, testnet: false },
  [arbitrum.id]: { name: "Arbitrum One", chainId: arbitrum.id, testnet: false },
  [optimism.id]: { name: "OP Mainnet", chainId: optimism.id, testnet: false },
} as const;

export type SupportedChainId = keyof typeof SUPPORTED_CHAINS;

/**
 * Returns chain validation state and a switch helper.
 * @param requiredChainId – the specific chain ID required for the operation (defaults to Base Sepolia).
 */
export function useChainGuard(requiredChainId: number = baseSepolia.id) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching, error: switchError } = useSwitchChain();

  const isCorrectChain = isConnected && chainId === requiredChainId;
  const requiredChainName =
    SUPPORTED_CHAINS[requiredChainId as SupportedChainId]?.name ?? `Chain #${requiredChainId}`;
  const currentChainName =
    SUPPORTED_CHAINS[chainId as SupportedChainId]?.name ?? `Chain #${chainId}`;

  const switchToRequired = () => {
    switchChain({ chainId: requiredChainId });
  };

  /**
   * Returns a human-readable error string for common wagmi/viem errors.
   */
  const parseError = (err: Error | null | undefined): string | null => {
    if (!err) return null;
    const msg = err.message ?? "";
    if (msg.includes("User rejected") || msg.includes("user rejected"))
      return "Transaction cancelled in wallet.";
    if (msg.includes("insufficient funds") || msg.includes("InsufficientFunds"))
      return "Insufficient ETH for gas fees.";
    if (msg.includes("not deployed") || msg.includes("execution reverted"))
      return "Contract not found or reverted on this network.";
    if (msg.includes("nonce too low") || msg.includes("replacement fee too low"))
      return "Transaction nonce conflict — please retry.";
    return msg.length > 120 ? msg.slice(0, 120) + "…" : msg;
  };

  return {
    isConnected,
    isCorrectChain,
    isSwitching,
    switchError,
    switchToRequired,
    requiredChainName,
    currentChainName,
    chainId,
    parseError,
  };
}
