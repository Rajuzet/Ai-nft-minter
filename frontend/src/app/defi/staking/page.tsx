"use client";

import React, { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import {
  Coins, Wallet, Compass, Users, Layers, Sparkles, FileText, ShoppingBag, 
  ChevronRight, Activity, Cpu, RefreshCw, CheckCircle2, X, AlertTriangle, 
  HelpCircle, Percent
} from "lucide-react";

export default function DefiStakingPage() {
  const { address, isConnected } = useAccount();
  const [activeModule] = useState("staking");
  const [selectedChain, setSelectedChain] = useState("base-sepolia");

  const [stakeAmount, setStakeAmount] = useState("100");
  const [lockDuration, setLockDuration] = useState("90"); // days
  
  const [stakedBalance, setStakedBalance] = useState("0");
  const [accruedRewards, setAccruedRewards] = useState("0");

  const [isStaking, setIsStaking] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [txHash, setTxHash] = useState("");

  const calculateApy = () => {
    if (lockDuration === "30") return 8; // 8% APY
    if (lockDuration === "90") return 12; // 12% APY
    return 18; // 18% APY for 365 days
  };

  const calculateExpectedReturn = () => {
    const amt = parseFloat(stakeAmount) || 0;
    const apy = calculateApy();
    const durationDays = parseInt(lockDuration) || 30;
    return ((amt * (apy / 100) * durationDays) / 365).toFixed(4);
  };

  const handleStakeClick = () => {
    if (!isConnected || parseFloat(stakeAmount) <= 0) return;
    setIsConfirming(true);
  };

  const executeStake = () => {
    setIsConfirming(false);
    setIsStaking(true);
    setTimeout(() => {
      setIsStaking(false);
      setStakedBalance((prev) => (parseFloat(prev) + parseFloat(stakeAmount)).toString());
      setAccruedRewards("0.00");
      setTxHash("0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""));
    }, 2000);
  };

  const handleClaim = () => {
    setIsClaiming(true);
    setTimeout(() => {
      setIsClaiming(false);
      setAccruedRewards("0");
      addTerminalLog("Staking reward claim transaction confirmed on Base Sepolia.");
    }, 1500);
  };

  const addTerminalLog = (log: string) => {
    console.log(log);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Header */}
      <header className="h-16 border-b border-white/10 bg-slate-900/40 backdrop-blur-md px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 p-[2px]">
            <div className="flex h-full w-full items-center justify-center rounded-[8px] bg-slate-950 text-sm font-black text-cyan-400">
              W
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] bg-gradient-to-r from-cyan-400 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent">
                Web3 Creator Operating System
              </span>
            </div>
            <h1 className="text-sm font-bold text-white tracking-tight">WCOS DeFi Center</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-slate-900 border border-white/10 p-1.5 rounded-full text-xs">
            <Globe className="h-3.5 w-3.5 text-indigo-400 ml-1.5" />
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value)}
              className="bg-transparent text-white text-[11px] font-bold outline-none pr-2 cursor-pointer"
            >
              <option value="base-sepolia" className="bg-slate-950">Base Sepolia</option>
              <option value="base-mainnet" className="bg-slate-950">Base Mainnet</option>
            </select>
          </div>
          <ConnectButton showBalance={false} chainStatus="icon" />
        </div>
      </header>

      {/* Workspace Environment */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-64 border-r border-white/5 bg-slate-950 flex flex-col justify-between p-4 space-y-2 flex-shrink-0">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-2 block mb-3">Creator Console</span>
            
            <button
              onClick={() => window.location.href = "/dashboard"}
              className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent transition-all"
            >
              <span className="flex items-center gap-2.5">
                <Cpu className="h-4 w-4" /> Creator Dashboard
              </span>
              <ChevronRight className="h-3 w-3 opacity-60" />
            </button>

            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-2 block pt-4 mb-2">DeFi modules</span>
            
            <button
              onClick={() => window.location.href = "/defi"}
              className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent transition-all"
            >
              <span className="flex items-center gap-2.5">
                <Wallet className="h-4 w-4" /> Portfolio Overview
              </span>
              <ChevronRight className="h-3 w-3 opacity-60" />
            </button>

            <button
              onClick={() => window.location.href = "/defi/swap"}
              className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent transition-all"
            >
              <span className="flex items-center gap-2.5">
                <RefreshCw className="h-4 w-4" /> Swap Assets
              </span>
              <ChevronRight className="h-3 w-3 opacity-60" />
            </button>

            <button
              onClick={() => window.location.href = "/defi/staking"}
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                activeModule === "staking"
                  ? "bg-amber-600/10 text-amber-400 border border-amber-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Layers className="h-4 w-4" /> Staking Center
              </span>
              <ChevronRight className="h-3 w-3 opacity-60" />
            </button>
          </div>
        </aside>

        {/* Central staking builder */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Layers className="h-6 w-6 text-amber-400" /> Staking Center
            </h2>
            <p className="text-slate-400 text-xs mt-1">Stake WCOS governance tokens to secure validation and earn linear yields.</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            
            {/* Stake Input Panel */}
            <div className="space-y-5 rounded-3xl border border-white/5 bg-slate-900/20 p-6">
              
              {/* Risk warning */}
              <div className="rounded-2xl bg-amber-500/5 border border-amber-500/25 p-3.5 text-amber-400 flex items-start gap-2.5 text-xs">
                <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold">Yield Risk warning</p>
                  <p className="text-amber-400/80 mt-0.5">
                    Staked tokens are locked for the selected duration. Early withdrawal penalties apply as per contract rules.
                  </p>
                </div>
              </div>

              {/* Stake token input */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase block">Token Stake Amount (WGT)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-400 font-mono"
                    placeholder="100.0"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-slate-500 font-bold">WGT</span>
                </div>
              </div>

              {/* Lock selector */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Lock duration period</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: "30", label: "30 Days" },
                    { val: "90", label: "90 Days" },
                    { val: "365", label: "1 Year" }
                  ].map((duration) => (
                    <button
                      key={duration.val}
                      onClick={() => setLockDuration(duration.val)}
                      className={`rounded-xl border py-2 px-3 text-xs font-semibold transition ${
                        lockDuration === duration.val
                          ? "border-amber-500 bg-amber-500/10 text-amber-400"
                          : "border-white/5 bg-slate-950 text-slate-400"
                      }`}
                    >
                      {duration.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* APY yield details */}
              <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl text-xs font-mono text-slate-400 space-y-2">
                <div className="flex justify-between">
                  <span>Current Reward rate APY:</span>
                  <span className="text-emerald-400 font-bold">{calculateApy()}% APY</span>
                </div>
                <div className="flex justify-between">
                  <span>Est. Reward yield payout:</span>
                  <span className="text-white font-bold">{calculateExpectedReturn()} WGT</span>
                </div>
              </div>

              <button
                onClick={handleStakeClick}
                disabled={!isConnected}
                className="w-full rounded-full bg-gradient-to-r from-amber-500 to-indigo-600 py-3.5 text-xs font-semibold text-white shadow transition hover:opacity-95 disabled:opacity-50"
              >
                Stake Tokens
              </button>
            </div>

            {/* Earnings Tally Panel */}
            <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white">Staking Account Stats</h3>
                
                <div className="p-4 bg-slate-950/60 border border-white/5 rounded-2xl space-y-4">
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Active Staked Balance</span>
                    <p className="text-xl font-black text-white font-mono">{stakedBalance} WGT</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Accrued rewards balance</span>
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-black text-emerald-400 font-mono">{accruedRewards} WGT</p>
                      {parseFloat(accruedRewards) > 0 && (
                        <button
                          onClick={handleClaim}
                          disabled={isClaiming}
                          className="rounded-full bg-emerald-600 hover:bg-emerald-500 text-[10px] font-bold px-3 py-1 text-white transition disabled:opacity-50"
                        >
                          {isClaiming ? "Claiming..." : "Claim Rewards"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {isStaking && (
                  <div className="p-3 bg-slate-950 border border-amber-500/20 rounded-2xl flex items-center justify-center gap-2 text-xs text-amber-400 font-semibold animate-pulse">
                    <RefreshCw className="h-4 w-4 animate-spin" /> Approving & Staking on-chain...
                  </div>
                )}

                {txHash && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-[11px] font-mono truncate">
                    Staking Tx Confirmed: {txHash}
                  </div>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* Confirmation Modal */}
      {isConfirming && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsConfirming(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold text-white">Confirm Staking Deposit</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Depositing tokens into the staking pool contract. Your tokens will be locked and cannot be withdrawn until the lock period completes.
            </p>
            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-2.5 text-xs font-mono text-slate-300">
              <div className="flex justify-between">
                <span>Staking token:</span>
                <span className="font-bold text-white">WGT</span>
              </div>
              <div className="flex justify-between">
                <span>Staking amount:</span>
                <span className="font-bold text-white">{stakeAmount} WGT</span>
              </div>
              <div className="flex justify-between">
                <span>Lock Duration:</span>
                <span className="text-amber-400 font-bold">{lockDuration} Days</span>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-2.5">
                <span>Staking APY:</span>
                <span className="text-emerald-400 font-bold">{calculateApy()}%</span>
              </div>
            </div>
            <button
              onClick={executeStake}
              className="w-full rounded-full bg-gradient-to-r from-amber-500 to-indigo-600 py-3 text-xs font-semibold text-white transition hover:opacity-95"
            >
              Confirm & Deposit Staking
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
