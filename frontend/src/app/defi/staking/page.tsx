"use client";

import React, { useState, useEffect } from "react";
import { SafeWalletButton } from "../../../components/ui/SafeWalletButton";
import { WalletGuard } from "../../../components/ui/WalletGuard";
import { ChainSelector } from "../../../components/ui/ChainSelector";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import {
  Coins, Wallet, Compass, Users, Layers, Sparkles, FileText, ShoppingBag, 
  ChevronRight, Activity, Cpu, RefreshCw, CheckCircle2, X, AlertTriangle, 
  HelpCircle, Percent, Globe, Info
} from "lucide-react";
import { useChainGuard } from "../../../lib/useChainGuard";
import { useWeb3Transaction, getTxStatusLabel, parseContractError } from "../../../lib/useWeb3Transaction";
import { CONTRACT_ADDRESSES, WcosStakingABI, isPlaceholderAddress, useContractAddresses, getExplorerTxUrl } from "../../../lib/contracts";
import { parseUnits } from "viem";
import { baseSepolia } from "wagmi/chains";

export default function DefiStakingPage() {
  const { address, isConnected } = useAccount();
  const contractAddresses = useContractAddresses();
  const [activeModule] = useState("staking");
  const [selectedChain, setSelectedChain] = useState("base-sepolia");

  // Chain mapping helpers
  const chainMap = React.useMemo(() => ({
    "base-sepolia": 84532,
    "base-mainnet": 8453,
    "ethereum": 1,
    "polygon": 137,
    "arbitrum": 42161,
    "optimism": 10,
  } as Record<string, number>), []);

  const chainIdToKey = React.useCallback((id: number): string => {
    return Object.keys(chainMap).find((key) => chainMap[key] === id) || "base-sepolia";
  }, [chainMap]);

  const activeChainId = chainMap[selectedChain] || 84532;
  const chainGuard = useChainGuard(activeChainId);
  const walletChainId = useChainId();
  const { switchChain } = useSwitchChain();

  // Sync dropdown with active wallet chain
  useEffect(() => {
    if (isConnected && walletChainId) {
      const isSupported = Object.values(chainMap).includes(walletChainId);
      if (isSupported) {
        const key = chainIdToKey(walletChainId);
        if (selectedChain !== key) {
          setSelectedChain(key);
        }
      }
    }
  }, [walletChainId, isConnected, chainMap, chainIdToKey, selectedChain]);

  // Handle dropdown change and switch wallet network
  const handleChainChange = (val: string) => {
    setSelectedChain(val);
    const targetId = chainMap[val];
    if (isConnected && targetId && switchChain) {
      switchChain({ chainId: targetId });
    }
  };

  const [stakeAmount, setStakeAmount] = useState("100");
  const [lockDuration, setLockDuration] = useState("90");
  const [stakedBalance, setStakedBalance] = useState("0");
  const [accruedRewards, setAccruedRewards] = useState("0");
  const [isConfirming, setIsConfirming] = useState(false);

  // ── Real wagmi transactions ────────────────────────────────────────────────
  const stakeTx = useWeb3Transaction({
    onSuccess: (txHash) => {
      setStakedBalance((prev) => (parseFloat(prev) + parseFloat(stakeAmount)).toFixed(4));
      setAccruedRewards("0.00");
    },
    onError: (err) => console.error("Stake failed:", err),
  });

  const claimTx = useWeb3Transaction({
    onSuccess: (txHash) => { setAccruedRewards("0"); },
    onError: (err) => console.error("Claim failed:", err),
  });

  const calculateApy = () => {
    if (lockDuration === "30") return 8;
    if (lockDuration === "90") return 12;
    return 18;
  };

  const calculateExpectedReturn = () => {
    const amt = parseFloat(stakeAmount) || 0;
    const apy = calculateApy();
    const durationDays = parseInt(lockDuration) || 30;
    return ((amt * (apy / 100) * durationDays) / 365).toFixed(4);
  };

  const handleStakeClick = () => {
    if (!isConnected || parseFloat(stakeAmount) <= 0) return;
    if (!chainGuard.isCorrectChain) return;
    setIsConfirming(true);
  };

  const executeStake = () => {
    setIsConfirming(false);

    if (isPlaceholderAddress(contractAddresses.WcosStaking)) {
      console.error("Staking contract is not configured on this network.");
      return;
    }

    // Real on-chain stake call
    // Amount in WGT tokens (18 decimals assumed)
    stakeTx.execute({
      address: contractAddresses.WcosStaking,
      abi: WcosStakingABI,
      functionName: "stake",
      args: [parseUnits(stakeAmount, 18)],
    });
  };

  const handleClaim = () => {
    if (isPlaceholderAddress(contractAddresses.WcosStaking)) {
      console.error("Staking contract is not configured on this network.");
      return;
    }

    claimTx.execute({
      address: contractAddresses.WcosStaking,
      abi: WcosStakingABI,
      functionName: "claimRewards",
      args: [],
    });
  };

  const isStaking = stakeTx.state.isLoading;
  const isClaiming = claimTx.state.isLoading;
  const txHash = stakeTx.state.txHash || claimTx.state.txHash;

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
          <ChainSelector />
          <SafeWalletButton showBalance={false} />
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
          <WalletGuard requiredFeature="DeFi Staking Module">
            <div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Layers className="h-6 w-6 text-amber-400" /> Staking Center
            </h2>
            <p className="text-slate-400 text-xs mt-1">Stake WCOS governance tokens to secure validation and earn linear yields.</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            
            {/* Stake Input Panel */}
            <div className="space-y-5 rounded-3xl border border-white/5 bg-slate-900/20 p-6">
              
              {/* Staking contract status */}
              {isPlaceholderAddress(contractAddresses.WcosStaking) && (
                <div className="rounded-2xl border border-rose-500/25 bg-rose-500/5 p-3.5 flex items-center gap-2 text-[11px] text-rose-400 animate-pulse">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>
                    Staking contract is not configured on the selected network ({chainGuard.requiredChainName}). 
                    Smart contract interactions are disabled.
                  </span>
                </div>
              )}

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

              {/* Chain guard */}
              {!isConnected ? (
                <div className="w-full rounded-full border border-amber-500/25 bg-amber-500/5 py-3.5 text-xs font-semibold text-amber-400 text-center">
                  Connect wallet to stake
                </div>
              ) : !chainGuard.isCorrectChain ? (
                <button onClick={chainGuard.switchToRequired} disabled={chainGuard.isSwitching}
                  className="w-full rounded-full border border-rose-500/30 bg-rose-500/5 py-3.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition disabled:opacity-50">
                  {chainGuard.isSwitching ? "Switching…" : "Switch to Base Sepolia"}
                </button>
              ) : (
                <button
                  onClick={handleStakeClick}
                  disabled={isStaking}
                  className="w-full rounded-full bg-gradient-to-r from-amber-500 to-indigo-600 py-3.5 text-xs font-semibold text-white shadow transition hover:opacity-95 disabled:opacity-50"
                >
                  {isStaking
                    ? getTxStatusLabel(stakeTx.state.status, { pending_wallet: "Check wallet…", submitted: "Confirming stake…" })
                    : "Stake Tokens"}
                </button>
              )}
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

                {/* Real TX lifecycle status */}
                {stakeTx.state.status === "pending_wallet" && (
                  <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl flex items-center gap-2 text-xs text-cyan-400 font-semibold animate-pulse">
                    <RefreshCw className="h-4 w-4 animate-spin" /> Waiting for wallet signature…
                  </div>
                )}
                {stakeTx.state.status === "submitted" && (
                  <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl flex items-center gap-2 text-xs text-indigo-400">
                    <RefreshCw className="h-4 w-4 animate-spin" /> Staking submitted — confirming…
                  </div>
                )}
                {stakeTx.state.status === "confirmed" && txHash && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-[11px]">
                    <div className="flex items-center gap-1.5 font-bold mb-1"><CheckCircle2 className="h-4 w-4" /> Staking Confirmed!</div>
                    <a href={getExplorerTxUrl(walletChainId, txHash)} target="_blank" rel="noreferrer" className="font-mono text-[9px] underline truncate block">{txHash}</a>
                  </div>
                )}
                {stakeTx.state.status === "failed" && (
                  <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-2xl flex items-start gap-2 text-xs text-rose-400">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span>{stakeTx.state.error}</span>
                  </div>
                )}
                {claimTx.state.status === "confirmed" && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-[11px] flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="h-4 w-4" /> Rewards claimed!
                  </div>
                )}
              </div>
            </div>

          </div>
          </WalletGuard>
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
