"use client";

import React from "react";
import WalletProvider from "@/lib/web3/providers/WalletProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>;
}
export { REOWN_PROJECT_ID } from "@/lib/web3/config/walletConfig";
export { wagmiConfig as config } from "@/lib/web3/config/walletConfig";
