"use client";

import React, { useState, useEffect } from "react";
import { SafeWalletButton } from "../../../components/ui/SafeWalletButton";
import { WalletGuard } from "../../../components/ui/WalletGuard";
import { ChainSelector } from "../../../components/ui/ChainSelector";
import { useAccount, useChainId, useSwitchChain, useReadContract } from "wagmi";
import {
  Coins, Wallet, Compass, Users, Layers, Sparkles, FileText, ShoppingBag, 
  ChevronRight, Activity, Cpu, RefreshCw, CheckCircle2, X, AlertTriangle, 
  HelpCircle, Percent, Globe, Info, Clock, ArrowRightLeft, ShieldAlert
} from "lucide-react";
import { useChainGuard } from "../../../lib/useChainGuard";
import { useWeb3Transaction, getTxStatusLabel, parseContractError } from "../../../lib/useWeb3Transaction";
import { 
  CONTRACT_ADDRESSES, 
  WcosStakingABI, 
  ERC20ApproveABI, 
  isPlaceholderAddress, 
  useContractAddresses, 
  getExplorerTxUrl 
} from "../../../lib/contracts";
import { parseUnits, formatUnits } from "viem";

export default function DefiStakingPage() {
  const { address, isConnected } = useAccount();
  const contractAddresses = useContractAddresses();
  const [activeModule] = useState("staking");
  const [selectedChain, setSelectedChain] = useState("base-sepolia");
  const [activeTab, setActiveTab] = useState<"stake" | "unstake">("stake");

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
  const [unstakeAmount, setUnstakeAmount] = useState("100");
  const [lockDuration, setLockDuration] = useState("90");
  const [isConfirmingStake, setIsConfirmingStake] = useState(false);
  const [isConfirmingUnstake, setIsConfirmingUnstake] = useState(false);
  const [isConfirmingEmergency, setIsConfirmingEmergency] = useState(false);
  const [stakingHistory, setStakingHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // ── Smart Contract Reads ──────────────────────────────────────────────────
  
  // 1. Balance of WGT
  const { data: wgtBalanceRaw, refetch: refetchWgtBalance } = useReadContract({
    address: contractAddresses.WcosGovernanceToken,
    abi: [
      {
        type: "function",
        name: "balanceOf",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
      }
    ] as const,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !isPlaceholderAddress(contractAddresses.WcosGovernanceToken) }
  });

  // 2. Allowance of WGT for WcosStaking
  const { data: allowanceRaw, refetch: refetchAllowance } = useReadContract({
    address: contractAddresses.WcosGovernanceToken,
    abi: ERC20ApproveABI,
    functionName: "allowance",
    args: address && !isPlaceholderAddress(contractAddresses.WcosStaking) 
      ? [address, contractAddresses.WcosStaking] 
      : undefined,
    query: { enabled: !!address && !isPlaceholderAddress(contractAddresses.WcosGovernanceToken) && !isPlaceholderAddress(contractAddresses.WcosStaking) }
  });

  // 3. Staking contract user balance
  const { data: stakedBalanceRaw, refetch: refetchStakedBalance } = useReadContract({
    address: contractAddresses.WcosStaking,
    abi: WcosStakingABI,
    functionName: "balances",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !isPlaceholderAddress(contractAddresses.WcosStaking) }
  });

  // 4. Staking contract user earned rewards
  const { data: accruedRewardsRaw, refetch: refetchRewards } = useReadContract({
    address: contractAddresses.WcosStaking,
    abi: WcosStakingABI,
    functionName: "earned",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !isPlaceholderAddress(contractAddresses.WcosStaking) }
  });

  // 5. Staking contract user unlock timestamp
  const { data: unlockTimeRaw, refetch: refetchUnlockTimes } = useReadContract({
    address: contractAddresses.WcosStaking,
    abi: WcosStakingABI,
    functionName: "unlockTimes",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !isPlaceholderAddress(contractAddresses.WcosStaking) }
  });

  // 6. Staking contract user lock duration
  const { data: lockDurationRaw, refetch: refetchLockDurations } = useReadContract({
    address: contractAddresses.WcosStaking,
    abi: WcosStakingABI,
    functionName: "lockDurations",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !isPlaceholderAddress(contractAddresses.WcosStaking) }
  });

  // Derived states
  const wgtBalance = wgtBalanceRaw ? formatUnits(wgtBalanceRaw, 18) : "0";
  const allowance = allowanceRaw ? formatUnits(allowanceRaw, 18) : "0";
  const stakedBalance = stakedBalanceRaw ? formatUnits(stakedBalanceRaw, 18) : "0";
  const accruedRewards = accruedRewardsRaw ? formatUnits(accruedRewardsRaw, 18) : "0";
  const unlockTimestamp = unlockTimeRaw ? Number(unlockTimeRaw) : 0;
  const activeLockDuration = lockDurationRaw ? Number(lockDurationRaw) : 0;

  const isLocked = unlockTimestamp > Math.floor(Date.now() / 1000);
  const unlockDate = unlockTimestamp > 0 ? new Date(unlockTimestamp * 1000) : null;
  const timeRemainingSeconds = unlockTimestamp - Math.floor(Date.now() / 1000);
  const daysRemaining = timeRemainingSeconds > 0 ? Math.ceil(timeRemainingSeconds / 86400) : 0;

  const requiresApproval = parseFloat(allowance) < (parseFloat(stakeAmount) || 0);

  // Refresh helper
  const refetchAllOnChain = () => {
    refetchWgtBalance();
    refetchAllowance();
    refetchStakedBalance();
    refetchRewards();
    refetchUnlockTimes();
    refetchLockDurations();
  };

  // Fetch transaction history
  const fetchHistory = async () => {
    if (!address) return;
    setIsHistoryLoading(true);
    try {
      const res = await fetch(`/api/v1/defi/staking/history?address=${address}`);
      if (res.ok) {
        const data = await res.json();
        setStakingHistory(data);
      }
    } catch (e) {
      console.error("Failed fetching history:", e);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (address) {
      refetchAllOnChain();
      fetchHistory();
    }
  }, [address]);

  // Synchronize transaction with Backend
  const registerPendingTx = async (txHash: string, type: string, amount: string, rewards?: string) => {
    if (!address) return;
    try {
      await fetch("/api/v1/defi/staking/pending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          chainId: activeChainId,
          stakingContract: contractAddresses.WcosStaking,
          transactionType: type,
          tokenAddress: contractAddresses.WcosGovernanceToken,
          amount,
          rewardAmount: rewards || "0",
          transactionHash: txHash,
        }),
      });
    } catch (e) {
      console.warn("Could not sync pending transaction:", e);
    }
  };

  const confirmTx = async (txHash: string) => {
    try {
      await fetch("/api/v1/defi/staking/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chainId: activeChainId,
          txHash,
        }),
      });
    } catch (e) {
      console.warn("Could not confirm transaction with backend:", e);
    } finally {
      refetchAllOnChain();
      fetchHistory();
    }
  };

  // ── Web3 Transactions ──────────────────────────────────────────────────────
  
  // 1. Approve
  const approveTx = useWeb3Transaction({
    onSuccess: async (txHash) => {
      await registerPendingTx(txHash, "APPROVE", stakeAmount);
      await confirmTx(txHash);
    },
    onError: (err) => console.error("Approve failed:", err),
  });

  // 2. Stake
  const stakeTx = useWeb3Transaction({
    onSuccess: async (txHash) => {
      setIsConfirmingStake(false);
      await registerPendingTx(txHash, "STAKE", stakeAmount);
      await confirmTx(txHash);
    },
    onError: (err) => console.error("Stake failed:", err),
  });

  // 3. Claim
  const claimTx = useWeb3Transaction({
    onSuccess: async (txHash) => {
      await registerPendingTx(txHash, "CLAIM", "0", accruedRewards);
      await confirmTx(txHash);
    },
    onError: (err) => console.error("Claim failed:", err),
  });

  // 4. Unstake (Withdraw)
  const withdrawTx = useWeb3Transaction({
    onSuccess: async (txHash) => {
      setIsConfirmingUnstake(false);
      await registerPendingTx(txHash, "UNSTAKE", unstakeAmount);
      await confirmTx(txHash);
    },
    onError: (err) => console.error("Withdraw failed:", err),
  });

  // 5. Emergency Withdraw (Forfeiting rewards)
  const emergencyTx = useWeb3Transaction({
    onSuccess: async (txHash) => {
      setIsConfirmingEmergency(false);
      await registerPendingTx(txHash, "EMERGENCY_WITHDRAW", stakedBalance);
      await confirmTx(txHash);
    },
    onError: (err) => console.error("Emergency withdraw failed:", err),
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

  const handleApprove = () => {
    if (!isConnected || parseFloat(stakeAmount) <= 0) return;
    approveTx.execute({
      address: contractAddresses.WcosGovernanceToken,
      abi: ERC20ApproveABI,
      functionName: "approve",
      args: [contractAddresses.WcosStaking, parseUnits(stakeAmount, 18)],
    });
  };

  const handleStakeClick = () => {
    if (!isConnected || parseFloat(stakeAmount) <= 0) return;
    if (!chainGuard.isCorrectChain) return;
    setIsConfirmingStake(true);
  };

  const executeStake = () => {
    stakeTx.execute({
      address: contractAddresses.WcosStaking,
      abi: WcosStakingABI,
      functionName: "stake",
      args: [parseUnits(stakeAmount, 18), BigInt(lockDuration)],
    });
  };

  const handleClaim = () => {
    if (isPlaceholderAddress(contractAddresses.WcosStaking)) return;
    claimTx.execute({
      address: contractAddresses.WcosStaking,
      abi: WcosStakingABI,
      functionName: "claimRewards",
      args: [],
    });
  };

  const handleUnstakeClick = () => {
    if (!isConnected || parseFloat(unstakeAmount) <= 0) return;
    setIsConfirmingUnstake(true);
  };

  const executeUnstake = () => {
    withdrawTx.execute({
      address: contractAddresses.WcosStaking,
      abi: WcosStakingABI,
      functionName: "withdraw",
      args: [parseUnits(unstakeAmount, 18)],
    });
  };

  const handleEmergencyClick = () => {
    setIsConfirmingEmergency(true);
  };

  const executeEmergency = () => {
    emergencyTx.execute({
      address: contractAddresses.WcosStaking,
      abi: WcosStakingABI,
      functionName: "emergencyWithdraw",
      args: [],
    });
  };

  // Button loading states
  const isStaking = stakeTx.state.isLoading;
  const isApproving = approveTx.state.isLoading;
  const isClaiming = claimTx.state.isLoading;
  const isUnstaking = withdrawTx.state.isLoading;
  const isEmergencyWithdrawing = emergencyTx.state.isLoading;

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
              
              {/* Left Action Box */}
              <div className="space-y-5 rounded-3xl border border-white/5 bg-slate-900/20 p-6">
                
                {/* Contract validation warnings */}
                {isPlaceholderAddress(contractAddresses.WcosStaking) && (
                  <div className="rounded-2xl border border-rose-500/25 bg-rose-500/5 p-3.5 flex items-center gap-2 text-[11px] text-rose-400 animate-pulse">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span>
                      Staking contract is not configured on the selected network ({chainGuard.requiredChainName}). 
                      Smart contract interactions are disabled.
                    </span>
                  </div>
                )}

                {/* Tabs */}
                <div className="flex border-b border-white/5 pb-0.5">
                  <button
                    onClick={() => setActiveTab("stake")}
                    className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition ${
                      activeTab === "stake"
                        ? "border-amber-500 text-amber-400"
                        : "border-transparent text-slate-400 hover:text-white"
                    }`}
                  >
                    Stake WGT
                  </button>
                  <button
                    onClick={() => setActiveTab("unstake")}
                    className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition ${
                      activeTab === "unstake"
                        ? "border-amber-500 text-amber-400"
                        : "border-transparent text-slate-400 hover:text-white"
                    }`}
                  >
                    Unstake WGT
                  </button>
                </div>

                {activeTab === "stake" ? (
                  <div className="space-y-4">
                    {/* Risk warning */}
                    <div className="rounded-2xl bg-amber-500/5 border border-amber-500/25 p-3.5 text-amber-400 flex items-start gap-2.5 text-xs">
                      <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-bold">Yield Risk warning</p>
                        <p className="text-amber-400/80 mt-0.5">
                          Staked tokens are locked for the selected duration. Early withdrawals are subject to penalties or forfeitures.
                        </p>
                      </div>
                    </div>

                    {/* Stake token input */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase">
                        <label>Token Stake Amount</label>
                        <span className="cursor-pointer hover:text-slate-300" onClick={() => setStakeAmount(wgtBalance)}>
                          Wallet: {parseFloat(wgtBalance).toFixed(2)} WGT
                        </span>
                      </div>
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
                          { val: "30", label: "30 Days (8% APY)" },
                          { val: "90", label: "90 Days (12% APY)" },
                          { val: "365", label: "1 Year (18% APY)" }
                        ].map((duration) => (
                          <button
                            key={duration.val}
                            onClick={() => setLockDuration(duration.val)}
                            className={`rounded-xl border py-2.5 px-3 text-[11px] font-semibold transition ${
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
                        <span>Current APY Rate:</span>
                        <span className="text-emerald-400 font-bold">{calculateApy()}% APY</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Est. Reward payout:</span>
                        <span className="text-white font-bold">{calculateExpectedReturn()} WGT</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    {!isConnected ? (
                      <div className="w-full rounded-full border border-amber-500/25 bg-amber-500/5 py-3.5 text-xs font-semibold text-amber-400 text-center">
                        Connect wallet to stake
                      </div>
                    ) : !chainGuard.isCorrectChain ? (
                      <button onClick={chainGuard.switchToRequired} disabled={chainGuard.isSwitching}
                        className="w-full rounded-full border border-rose-500/30 bg-rose-500/5 py-3.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition disabled:opacity-50">
                        {chainGuard.isSwitching ? "Switching…" : "Switch to Base Sepolia"}
                      </button>
                    ) : requiresApproval ? (
                      <button
                        onClick={handleApprove}
                        disabled={isApproving}
                        className="w-full rounded-full bg-amber-500 py-3.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 transition disabled:opacity-50"
                      >
                        {isApproving ? "Approving WGT..." : "Approve WGT Token"}
                      </button>
                    ) : (
                      <button
                        onClick={handleStakeClick}
                        disabled={isStaking || parseFloat(stakeAmount) <= 0}
                        className="w-full rounded-full bg-gradient-to-r from-amber-500 to-indigo-600 py-3.5 text-xs font-semibold text-white shadow transition hover:opacity-95 disabled:opacity-50"
                      >
                        {isStaking ? "Staking..." : "Stake Tokens"}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Lock details */}
                    {isLocked ? (
                      <div className="rounded-2xl bg-indigo-500/5 border border-indigo-500/25 p-3.5 text-indigo-400 flex items-start gap-2.5 text-xs">
                        <Clock className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-bold">Tokens are currently Locked</p>
                          <p className="text-slate-400 mt-0.5">
                            Your staked balance is locked until <span className="text-white font-bold">{unlockDate?.toLocaleDateString()}</span> ({daysRemaining} days remaining). Unstaking early requires emergency withdrawal.
                          </p>
                        </div>
                      </div>
                    ) : stakedBalance !== "0" ? (
                      <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/25 p-3.5 text-emerald-400 flex items-start gap-2.5 text-xs">
                        <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-bold">Tokens are Unlocked</p>
                          <p className="text-slate-400 mt-0.5">
                            Your lock period has ended. You can withdraw your WGT tokens penalty-free now!
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {/* Unstake token input */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase">
                        <label>Unstake Amount</label>
                        <span className="cursor-pointer hover:text-slate-300" onClick={() => setUnstakeAmount(stakedBalance)}>
                          Staked: {parseFloat(stakedBalance).toFixed(2)} WGT
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={unstakeAmount}
                          onChange={(e) => setUnstakeAmount(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-400 font-mono"
                          placeholder="100.0"
                        />
                        <span className="absolute right-3.5 top-2.5 text-xs text-slate-500 font-bold">WGT</span>
                      </div>
                    </div>

                    {/* Unstake Action Button */}
                    {!isConnected ? (
                      <div className="w-full rounded-full border border-amber-500/25 bg-amber-500/5 py-3.5 text-xs font-semibold text-amber-400 text-center">
                        Connect wallet to unstake
                      </div>
                    ) : !chainGuard.isCorrectChain ? (
                      <button onClick={chainGuard.switchToRequired} disabled={chainGuard.isSwitching}
                        className="w-full rounded-full border border-rose-500/30 bg-rose-500/5 py-3.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition disabled:opacity-50">
                        {chainGuard.isSwitching ? "Switching…" : "Switch to Base Sepolia"}
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <button
                          onClick={handleUnstakeClick}
                          disabled={isUnstaking || parseFloat(unstakeAmount) <= 0 || (isLocked && parseFloat(unstakeAmount) > 0)}
                          className="w-full rounded-full bg-slate-100 hover:bg-white text-slate-950 py-3.5 text-xs font-semibold shadow transition disabled:opacity-50"
                        >
                          {isUnstaking ? "Unstaking..." : isLocked ? "Staked Tokens are Locked" : "Withdraw Tokens"}
                        </button>

                        {isLocked && parseFloat(stakedBalance) > 0 && (
                          <button
                            onClick={handleEmergencyClick}
                            disabled={isEmergencyWithdrawing}
                            className="w-full rounded-full border border-rose-500/30 hover:border-rose-500/50 bg-rose-500/5 hover:bg-rose-500/10 py-3 text-xs font-semibold text-rose-400 transition"
                          >
                            {isEmergencyWithdrawing ? "Processing..." : "Emergency Withdraw (Forfeit Yields)"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Earnings Tally Panel */}
              <div className="space-y-6">
                
                {/* Stats */}
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white">Staking Account Stats</h3>
                  
                  <div className="p-4 bg-slate-950/60 border border-white/5 rounded-2xl space-y-4">
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-500 uppercase font-bold block">Active Staked Balance</span>
                      <p className="text-xl font-black text-white font-mono">{parseFloat(stakedBalance).toFixed(4)} WGT</p>
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-500 uppercase font-bold block">Accrued rewards balance</span>
                      <div className="flex items-center justify-between">
                        <p className="text-xl font-black text-emerald-400 font-mono">{parseFloat(accruedRewards).toFixed(6)} WGT</p>
                        {parseFloat(accruedRewards) > 0 && (
                          <button
                            onClick={handleClaim}
                            disabled={isClaiming}
                            className="rounded-full bg-emerald-600 hover:bg-emerald-500 text-[10px] font-bold px-3 py-1.5 text-white transition disabled:opacity-50"
                          >
                            {isClaiming ? "Claiming..." : "Claim Rewards"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Transaction statuses */}
                  {approveTx.state.status === "pending_wallet" && (
                    <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl flex items-center gap-2 text-xs text-cyan-400 font-semibold animate-pulse">
                      <RefreshCw className="h-4 w-4 animate-spin" /> Waiting for wallet approval signature…
                    </div>
                  )}
                  {stakeTx.state.status === "pending_wallet" && (
                    <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl flex items-center gap-2 text-xs text-cyan-400 font-semibold animate-pulse">
                      <RefreshCw className="h-4 w-4 animate-spin" /> Confirm staking deposit in wallet…
                    </div>
                  )}
                  {stakeTx.state.status === "submitted" && (
                    <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl flex items-center gap-2 text-xs text-indigo-400">
                      <RefreshCw className="h-4 w-4 animate-spin" /> Transaction submitted — confirming…
                    </div>
                  )}
                  {stakeTx.state.status === "confirmed" && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-[11px]">
                      <div className="flex items-center gap-1.5 font-bold mb-1"><CheckCircle2 className="h-4 w-4" /> Staking Confirmed!</div>
                    </div>
                  )}
                  {claimTx.state.status === "confirmed" && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-[11px] flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="h-4 w-4" /> Rewards claimed successfully!
                    </div>
                  )}
                </div>

                {/* Staking History */}
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white">Staking History</h3>
                  
                  {isHistoryLoading ? (
                    <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" /> Loading transactions...
                    </div>
                  ) : stakingHistory.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                      No staking transactions recorded.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {stakingHistory.map((tx: any) => (
                        <div key={tx.id} className="p-3 bg-slate-950 border border-white/5 rounded-2xl text-[11px] font-mono flex items-center justify-between">
                          <div>
                            <span className={`font-bold uppercase ${
                              tx.transactionType === "STAKE" ? "text-amber-400" :
                              tx.transactionType === "CLAIM" ? "text-emerald-400" : "text-slate-300"
                            }`}>{tx.transactionType}</span>
                            <div className="text-slate-500 text-[9px] mt-0.5">
                              {new Date(tx.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-white font-bold">
                              {tx.transactionType === "CLAIM" ? tx.rewardAmount : tx.amount} WGT
                            </span>
                            <a
                              href={getExplorerTxUrl(activeChainId, tx.transactionHash)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[9px] block text-cyan-400 underline mt-0.5"
                            >
                              Receipt ↗
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          </WalletGuard>
        </main>
      </div>

      {/* Confirmation Modal */}
      {isConfirmingStake && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsConfirmingStake(false)}
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
              className="w-full rounded-full bg-gradient-to-r from-amber-500 to-indigo-600 py-3.5 text-xs font-semibold text-white transition hover:opacity-95"
            >
              Confirm & Deposit Staking
            </button>
          </div>
        </div>
      )}

      {/* Unstaking Confirmation Modal */}
      {isConfirmingUnstake && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsConfirmingUnstake(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold text-white">Confirm Unstake Withdrawal</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Withdrawing your staked WGT tokens from the smart contract. Your accumulated rewards will be claimed automatically.
            </p>
            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-2.5 text-xs font-mono text-slate-300">
              <div className="flex justify-between">
                <span>Token:</span>
                <span className="font-bold text-white">WGT</span>
              </div>
              <div className="flex justify-between">
                <span>Unstaked Amount:</span>
                <span className="font-bold text-white">{unstakeAmount} WGT</span>
              </div>
            </div>
            <button
              onClick={executeUnstake}
              className="w-full rounded-full bg-white text-slate-950 py-3.5 text-xs font-semibold transition hover:opacity-95"
            >
              Confirm & Withdraw WGT
            </button>
          </div>
        </div>
      )}

      {/* Emergency Confirmation Modal */}
      {isConfirmingEmergency && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/20 rounded-3xl p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsConfirmingEmergency(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" /> Emergency Withdraw
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              This is a high-risk operation. You will retrieve your staked principal of <span className="text-white font-bold">{stakedBalance} WGT</span> immediately, but <span className="text-rose-400 font-bold">ALL your accrued yields ({accruedRewards} WGT) will be permanently forfeited</span>.
            </p>
            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-2.5 text-xs font-mono text-slate-300">
              <div className="flex justify-between">
                <span>Principal Returned:</span>
                <span className="font-bold text-white">{stakedBalance} WGT</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>Yield Forfeited:</span>
                <span className="font-bold">-{accruedRewards} WGT</span>
              </div>
            </div>
            <button
              onClick={executeEmergency}
              className="w-full rounded-full bg-rose-600 hover:bg-rose-500 py-3.5 text-xs font-semibold text-white transition hover:opacity-95"
            >
              Forfeit Yields & Withdraw
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
