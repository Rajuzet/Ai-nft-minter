import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
  rainbowWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig } from "wagmi";
import { supportedChains } from "./chains";
import { getTransports } from "./transports";
import { validateWalletConfig } from "../validators/walletValidator";

// Validate environment parameters
export const walletConfigStatus = validateWalletConfig();

// Group wallets logically. Exclude WalletConnect dependencies if invalid to prevent allowlist errors.
const walletGroups = [
  {
    groupName: "Available Wallets",
    wallets: [
      injectedWallet,
      metaMaskWallet,
      coinbaseWallet,
      ...(walletConfigStatus.isValid
        ? [walletConnectWallet, rainbowWallet]
        : []),
    ],
  },
];

// Resolve project ID for RainbowKit configuration block
export const REOWN_PROJECT_ID = walletConfigStatus.projectId || "627e2bcf40428d0954b87e2213e4b77f";

const connectors = connectorsForWallets(walletGroups, {
  appName: process.env.NEXT_PUBLIC_APP_NAME || "WCOS Creator Console",
  projectId: REOWN_PROJECT_ID,
});

export const wagmiConfig = createConfig({
  connectors,
  chains: supportedChains,
  transports: getTransports(),
  ssr: true, // Enable SSR support for Wagmi/RainbowKit
});

export default wagmiConfig;
