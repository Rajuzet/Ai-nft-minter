"use client";

import React, { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import {
  Coins, Wallet, Compass, Users, Layers, Sparkles, FileText, ShoppingBag, 
  ChevronRight, Activity, Cpu, ArrowUpRight, TrendingUp, DollarSign, 
  HelpCircle, RefreshCw, Eye, ShieldAlert, Globe
} from "lucide-react";

interface PortfolioData {
  chainBalances: Array<{ chain: string; balance: string; symbol: string; usdValue: string }>;
  tokens: Array<{ symbol: string; name: string; balance: string; usdValue: string }>;
  nftHoldingsCount: number;
  totalUsdValue: string;
}

export default function DefiPortfolioPage() {
  const { address, isConnected } = useAccount();
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModule] = useState("defi");
  const [selectedChain, setSelectedChain] = useState("base-sepolia");
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

  const fetchPortfolio = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/v1/defi/portfolio?address=${address || ""}`);
      if (res.ok) {
        const data = await res.json();
        setPortfolio(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, [address]);

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

        {/* Central panel */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Portfolio Overview</h2>
              <p className="text-slate-400 text-xs mt-1">Consolidated holdings, multi-chain balances, and yields audit.</p>
            </div>
            <button
              onClick={fetchPortfolio}
              className="rounded-full bg-slate-900 border border-white/10 px-4 py-2 text-xs font-semibold hover:bg-slate-800 transition flex items-center gap-2"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh Valuation
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12 text-slate-500">
              <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
            </div>
          ) : portfolio ? (
            <div className="space-y-6">
              
              {/* Valuation Cards */}
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 space-y-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Net Valuation</span>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-black text-white">${portfolio.totalUsdValue}</p>
                    <div className="rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-[9px] text-emerald-400 font-bold flex items-center gap-0.5">
                      <TrendingUp className="h-3 w-3" /> +12.4%
                    </div>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 space-y-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Fungible Tokens</span>
                  <p className="text-2xl font-black text-white">{portfolio.tokens.length} Assets</p>
                </div>
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 space-y-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">NFT Collectibles</span>
                  <p className="text-2xl font-black text-white">{portfolio.nftHoldingsCount} items</p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
                {/* Tokens balances list */}
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Fungible Balances</h3>
                  <div className="space-y-3">
                    {portfolio.tokens.map((token, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-slate-950/60 border border-white/5 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold font-mono">
                            {token.symbol[0]}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{token.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{token.balance} {token.symbol}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-white font-mono">${token.usdValue}</p>
                          <span className="text-[9px] text-slate-500">18 Decimals</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chain Balances */}
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Multi-Chain Distribution</h3>
                  <div className="space-y-3">
                    {portfolio.chainBalances.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-white/5 rounded-2xl text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-cyan-400" />
                          <span className="text-slate-300 font-bold uppercase">{item.chain}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-white">{item.balance} {item.symbol}</p>
                          <p className="text-[9px] text-slate-500 mt-0.5">${item.usdValue} USD</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Staking & Yield overview */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Bridge placeholder */}
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 relative overflow-hidden flex flex-col justify-between h-48">
                  <div>
                    <h4 className="text-sm font-bold text-white">Cross-Chain Bridge</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Bridge native tokens to Base Sepolia L2 and mainnet networks seamlessly.
                    </p>
                  </div>
                  <span className="absolute bottom-4 right-4 rounded-full bg-amber-500/10 border border-amber-500/25 px-3 py-1 text-[10px] font-bold text-amber-400">
                    Bridge module coming soon
                  </span>
                </div>

                {/* Liquidity pools placeholder */}
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 relative overflow-hidden flex flex-col justify-between h-48">
                  <div>
                    <h4 className="text-sm font-bold text-white">AMM Liquidity Pools</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Provide liquidity to active pools (ETH/WGT, USDC/WGT) to earn swap trading fees.
                    </p>
                  </div>
                  <span className="absolute bottom-4 right-4 rounded-full bg-teal-500/10 border border-teal-500/25 px-3 py-1 text-[10px] font-bold text-teal-400">
                    Liquidity pools coming soon
                  </span>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-8 border border-dashed border-white/10 rounded-3xl text-center text-slate-500">
              <ShieldAlert className="h-10 w-10 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-semibold">Failed to resolve portfolio records.</p>
              <p className="text-xs mt-0.5">Please check network connection or connect your active web3 wallet.</p>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
