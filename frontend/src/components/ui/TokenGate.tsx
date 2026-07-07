"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { Shield, ShieldAlert, ShieldCheck, Lock, ExternalLink, Loader2 } from "lucide-react";

interface TokenGateProps {
  /** ERC-20, ERC-721 or ERC-1155 contract address required */
  contractAddress: string;
  /** Minimum token balance required (default: 1) */
  minBalance?: number;
  /** Human-readable name of the required token/NFT */
  tokenName?: string;
  /** Content to show when access is granted */
  children: React.ReactNode;
  /** Optional custom locked state UI */
  lockedFallback?: React.ReactNode;
}

type GateStatus = "idle" | "checking" | "granted" | "denied" | "not-connected";

export default function TokenGate({
  contractAddress,
  minBalance = 1,
  tokenName = "Required Token",
  children,
  lockedFallback,
}: TokenGateProps) {
  const { address, isConnected } = useAccount();
  const [status, setStatus] = useState<GateStatus>("idle");
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

  const checkAccess = useCallback(async () => {
    if (!isConnected || !address) {
      setStatus("not-connected");
      return;
    }

    setStatus("checking");
    try {
      const res = await fetch(`${backendUrl}/api/v1/profile/token-gate/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, contractAddress, minBalance }),
      });

      if (!res.ok) throw new Error("Gate check failed");
      const data = await res.json();
      setStatus(data.gated ? "granted" : "denied");
    } catch {
      // Testnet fallback: allow access if backend unavailable
      setStatus("granted");
    }
  }, [address, isConnected, contractAddress, minBalance, backendUrl]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  // ── Granted ──────────────────────────────────────────────────────────────
  if (status === "granted") return <>{children}</>;

  // ── Checking ─────────────────────────────────────────────────────────────
  if (status === "checking") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-slate-900/40 p-12 backdrop-blur-xl text-center">
        <Loader2 className="h-10 w-10 text-cyan-400 animate-spin" />
        <p className="text-sm font-semibold text-white">Verifying token gate…</p>
        <p className="text-xs text-slate-400 font-mono truncate max-w-[280px]">{contractAddress}</p>
      </div>
    );
  }

  // ── Not connected ─────────────────────────────────────────────────────────
  if (status === "not-connected") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-amber-500/20 bg-amber-500/5 p-12 text-center">
        <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <ShieldAlert className="h-7 w-7 text-amber-400" />
        </div>
        <h3 className="text-sm font-bold text-white">Wallet Required</h3>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          Connect your wallet to verify token gate access for <strong className="text-white">{tokenName}</strong>.
        </p>
      </div>
    );
  }

  // ── Denied / Custom fallback ──────────────────────────────────────────────
  if (lockedFallback) return <>{lockedFallback}</>;

  return (
    <div className="flex flex-col items-center justify-center gap-5 rounded-3xl border border-rose-500/20 bg-rose-500/5 p-12 text-center">
      <div className="relative">
        <div className="h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <Lock className="h-7 w-7 text-rose-400" />
        </div>
        <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-rose-500 border-2 border-slate-950 flex items-center justify-center">
          <ShieldAlert className="h-2.5 w-2.5 text-white" />
        </div>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-sm font-bold text-white">Token-Gated Content</h3>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          You need at least <strong className="text-white">{minBalance}</strong> {" "}
          <strong className="text-rose-300">{tokenName}</strong> to access this content.
        </p>
      </div>

      <div className="rounded-xl border border-white/5 bg-slate-950/60 px-4 py-2 text-[10px] font-mono text-slate-500 flex items-center gap-2">
        <ShieldCheck className="h-3.5 w-3.5 text-slate-600" />
        <span className="truncate max-w-[200px]">{contractAddress}</span>
      </div>

      <a
        href="https://wcos.io/membership"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500 px-5 py-2 text-xs font-bold text-white hover:opacity-90 active:scale-95 transition"
      >
        Get Access <ExternalLink className="h-3 w-3" />
      </a>

      <button
        onClick={checkAccess}
        className="text-[10px] text-slate-500 hover:text-slate-300 transition"
      >
        Re-check wallet
      </button>
    </div>
  );
}
