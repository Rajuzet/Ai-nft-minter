"use client";

import React, { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet, AlertTriangle, ShieldCheck } from "lucide-react";

interface SafeWalletButtonProps {
  showBalance?: boolean;
  chainStatus?: "icon" | "name" | "full" | "none";
  accountStatus?: "avatar" | "address" | "full";
  className?: string;
}

export function SafeWalletButton({
  showBalance = false,
  chainStatus = "icon",
  accountStatus = "full",
  className = "",
}: SafeWalletButtonProps) {
  const [mounted, setMounted] = useState(false);
  const [hasProjectId, setHasProjectId] = useState(true);

  useEffect(() => {
    setMounted(true);
    const projectId =
      process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ||
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
      process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;

    // Check if project ID is explicitly set
    if (!projectId && process.env.NODE_ENV === "development") {
      setHasProjectId(true); // Allow fallback dev ID
    }
  }, []);

  if (!mounted) {
    return (
      <div className="h-9 w-32 bg-slate-900 border border-white/10 rounded-full animate-pulse flex items-center justify-center text-[10px] text-slate-500 font-mono">
        Loading Wallet…
      </div>
    );
  }

  if (!hasProjectId) {
    return (
      <button
        onClick={() =>
          alert(
            "Wallet connection is not configured. Please add NEXT_PUBLIC_REOWN_PROJECT_ID in your frontend/.env.local file."
          )
        }
        className="rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold text-xs px-3.5 py-1.5 flex items-center gap-1.5 hover:bg-amber-500/20 transition"
      >
        <AlertTriangle className="h-3.5 w-3.5" /> Configure Wallet ID
      </button>
    );
  }

  return (
    <div className={className}>
      <ConnectButton
        showBalance={showBalance}
        chainStatus={chainStatus}
        accountStatus={accountStatus}
      />
    </div>
  );
}
