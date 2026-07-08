"use client";

import React, { useEffect, useState } from "react";
import { useWalletStatus, useCurrentChain, useSwitchChain } from "../../lib/useWallet";
import { SafeWalletButton } from "./SafeWalletButton";
import { Wallet, AlertTriangle, RefreshCw } from "lucide-react";
import { DEFAULT_CHAIN } from "../../lib/web3/config/chains";

interface WalletGuardProps {
  children: React.ReactNode;
  requiredFeature?: string;
}

const featureKeyMap: Record<string, "mint" | "marketplace" | "staking" | "dao" | "swap"> = {
  "NFT Minting": "mint",
  "NFT Marketplace": "marketplace",
  "DAO Governance": "dao",
  "DeFi Staking": "staking",
  "Swap Center": "swap",
};

export function WalletGuard({ children, requiredFeature }: WalletGuardProps) {
  const { isConnected, isSupportedChain } = useWalletStatus();
  const currentChain = useCurrentChain();
  const { switchChain, isSwitching } = useSwitchChain();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-500">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 rounded-3xl border border-white/5 bg-slate-900/30 p-12 backdrop-blur-md text-center max-w-lg mx-auto my-8">
        <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/5">
          <Wallet className="h-8 w-8 text-indigo-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white tracking-tight">Connect Your Wallet</h3>
          <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
            You need to connect a Web3 wallet to access <span className="text-indigo-400 font-semibold">{requiredFeature || "this module"}</span>.
          </p>
        </div>
        <SafeWalletButton showBalance={false} />
      </div>
    );
  }

  if (!isSupportedChain) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 rounded-3xl border border-rose-500/10 bg-rose-500/5 p-12 backdrop-blur-md text-center max-w-lg mx-auto my-8">
        <div className="h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-lg shadow-rose-500/5 animate-pulse">
          <AlertTriangle className="h-8 w-8 text-rose-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white tracking-tight">Unsupported Network</h3>
          <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
            Your wallet is connected to an unsupported network. Please switch to a supported chain to access <span className="text-rose-400 font-semibold">{requiredFeature || "this module"}</span>.
          </p>
        </div>
        <button
          onClick={() => switchChain(DEFAULT_CHAIN.id)}
          disabled={isSwitching}
          className="rounded-full bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 text-white font-semibold text-xs px-5 py-2.5 flex items-center gap-2 transition active:scale-95 shadow-lg shadow-rose-600/20"
        >
          {isSwitching ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Switching...
            </>
          ) : (
            <>Switch Network</>
          )}
        </button>
      </div>
    );
  }

  // Validate if the required feature is enabled on the current chain
  const featureKey = requiredFeature ? featureKeyMap[requiredFeature] : undefined;
  const isFeatureSupported = featureKey && currentChain.config ? currentChain.config.features[featureKey] : true;

  if (!isFeatureSupported && currentChain.config) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 rounded-3xl border border-amber-500/10 bg-amber-500/5 p-12 backdrop-blur-md text-center max-w-lg mx-auto my-8">
        <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-lg shadow-amber-500/5">
          <AlertTriangle className="h-8 w-8 text-amber-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white tracking-tight">Feature Unavailable</h3>
          <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
            <span className="text-amber-400 font-semibold">{requiredFeature || "This feature"}</span> is not supported on <span className="text-white font-semibold">{currentChain.config.name}</span>.
          </p>
        </div>
        <button
          onClick={() => switchChain(DEFAULT_CHAIN.id)}
          disabled={isSwitching}
          className="rounded-full bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 text-white font-semibold text-xs px-5 py-2.5 flex items-center gap-2 transition active:scale-95 shadow-lg shadow-amber-600/20"
        >
          {isSwitching ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Switching...
            </>
          ) : (
            <>Switch to Base Sepolia</>
          )}
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

export default WalletGuard;
