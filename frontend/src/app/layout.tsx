"use client";

import React from "react";
import { WagmiConfig, createConfig, configureChains } from "wagmi";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import { publicProvider } from "wagmi/providers/public";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { base, baseSepolia } from "wagmi/chains";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";

const chains = [base, baseSepolia];

const { publicClient, webSocketPublicClient } = configureChains(chains, [
  jsonRpcProvider({
    rpc: (chain) => {
      if (chain.id === base.id) return { http: process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org" };
      if (chain.id === baseSepolia.id) return { http: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org" };
      return null;
    }
  }),
  publicProvider()
]);

const { connectors } = getDefaultWallets({
  appName: "AI Studio Collective",
  chains
});

const queryClient = new QueryClient();
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          <WagmiConfig config={wagmiConfig}>
            <RainbowKitProvider chains={chains} modalSize="compact">
              {children}
            </RainbowKitProvider>
          </WagmiConfig>
        </QueryClientProvider>
      </body>
    </html>
  );
}
