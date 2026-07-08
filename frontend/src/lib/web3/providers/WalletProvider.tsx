"use client";

import React, { useState, useEffect } from "react";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig, walletConfigStatus } from "../config/walletConfig";
import { checkWalletHealth } from "../utils/checkWalletHealth";
import { ToastProvider } from "@/components/ui/Toast";
import { AlertTriangle, X } from "lucide-react";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: false,
          },
        },
      })
  );

  useEffect(() => {
    setMounted(true);
    checkWalletHealth();

    // If configuration is invalid (missing/fallback), show a developer banner in local development
    if (!walletConfigStatus.isValid && process.env.NODE_ENV === "development") {
      setShowWarning(true);
    }

    // Intercept and swallow non-fatal Reown/WalletConnect subscription warning logs
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      if (
        typeof args[0] === "string" &&
        (args[0].includes("Connection interrupted while trying to subscribe") ||
          args[0].includes("_sendAnalyticsEvent") ||
          args[0].includes("WebSocket connection to"))
      ) {
        return;
      }
      originalConsoleError.apply(console, args);
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <RainbowKitProvider modalSize="compact">
          <ToastProvider>
            {showWarning && (
              <div className="bg-amber-950/80 border-b border-amber-500/30 text-amber-200 px-4 py-3 text-xs flex items-center justify-between gap-3 backdrop-blur-sm z-50 relative">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-bold text-amber-300">Web3 Wallet Configuration Warning: </span>
                    {walletConfigStatus.reason}{" "}
                    <span className="underline font-semibold">{walletConfigStatus.suggestedAction}</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowWarning(false)}
                  className="text-amber-400 hover:text-amber-200 transition shrink-0"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            {children}
          </ToastProvider>
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}

export default WalletProvider;
