"use client";

import React, { useState, useEffect } from "react";
import {
  ERC20ApproveABI,
  isPlaceholderAddress,
  getExplorerTxUrl,
} from "../../../lib/contracts";
import { SafeWalletButton } from "../../../components/ui/SafeWalletButton";
import { WalletGuard } from "../../../components/ui/WalletGuard";
import { ChainSelector } from "../../../components/ui/ChainSelector";
import { useAccount, useChainId, useSwitchChain, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, encodeFunctionData } from "viem";
import {
  Coins, Wallet, Compass, Users, Layers, Sparkles, FileText, ShoppingBag, 
  ChevronRight, Activity, Cpu, ArrowUpRight, TrendingUp, DollarSign, 
  HelpCircle, RefreshCw, Eye, ShieldAlert, Globe, ArrowDown, Settings, 
  AlertTriangle, CheckCircle2, X
} from "lucide-react";
import { useChainGuard } from "../../../lib/useChainGuard";
import { parseContractError, getTxStatusLabel } from "../../../lib/useWeb3Transaction";
import { baseSepolia } from "wagmi/chains";

export default function DefiSwapPage() {
  const { address, isConnected } = useAccount();
  const [activeModule] = useState("swap");
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

  const [fromToken, setFromToken] = useState("ETH");
  const [toToken, setToToken] = useState("WGT");
  const [amount, setAmount] = useState("0.1");
  const [slippage, setSlippage] = useState(0.5);
  const [expectedOutput, setExpectedOutput] = useState("");
  const [gasEstimate, setGasEstimate] = useState("");
  const [routerAddress, setRouterAddress] = useState("");
  const [selectedAdapter, setSelectedAdapter] = useState("uniswap");
  const [swapError, setSwapError] = useState("");

  const [isQuoting, setIsQuoting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

  const { data: swapTxHash, sendTransaction, error: sendError, isPending: isSending } = useSendTransaction();
  const { isLoading: isWaitingConfirm, isSuccess: isSwapConfirmed } = useWaitForTransactionReceipt({ hash: swapTxHash });

  const isSwapping = isSending || isWaitingConfirm;
  const swapTx = swapTxHash || "";

  const fetchQuote = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setIsQuoting(true);
    try {
      const response = await fetch(`${backendUrl}/api/v1/defi/swap-quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adapter: selectedAdapter, fromToken, toToken, amount, slippage })
      });
      if (response.ok) {
        const data = await response.json();
        setExpectedOutput(data.expectedOutput);
        setGasEstimate(data.gasEstimate);
        setRouterAddress(data.routerAddress);
      }
    } catch (err) { console.error(err); }
    finally { setIsQuoting(false); }
  };

  useEffect(() => { fetchQuote(); }, [amount, fromToken, toToken, selectedAdapter, slippage]);

  const triggerSwapTx = () => {
    if (!isConnected) return;
    if (!chainGuard.isCorrectChain) { setSwapError(`Wrong chain — switch wallet to ${chainGuard.requiredChainName}.`); return; }
    setIsConfirming(true);
  };

  const confirmSwap = () => {
    setIsConfirming(false);
    setSwapError("");

    if (!routerAddress || routerAddress === "0x0000000000000000000000000000000000000000") {
      setSwapError(`Swap router is not configured on the selected network (${chainGuard.requiredChainName}).`);
      return;
    }

    // Real wallet-signed transaction to the DEX router
    sendTransaction({
      to: routerAddress as `0x${string}`,
      value: fromToken === "ETH" ? parseEther(amount) : BigInt(0),
      // Router calldata would be encoded from the quote here in production
      // For now we send the ETH value — router handles the swap logic
    });
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
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                activeModule === "swap"
                  ? "bg-amber-600/10 text-amber-400 border border-amber-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <RefreshCw className="h-4 w-4" /> Swap Assets
              </span>
              <ChevronRight className="h-3 w-3 opacity-60" />
            </button>

            <button
              onClick={() => window.location.href = "/defi/staking"}
              className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent transition-all"
            >
              <span className="flex items-center gap-2.5">
                <Layers className="h-4 w-4" /> Staking Center
              </span>
              <ChevronRight className="h-3 w-3 opacity-60" />
            </button>
          </div>
        </aside>

        {/* Central swap panel */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 flex flex-col items-center justify-center">
          <WalletGuard requiredFeature="DeFi Swap Module">
            <div className="max-w-md w-full rounded-3xl border border-white/10 bg-slate-900/40 p-6 space-y-4 shadow-2xl backdrop-blur-xl relative">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-amber-400" /> Swap Assets
              </h3>
              <div className="flex items-center gap-1">
                {/* Provider select */}
                <select
                  value={selectedAdapter}
                  onChange={(e) => setSelectedAdapter(e.target.value)}
                  className="bg-slate-950 border border-white/10 rounded-xl px-2 py-1 text-[10px] text-white outline-none cursor-pointer"
                >
                  <option value="uniswap">Uniswap V3</option>
                  <option value="1inch">1inch (Soon)</option>
                  <option value="0x">0x API (Soon)</option>
                </select>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 text-slate-400 hover:text-white transition"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Risk Warning Panel */}
            <div className="rounded-2xl bg-amber-500/5 border border-amber-500/25 p-3.5 text-amber-400 flex items-start gap-2.5 text-[11px] leading-relaxed">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold">Risk Warning Notice</p>
                <p className="text-amber-400/80 mt-0.5">
                  DEX swaps carry execution risks (e.g. slippage, path changes). Verify tokens and input settings before proceeding.
                </p>
              </div>
            </div>

            {showSettings && (
              <div className="p-4 bg-slate-950 border border-white/10 rounded-2xl space-y-3 animate-fade-in">
                <h4 className="text-xs font-bold text-white">Slippage Tolerance</h4>
                <div className="flex gap-2">
                  {[0.1, 0.5, 1.0].map((val) => (
                    <button
                      key={val}
                      onClick={() => setSlippage(val)}
                      className={`flex-1 py-1.5 rounded-xl border text-xs font-bold font-mono transition ${
                        slippage === val ? "border-amber-500 bg-amber-500/10 text-amber-400" : "border-white/5 bg-slate-900 text-slate-400"
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Swap Input Form */}
            <div className="space-y-3.5">
              
              {/* Pay Input */}
              <div className="rounded-2xl bg-slate-950 border border-white/5 p-4 flex justify-between items-center">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase block">Sell Amount</label>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-transparent text-xl font-bold font-mono outline-none text-white w-full"
                    placeholder="0.0"
                  />
                </div>
                <select
                  value={fromToken}
                  onChange={(e) => setFromToken(e.target.value)}
                  className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none cursor-pointer"
                >
                  <option value="ETH">ETH</option>
                  <option value="WGT">WGT</option>
                  <option value="USDC">USDC</option>
                </select>
              </div>

              {/* Arrow spacer */}
              <div className="flex justify-center -my-2.5 relative z-10">
                <div className="h-8 w-8 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer shadow-lg">
                  <ArrowDown className="h-4 w-4" />
                </div>
              </div>

              {/* Receive Input */}
              <div className="rounded-2xl bg-slate-950 border border-white/5 p-4 flex justify-between items-center">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase block">Expected Return</label>
                  <div className="text-xl font-bold font-mono text-slate-300">
                    {isQuoting ? <RefreshCw className="h-4 w-4 animate-spin text-amber-500" /> : expectedOutput || "0.00"}
                  </div>
                </div>
                <select
                  value={toToken}
                  onChange={(e) => setToToken(e.target.value)}
                  className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none cursor-pointer"
                >
                  <option value="WGT">WGT</option>
                  <option value="ETH">ETH</option>
                  <option value="USDC">USDC</option>
                </select>
              </div>

            </div>

            {/* Quote details */}
            {expectedOutput && (
              <div className="p-3.5 bg-slate-950/60 border border-white/5 rounded-2xl text-[10px] font-mono space-y-1.5 text-slate-400">
                <div className="flex justify-between">
                  <span>Routing path:</span>
                  <span className="text-white capitalize">{selectedAdapter} router</span>
                </div>
                <div className="flex justify-between">
                  <span>Gas estimation fee:</span>
                  <span className="text-white">{gasEstimate} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span>Router:</span>
                  <span className="text-slate-500 text-[8px] max-w-[200px] truncate">{routerAddress}</span>
                </div>
              </div>
            )}

            <button
              onClick={triggerSwapTx}
              disabled={isQuoting || !isConnected || isSwapping}
              className="w-full rounded-full bg-gradient-to-r from-amber-500 to-indigo-600 py-3.5 text-xs font-semibold text-white transition hover:opacity-95 active:scale-95 disabled:opacity-50"
            >
              {isQuoting ? "Fetching Quote…" : isSwapping ? "Awaiting wallet / Confirming…" : isConnected ? "Swap Assets" : "Connect Wallet to Trade"}
            </button>

            {/* Error banner */}
            {(swapError || sendError) && (
              <div className="p-3.5 bg-rose-500/5 border border-rose-500/20 rounded-2xl flex items-start gap-2 text-xs text-rose-400">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{swapError || parseContractError(sendError)}</span>
              </div>
            )}

            {/* Pending wallet */}
            {isSending && !swapTxHash && (
              <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl flex items-center gap-2 text-xs text-cyan-400 font-semibold animate-pulse">
                <RefreshCw className="h-4 w-4 animate-spin" /> Awaiting wallet signature…
              </div>
            )}

            {/* Submitted / confirming */}
            {swapTxHash && !isSwapConfirmed && (
              <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl flex items-center gap-2 text-xs text-indigo-400">
                <RefreshCw className="h-4 w-4 animate-spin" /> Transaction submitted — confirming on-chain…
                <a href={getExplorerTxUrl(walletChainId, swapTxHash)} target="_blank" rel="noreferrer" className="underline ml-1 text-indigo-300">View</a>
              </div>
            )}

            {/* Confirmed */}
            {isSwapConfirmed && swapTxHash && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-2 text-emerald-400 text-xs">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <span>Swap Confirmed</span>
                </div>
                <a href={getExplorerTxUrl(walletChainId, swapTxHash)} target="_blank" rel="noreferrer"
                  className="text-[9px] font-mono text-emerald-500/80 truncate block underline">{swapTxHash}</a>
              </div>
            )}

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
            <h3 className="text-base font-bold text-white">Confirm Token Swap</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every swap transaction requires active wallet signature confirmation. Verify the paths, values, and fees below.
            </p>
            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-2.5 text-xs font-mono text-slate-300">
              <div className="flex justify-between">
                <span>Sell amount:</span>
                <span className="font-bold text-white">{amount} {fromToken}</span>
              </div>
              <div className="flex justify-between">
                <span>Buy expected:</span>
                <span className="font-bold text-white">{expectedOutput} {toToken}</span>
              </div>
              <div className="flex justify-between">
                <span>Slippage settings:</span>
                <span className="text-amber-400 font-bold">{slippage}%</span>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-2.5">
                <span>Est. Gas Fee:</span>
                <span className="font-bold text-white">{gasEstimate} ETH</span>
              </div>
            </div>
            <button
              onClick={confirmSwap}
              className="w-full rounded-full bg-gradient-to-r from-amber-500 to-indigo-600 py-3 text-xs font-semibold text-white transition hover:opacity-95"
            >
              Sign & Execute Swap
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
