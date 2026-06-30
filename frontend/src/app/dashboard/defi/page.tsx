"use client";

import React from "react";
import { Coins, AlertCircle } from "lucide-react";

export default function DefiPlaceholderPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-3xl border border-white/10 bg-slate-900/40 p-8 text-center space-y-4 backdrop-blur-xl shadow-2xl">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <Coins className="h-8 w-8" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-white">DeFi Center</h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-950/80 px-3 py-1 text-[10px] font-bold text-amber-400 border border-amber-500/20">
            <AlertCircle className="h-3 w-3" /> Coming Soon in Phase 2
          </span>
        </div>
        <p className="text-xs leading-relaxed text-slate-400">
          Visual token swaps, stablecoin aggregators, yield farming simulators, and liquid staking tools are prepared. Configuration parameters will activate upon Phase 2 rollout.
        </p>
      </div>
    </div>
  );
}
