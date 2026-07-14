"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SafeWalletButton } from "../../components/ui/SafeWalletButton";
import { WalletGuard } from "../../components/ui/WalletGuard";
import { useAccount } from "wagmi";
import {
  Coins, Wallet, Compass, Layers, RefreshCw, Eye, EyeOff, ShieldAlert,
  Globe, Info, DollarSign, TrendingUp, TrendingDown, EyeIcon, Award,
  ArrowUpRight, ArrowDownLeft, Landmark, FileText, ChevronRight, Cpu
} from "lucide-react";

interface NativeBalance {
  raw: string;
  formatted: string;
  decimals: number;
  symbol: string;
  usdValue: string;
  chainId: number;
  walletAddress: string;
}

interface TokenBalance {
  tokenName: string;
  symbol: string;
  contractAddress: string;
  decimals: number;
  walletBalance: string;
  formattedBalance: string;
  priceUsd: string;
  fiatValue: string;
  chainId: number;
}

interface PortfolioData {
  walletAddress: string;
  netValueUsd: string;
  totalAssetsUsd: string;
  totalDebtUsd: string;
  nativeBalances: NativeBalance[];
  tokenBalances: TokenBalance[];
  nftHoldings: any[];
  stakingPositions: any[];
  protocolPositions: any[];
  unclaimedRewards: any[];
  transactionHistory: any[];
  quoteCurrency: string;
  lastRefreshTime: string;
  warnings: string[];
}

interface PerformanceData {
  change24h: string;
  change7d: string;
  history: Array<{ label: string; value: number }>;
}

export default function DefiPortfolioPage() {
  const { address, isConnected } = useAccount();
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChain, setSelectedChain] = useState<string>("all");
  const [quoteCurrency, setQuoteCurrency] = useState<"USD" | "INR">("USD");
  const [showHidden, setShowHidden] = useState(false);
  const [hiddenTokens, setHiddenTokens] = useState<string[]>([]);
  const [activeModule] = useState("defi");

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

  const fetchPortfolio = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const [portRes, perfRes] = await Promise.all([
        fetch(`${backendUrl}/api/v1/defi/portfolio?address=${address}&currency=${quoteCurrency}`),
        fetch(`${backendUrl}/api/v1/defi/performance?address=${address}`)
      ]);
      if (portRes.ok) {
        setPortfolio(await portRes.json());
      }
      if (perfRes.ok) {
        setPerformance(await perfRes.json());
      }
    } catch (err) {
      console.error("fetchPortfolio error:", err);
    } finally {
      setLoading(false);
    }
  }, [address, quoteCurrency, backendUrl]);

  useEffect(() => {
    if (isConnected && address) {
      fetchPortfolio();
    }
  }, [address, isConnected, quoteCurrency, fetchPortfolio]);

  const handleHideToken = async (tokenAddress: string, chainId: number) => {
    setHiddenTokens((prev) => [...prev, tokenAddress.toLowerCase()]);
    try {
      await fetch(`${backendUrl}/api/v1/defi/hide-asset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, chainId, tokenAddress })
      });
    } catch {}
  };

  const handleUnhideToken = async (tokenAddress: string, chainId: number) => {
    setHiddenTokens((prev) => prev.filter((a) => a !== tokenAddress.toLowerCase()));
    try {
      await fetch(`${backendUrl}/api/v1/defi/unhide-asset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, chainId, tokenAddress })
      });
    } catch {}
  };

  // Chain mappings
  const chainNameMap: Record<number, string> = {
    84532: "Base Sepolia",
    8453: "Base Mainnet",
    1: "Ethereum",
    137: "Polygon",
    42161: "Arbitrum",
    10: "Optimism"
  };

  // Filters
  const filteredNativeBalances = portfolio?.nativeBalances.filter((b) => 
    selectedChain === "all" || selectedChain === b.chainId.toString()
  ) || [];

  const filteredTokenBalances = portfolio?.tokenBalances.filter((t) => {
    const isChainMatch = selectedChain === "all" || selectedChain === t.chainId.toString();
    const isHidden = hiddenTokens.includes(t.contractAddress.toLowerCase()) || parseFloat(t.fiatValue) < 1.0;
    return isChainMatch && (showHidden || !isHidden);
  }) || [];

  const filteredNfts = portfolio?.nftHoldings.filter((n) =>
    selectedChain === "all" || selectedChain === n.chainId.toString()
  ) || [];

  const filteredStaking = portfolio?.stakingPositions.filter((s) =>
    selectedChain === "all" || selectedChain === s.chainId.toString()
  ) || [];

  const filteredTransactions = portfolio?.transactionHistory.filter((tx) =>
    selectedChain === "all" || selectedChain === tx.chainId.toString()
  ) || [];

  // Metrics
  const totalAssets = portfolio ? parseFloat(portfolio.totalAssetsUsd) : 0;
  const nativeTotal = filteredNativeBalances.reduce((acc, curr) => acc + parseFloat(curr.usdValue), 0);
  const tokenTotal = filteredTokenBalances.reduce((acc, curr) => acc + parseFloat(curr.fiatValue), 0);
  const stakingTotal = filteredStaking.reduce((acc, curr) => acc + parseFloat(curr.currentValueUsd), 0);
  const protocolTotal = portfolio?.protocolPositions.reduce((acc, curr) => acc + parseFloat(curr.netValueUsd), 0) || 0;

  // Percentages for allocation chart
  const nativePct = totalAssets > 0 ? (nativeTotal / totalAssets) * 100 : 0;
  const tokenPct = totalAssets > 0 ? (tokenTotal / totalAssets) * 100 : 0;
  const stakingPct = totalAssets > 0 ? (stakingTotal / totalAssets) * 100 : 0;
  const protocolPct = totalAssets > 0 ? (protocolTotal / totalAssets) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Header */}
      <header className="h-16 border-b border-white/10 bg-slate-900/40 backdrop-blur-md px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-600 p-[2px]">
            <div className="flex h-full w-full items-center justify-center rounded-[8px] bg-slate-950 text-sm font-black text-amber-400">
              W
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
                Web3 Creator Operating System
              </span>
            </div>
            <h1 className="text-sm font-bold text-white tracking-tight">WCOS DeFi Portfolio</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-900 border border-white/10 p-1.5 rounded-full text-xs">
            <Globe className="h-3.5 w-3.5 text-amber-400 ml-1.5" />
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value)}
              className="bg-transparent text-white text-[11px] font-bold outline-none pr-2 cursor-pointer"
            >
              <option value="all" className="bg-slate-950">All Chains</option>
              <option value="84532" className="bg-slate-950">Base Sepolia</option>
              <option value="8453" className="bg-slate-950">Base Mainnet</option>
              <option value="1" className="bg-slate-950">Ethereum</option>
              <option value="137" className="bg-slate-950">Polygon</option>
              <option value="42161" className="bg-slate-950">Arbitrum</option>
              <option value="10" className="bg-slate-950">Optimism</option>
            </select>
          </div>

          <div className="flex bg-slate-900 border border-white/10 p-0.5 rounded-full text-[10px] font-bold">
            <button
              onClick={() => setQuoteCurrency("USD")}
              className={`px-3 py-1.5 rounded-full transition ${quoteCurrency === "USD" ? "bg-amber-600 text-white" : "text-slate-400"}`}
            >
              USD
            </button>
            <button
              onClick={() => setQuoteCurrency("INR")}
              className={`px-3 py-1.5 rounded-full transition ${quoteCurrency === "INR" ? "bg-amber-600 text-white" : "text-slate-400"}`}
            >
              INR
            </button>
          </div>

          <SafeWalletButton showBalance={false} />
        </div>
      </header>

      {/* Main Workspace */}
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
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                activeModule === "defi"
                  ? "bg-amber-600/10 text-amber-400 border border-amber-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent"
              }`}
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
              className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent transition-all"
            >
              <span className="flex items-center gap-2.5">
                <Layers className="h-4 w-4" /> Staking Center
              </span>
              <ChevronRight className="h-3 w-3 opacity-60" />
            </button>
          </div>
        </aside>

        {/* Console Panel */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6">
          <WalletGuard requiredFeature="DeFi Portfolio Overview">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Wallet className="h-6 w-6 text-amber-400" /> DeFi Portfolio Overview
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                  Verified balance summaries, tokens, NFTs, staking positions, and classification logs.
                </p>
              </div>
              <button
                onClick={fetchPortfolio}
                disabled={loading}
                className="rounded-full bg-slate-900 border border-white/10 px-4 py-2 text-xs font-semibold hover:bg-slate-800 transition flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-amber-500" : ""}`} /> Refresh Portfolio
              </button>
            </div>

            {/* Warnings banner */}
            {portfolio?.warnings && portfolio.warnings.length > 0 && (
              <div className="rounded-2xl border border-rose-500/25 bg-rose-500/5 p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Some network syncs are delayed or unavailable</span>
                </div>
                <div className="text-[10px] text-rose-400/80 pl-6 list-disc space-y-0.5">
                  {portfolio.warnings.slice(0, 3).map((w, i) => <p key={i}>{w}</p>)}
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center p-12 text-slate-500">
                <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
              </div>
            ) : portfolio ? (
              <div className="space-y-6">
                
                {/* Net Valuation Cards */}
                <div className="grid gap-6 sm:grid-cols-4">
                  <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 space-y-1.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Net Valuation</span>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-black text-white">
                        {quoteCurrency === "USD" ? "$" : "₹"}{portfolio.netValueUsd}
                      </p>
                      {performance && parseFloat(performance.change24h) !== 0 && (
                        <span className={`inline-flex items-center text-[9px] font-bold ${parseFloat(performance.change24h) > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {parseFloat(performance.change24h) > 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                          {performance.change24h}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 space-y-1.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Staked Value</span>
                    <p className="text-2xl font-black text-white">
                      {quoteCurrency === "USD" ? "$" : "₹"}{stakingTotal.toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 space-y-1.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Token Assets</span>
                    <p className="text-2xl font-black text-white">{filteredTokenBalances.length}</p>
                  </div>
                  <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 space-y-1.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">NFT Collectibles</span>
                    <p className="text-2xl font-black text-white">{filteredNfts.length} items</p>
                  </div>
                </div>

                {/* Donut Chart & Allocation */}
                <div className="grid gap-6 md:grid-cols-[1fr_1.3fr]">
                  <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 flex flex-col items-center justify-center space-y-6">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider self-start">Asset Allocation</h3>
                    
                    <div className="relative h-44 w-44 rounded-full flex items-center justify-center" 
                      style={{ 
                        background: `conic-gradient(#f59e0b ${nativePct}%, #6366f1 ${nativePct}% ${nativePct+tokenPct}%, #ec4899 ${nativePct+tokenPct}% ${nativePct+tokenPct+stakingPct}%, #10b981 0)` 
                      }}
                    >
                      <div className="h-36 w-36 rounded-full bg-slate-950 flex flex-col items-center justify-center border border-white/5 shadow-inner">
                        <span className="text-[9px] text-slate-500 font-bold uppercase">Net Portfolio</span>
                        <span className="text-xs font-black text-white font-mono">
                          {quoteCurrency === "USD" ? "$" : "₹"}{portfolio.netValueUsd}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full text-[10px] font-semibold text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        <span>Native ({nativePct.toFixed(1)}%)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-indigo-500" />
                        <span>Tokens ({tokenPct.toFixed(1)}%)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-pink-500" />
                        <span>Staking ({stakingPct.toFixed(1)}%)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span>Protocols ({protocolPct.toFixed(1)}%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Native and Token Balances */}
                  <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 space-y-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Asset Breakdown</h3>
                      <button
                        onClick={() => setShowHidden(!showHidden)}
                        className="text-[10px] text-slate-400 hover:text-white transition flex items-center gap-1 font-bold uppercase"
                      >
                        {showHidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        {showHidden ? "Hide Spam/Low Value" : "Show Spam/Low Value"}
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                      {/* Native balances */}
                      {filteredNativeBalances.map((item, i) => (
                        <div key={`nat-${i}`} className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-white/5 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold font-mono">
                              {item.symbol}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white">Native Token ({chainNameMap[item.chainId] || `Chain ${item.chainId}`})</p>
                              <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                                {parseFloat(item.formatted).toFixed(4)} {item.symbol}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-white font-mono">
                              {quoteCurrency === "USD" ? "$" : "₹"}{item.usdValue}
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* Token balances */}
                      {filteredTokenBalances.map((token, i) => (
                        <div key={`tok-${i}`} className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-white/5 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold font-mono">
                              {token.symbol}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-bold text-white">{token.tokenName}</p>
                                {parseFloat(token.priceUsd) === 0 && (
                                  <span className="text-[8px] bg-slate-900 border border-white/10 px-1.5 py-0.5 rounded text-amber-400 font-mono">
                                    Testnet (No Price)
                                  </span>
                                )}
                              </div>
                              <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                                {parseFloat(token.formattedBalance).toFixed(4)} {token.symbol}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-xs font-bold text-white font-mono">
                                {quoteCurrency === "USD" ? "$" : "₹"}{token.fiatValue}
                              </p>
                            </div>
                            <button
                              onClick={() => handleHideToken(token.contractAddress, token.chainId)}
                              className="text-slate-600 hover:text-rose-400 transition"
                              title="Hide asset"
                            >
                              <EyeOff className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Staking Staged Positions */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 space-y-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="h-4 w-4 text-pink-400" /> Staking overview
                    </h3>
                    
                    {filteredStaking.length === 0 ? (
                      <p className="text-xs text-slate-500 py-6 text-center">No active staking stakes found on selected chains.</p>
                    ) : (
                      filteredStaking.map((pos, i) => (
                        <div key={i} className="p-4 bg-slate-950/60 border border-white/5 rounded-2xl space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-white">{pos.stakedToken} Stake</span>
                            <span className="text-[9px] bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-full text-pink-400 font-mono font-bold">
                              {pos.apySource}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                            <p>Staked: <span className="font-mono text-white font-bold">{pos.stakedAmount}</span></p>
                            <p>Value: <span className="font-mono text-white font-bold">{quoteCurrency === "USD" ? "$" : "₹"}{pos.currentValueUsd}</span></p>
                            <p>Rewards: <span className="font-mono text-emerald-400 font-bold">{pos.rewardsEarned} WGT</span></p>
                            <p>Status: <span className="font-bold text-indigo-400">{pos.status}</span></p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Staged Liquidity / Lending */}
                  <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 space-y-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Landmark className="h-4 w-4 text-emerald-400" /> Lending & Liquidity Pools
                    </h3>
                    
                    {portfolio.protocolPositions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 text-center text-slate-500">
                        <p className="text-xs">No lending or borrowing positions detected.</p>
                        <p className="text-[9px] text-slate-600 mt-1 max-w-[240px]">
                          Information is retrieved via protocol adapters. Stated data is informational and may be delayed.
                        </p>
                      </div>
                    ) : (
                      portfolio.protocolPositions.map((pos, i) => (
                        <div key={i} className="p-4 bg-slate-950/60 border border-white/5 rounded-2xl space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-white uppercase">{pos.protocolId} Position</span>
                            <span className="text-[9px] bg-slate-900 px-2 py-0.5 rounded text-slate-400 font-mono">
                              {pos.type}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                            <p>Net Worth: <span className="font-mono text-white font-bold">${pos.netValueUsd}</span></p>
                            {pos.healthFactor && <p>Health Factor: <span className="font-mono text-emerald-400 font-bold">{pos.healthFactor}</span></p>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* NFT Portfolio list */}
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">NFT Portfolio</h3>
                  {filteredNfts.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">No NFTs found on selected network.</p>
                  ) : (
                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 md:grid-cols-6">
                      {filteredNfts.map((nft, i) => (
                        <div key={i} className="rounded-2xl border border-white/5 bg-slate-950 overflow-hidden text-center p-2.5 space-y-1.5 flex flex-col justify-between">
                          <div className="aspect-square relative rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
                            {nft.imageUrl ? (
                              <img src={nft.imageUrl} alt={nft.name} className="h-full w-full object-cover" />
                            ) : (
                              <Coins className="h-8 w-8 text-slate-800" />
                            )}
                          </div>
                          <div className="space-y-0.5 text-left">
                            <p className="text-[10px] font-bold text-white truncate">{nft.name}</p>
                            <p className="text-[8px] text-slate-500 truncate">{nft.collection}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Transaction history logs */}
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-indigo-400" /> Sync Transaction Logs
                  </h3>
                  
                  {filteredTransactions.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">No indexed transactions found.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/10 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                            <th className="pb-2">Tx Hash</th>
                            <th className="pb-2">Action</th>
                            <th className="pb-2">Network</th>
                            <th className="pb-2">Method</th>
                            <th className="pb-2 text-right">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono text-[10px]">
                          {filteredTransactions.map((tx, i) => (
                            <tr key={i} className="hover:bg-white/5 transition-colors">
                              <td className="py-2.5">
                                <a
                                  href={tx.explorerUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-amber-400 underline hover:text-amber-300"
                                >
                                  {tx.hash.slice(0, 8)}...{tx.hash.slice(-6)}
                                </a>
                              </td>
                              <td className="py-2.5">
                                <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[8px] font-bold ${
                                  tx.type === "MINT" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                  tx.type === "STAKE" ? "bg-pink-500/10 text-pink-400 border border-pink-500/20" :
                                  tx.type === "SWAP" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                                  "bg-white/5 text-slate-400"
                                }`}>
                                  {tx.type === "MINT" ? <ArrowDownLeft className="h-2 w-2" /> : <ArrowUpRight className="h-2 w-2" />}
                                  {tx.type}
                                </span>
                              </td>
                              <td className="py-2.5 text-slate-400 uppercase">{chainNameMap[tx.chainId] || `Chain ${tx.chainId}`}</td>
                              <td className="py-2.5 text-slate-500">Safe Contract Call</td>
                              <td className="py-2.5 text-right font-bold text-white">
                                {tx.amount && `${tx.amount} ${tx.tokenSymbol || "ETH"}`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="p-12 border border-dashed border-white/10 rounded-3xl text-center text-slate-500 bg-slate-900/10">
                <ShieldAlert className="h-10 w-10 mx-auto mb-2 text-slate-600" />
                <p className="text-sm font-semibold">Failed to resolve portfolio records.</p>
                <p className="text-xs mt-0.5">Please check network connection or connect your active web3 wallet.</p>
              </div>
            )}
          </WalletGuard>
        </main>
      </div>

    </div>
  );
}
