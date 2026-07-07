import { walletConfigStatus } from "../config/walletConfig";
import { supportedChains } from "../config/chains";
import { getTransports } from "../config/transports";

export interface WalletHealthReport {
  isHealthy: boolean;
  status: typeof walletConfigStatus;
  rpcEndpoints: Record<number, string>;
  chains: number[];
}

export const checkWalletHealth = (): WalletHealthReport => {
  const rpcEndpoints: Record<number, string> = {};

  supportedChains.forEach((chain) => {
    const transportUrl =
      chain.id === 84532
        ? process.env.NEXT_PUBLIC_RPC_URL ||
          process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL ||
          "https://sepolia.base.org"
        : process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org";
    rpcEndpoints[chain.id] = transportUrl;
  });

  const isHealthy = walletConfigStatus.isValid;

  // Print friendly developer console summary in non-production environments
  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    console.log(
      `%c WCOS Web3 System Health Status `,
      "background: #1e1b4b; color: #a5b4fc; font-weight: bold; padding: 4px;"
    );
    console.log(`- Project ID Validated: ${walletConfigStatus.isValid ? "✅" : "⚠️"}`);
    if (!walletConfigStatus.isValid) {
      console.warn(`[Web3 Warning] Reason: ${walletConfigStatus.reason}`);
      console.warn(`[Web3 Action Required] ${walletConfigStatus.suggestedAction}`);
      console.info("[Web3 Fallback] WalletConnect is disabled. Injected wallets (MetaMask, Coinbase Wallet) remain operational.");
    } else {
      console.log(`- Project ID: ${walletConfigStatus.projectId?.substring(0, 6)}...`);
    }
    console.log(`- Chains Configured: ${supportedChains.map((c) => c.name).join(", ")}`);
    console.log("-----------------------------------------");
  }

  return {
    isHealthy,
    status: walletConfigStatus,
    rpcEndpoints,
    chains: supportedChains.map((c) => c.id),
  };
};

export default checkWalletHealth;
