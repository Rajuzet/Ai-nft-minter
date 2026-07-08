"use client";

import React, { useState, useEffect } from "react";
import { SafeWalletButton } from "../../components/ui/SafeWalletButton";
import { WalletGuard } from "../../components/ui/WalletGuard";
import { useAccount } from "wagmi";
import {
  BarChart2, TrendingUp, DollarSign, Cpu, ChevronRight, RefreshCw,
  Globe, Users, Zap, Award, ShoppingBag, Sparkles, ArrowUpRight,
  FileText, Layers, Coins, Activity, Package
} from "lucide-react";

interface TimeSeriesPoint { label: string; value: number; }

interface Analytics {
  overview: {
    totalRevenue: string;
    totalRoyalties: string;
    totalNftsMinted: number;
    totalCollections: number;
    totalVolume: string;
    avgSalePrice: string;
  };
  revenueTimeSeries: TimeSeriesPoint[];
  mintingTimeSeries: TimeSeriesPoint[];
  royaltiesTimeSeries: TimeSeriesPoint[];
  collectionBreakdown: Array<{ name: string; minted: number; volume: string; royalties: string; floorPrice: string }>;
  audienceMetrics: { uniqueHolders: number; repeatBuyers: number; avgHoldDuration: string; topChain: string };
  topSales: Array<{ tokenId: string; collection: string; salePrice: string; buyer: string; timestamp: string }>;
}

// ── Mini Bar Chart ────────────────────────────────────────────────────────────
function MiniBarChart({ data, color = "indigo" }: { data: TimeSeriesPoint[]; color?: string }) {
  const max = Math.max(...data.map((d) => d.value));
  const colorMap: Record<string, string> = {
    indigo: "bg-indigo-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    cyan: "bg-cyan-500",
  };
  const bg = colorMap[color] || colorMap.indigo;

  return (
    <div className="flex items-end gap-1 h-20 w-full">
      {data.map((d, i) => {
        const heightPct = max > 0 ? (d.value / max) * 100 : 0;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-full rounded-t-sm ${bg} opacity-80 hover:opacity-100 transition-all`}
              style={{ height: `${Math.max(heightPct, 4)}%` }}
              title={`${d.label}: ${d.value}`}
            />
            <span className="text-[8px] text-slate-600 font-mono">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsDashboardPage() {
  const { address, isConnected } = useAccount();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [globalMetrics, setGlobalMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChain, setSelectedChain] = useState("base-sepolia");

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [analyticsRes, globalRes] = await Promise.all([
        fetch(`${backendUrl}/api/v1/analytics/creator?address=${address || ""}`),
        fetch(`${backendUrl}/api/v1/analytics/global`),
      ]);
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      if (globalRes.ok) setGlobalMetrics(await globalRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, [address]);

  const overviewCards = analytics ? [
    { label: "Total Revenue", value: analytics.overview.totalRevenue, icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { label: "Royalties Earned", value: analytics.overview.totalRoyalties, icon: Award, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    { label: "NFTs Minted", value: analytics.overview.totalNftsMinted.toString(), icon: Sparkles, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
    { label: "Active Collections", value: analytics.overview.totalCollections.toString(), icon: Package, color: "text-fuchsia-400", bg: "bg-fuchsia-500/10 border-fuchsia-500/20" },
    { label: "Total Volume", value: analytics.overview.totalVolume, icon: BarChart2, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
    { label: "Avg Sale Price", value: analytics.overview.avgSalePrice, icon: TrendingUp, color: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/20" },
  ] : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Header */}
      <header className="h-16 border-b border-white/10 bg-slate-900/40 backdrop-blur-md px-6 flex items-center justify-between z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 p-[2px]">
            <div className="flex h-full w-full items-center justify-center rounded-[8px] bg-slate-950 text-sm font-black text-cyan-400">W</div>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] bg-gradient-to-r from-cyan-400 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent">
              Web3 Creator Operating System
            </span>
            <h1 className="text-sm font-bold text-white tracking-tight">Creator Analytics</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-slate-900 border border-white/10 p-1.5 rounded-full text-xs">
            <Globe className="h-3.5 w-3.5 text-indigo-400 ml-1.5" />
            <select value={selectedChain} onChange={(e) => setSelectedChain(e.target.value)}
              className="bg-transparent text-white text-[11px] font-bold outline-none pr-2 cursor-pointer">
              <option value="base-sepolia" className="bg-slate-950">Base Sepolia</option>
              <option value="base-mainnet" className="bg-slate-950">Base Mainnet</option>
            </select>
          </div>
          <SafeWalletButton showBalance={false} />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">

        {/* Sidebar */}
        <aside className="w-64 border-r border-white/5 bg-slate-950 flex flex-col p-4 space-y-1 flex-shrink-0">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-2 block mb-3">Creator Console</span>
          {[
            { href: "/dashboard", icon: Cpu, label: "Creator Dashboard" },
            { href: "/analytics", icon: BarChart2, label: "Analytics", active: true },
            { href: "/defi", icon: Coins, label: "DeFi Center" },
            { href: "/dao", icon: Users, label: "DAO Governance" },
          ].map((item) => (
            <button key={item.href}
              onClick={() => window.location.href = item.href}
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                item.active
                  ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent"
              }`}
            >
              <span className="flex items-center gap-2.5"><item.icon className="h-4 w-4" /> {item.label}</span>
              <ChevronRight className="h-3 w-3 opacity-60" />
            </button>
          ))}
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6">
          <WalletGuard requiredFeature="Creator Intelligence Dashboard">

          {/* Page title + refresh */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <BarChart2 className="h-6 w-6 text-indigo-400" /> Creator Intelligence Dashboard
              </h2>
              <p className="text-slate-400 text-xs mt-1">Revenue trends, royalty earnings, minting velocity, and audience growth.</p>
            </div>
            <button onClick={fetchAnalytics}
              className="rounded-full bg-slate-900 border border-white/10 px-4 py-2 text-xs font-semibold hover:bg-slate-800 transition flex items-center gap-2">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh Data
            </button>
          </div>

          {/* Platform Banner */}
          {globalMetrics && (
            <div className="rounded-3xl border border-white/5 bg-gradient-to-r from-indigo-500/10 via-slate-900/40 to-fuchsia-500/10 p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
              {[
                { label: "Platform Creators", value: globalMetrics.totalCreators?.toLocaleString() },
                { label: "NFTs Minted", value: globalMetrics.totalNftsMinted?.toLocaleString() },
                { label: "Total Volume", value: globalMetrics.totalVolume },
                { label: "Active Listings", value: globalMetrics.activeListings?.toLocaleString() },
                { label: "Active DAOs", value: globalMetrics.activeDAOs },
                { label: "Top Collection", value: globalMetrics.topCollection },
              ].map((item, i) => (
                <div key={i} className="space-y-0.5">
                  <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">{item.label}</p>
                  <p className="text-xs font-black text-white truncate">{item.value}</p>
                </div>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center p-20 text-slate-500">
              <RefreshCw className="h-10 w-10 animate-spin text-indigo-500" />
            </div>
          ) : analytics ? (
            <div className="space-y-6">

              {/* Overview KPI Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {overviewCards.map((card, i) => (
                  <div key={i} className="rounded-2xl border border-white/5 bg-slate-900/30 p-4 space-y-2">
                    <div className={`h-8 w-8 rounded-xl border flex items-center justify-center ${card.bg}`}>
                      <card.icon className={`h-4 w-4 ${card.color}`} />
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{card.label}</p>
                    <p className="text-base font-black text-white truncate">{card.value}</p>
                  </div>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid gap-6 lg:grid-cols-3">
                {[
                  { title: "Revenue (USD)", data: analytics.revenueTimeSeries, color: "emerald" },
                  { title: "NFTs Minted", data: analytics.mintingTimeSeries, color: "cyan" },
                  { title: "Royalties (USD)", data: analytics.royaltiesTimeSeries, color: "amber" },
                ].map((chart) => (
                  <div key={chart.title} className="rounded-3xl border border-white/5 bg-slate-900/20 p-5 space-y-3">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">{chart.title}</h3>
                    <MiniBarChart data={chart.data} color={chart.color} />
                  </div>
                ))}
              </div>

              {/* Collections + Audience Grid */}
              <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">

                {/* Collection Breakdown */}
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Collection Breakdown</h3>
                  <div className="space-y-2">
                    {analytics.collectionBreakdown.map((col, i) => (
                      <div key={i} className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-white/5 rounded-2xl text-xs">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-sm">
                            #{i + 1}
                          </div>
                          <div>
                            <p className="font-bold text-white">{col.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{col.minted} items · Floor {col.floorPrice}</p>
                          </div>
                        </div>
                        <div className="text-right space-y-0.5">
                          <p className="font-bold text-white text-[10px] font-mono">{col.volume}</p>
                          <p className="text-[9px] text-amber-400 font-mono">{col.royalties} royalties</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audience Metrics */}
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Audience Intelligence</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Unique Holders", value: analytics.audienceMetrics.uniqueHolders, color: "text-cyan-400" },
                      { label: "Repeat Buyers", value: analytics.audienceMetrics.repeatBuyers, color: "text-emerald-400" },
                      { label: "Avg Hold Duration", value: analytics.audienceMetrics.avgHoldDuration, color: "text-amber-400" },
                      { label: "Top Network", value: analytics.audienceMetrics.topChain, color: "text-indigo-400" },
                    ].map((item, i) => (
                      <div key={i} className="rounded-2xl bg-slate-950/60 border border-white/5 p-3.5 space-y-1">
                        <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">{item.label}</p>
                        <p className={`text-base font-black ${item.color}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Sales Ledger */}
              <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Top Sale Events</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-white/5">
                        <th className="text-left pb-3">Token ID</th>
                        <th className="text-left pb-3">Collection</th>
                        <th className="text-left pb-3">Sale Price</th>
                        <th className="text-left pb-3">Buyer</th>
                        <th className="text-left pb-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {analytics.topSales.map((sale, i) => (
                        <tr key={i} className="group hover:bg-slate-900/40 transition">
                          <td className="py-3 text-indigo-400 font-bold">{sale.tokenId}</td>
                          <td className="py-3 text-white">{sale.collection}</td>
                          <td className="py-3 text-emerald-400 font-bold">{sale.salePrice}</td>
                          <td className="py-3 text-slate-500 truncate max-w-[120px]">{sale.buyer}</td>
                          <td className="py-3 text-slate-500">{sale.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-12 border border-dashed border-white/10 rounded-3xl text-center text-slate-500">
              <BarChart2 className="h-10 w-10 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-semibold">Failed to load analytics data.</p>
              <p className="text-xs mt-0.5">Connect your wallet or check backend connection.</p>
            </div>
          )}
          </WalletGuard>
        </main>
      </div>
    </div>
  );
}
