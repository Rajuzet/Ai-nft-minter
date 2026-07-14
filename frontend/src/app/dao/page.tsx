"use client";

import React, { useEffect, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { SafeWalletButton } from "../../components/ui/SafeWalletButton";
import { WalletGuard } from "../../components/ui/WalletGuard";
import { ChainSelector } from "../../components/ui/ChainSelector";
import {
  Users, ChevronRight, Cpu, Plus, Vote, BarChart3,
  ShieldAlert, Zap, Clock, CheckCircle2, XCircle,
  Activity, Coins, RefreshCw, ExternalLink, ArrowRight
} from "lucide-react";
import { useGovernanceToken } from "../../lib/useGovernanceToken";
import { getGovernanceConfig, isGovernanceDeployed, PROPOSAL_STATE_COLORS } from "../../lib/web3/governanceConfig";

export default function DaoPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const govConfig = getGovernanceConfig(chainId);
  const governanceDeployed = isGovernanceDeployed(chainId);
  const govToken = useGovernanceToken();

  const [analytics, setAnalytics] = useState<any>(null);
  const [recentProposals, setRecentProposals] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

  useEffect(() => {
    if (!governanceDeployed || hasFetched) return;
    setLoadingData(true);
    setHasFetched(true);
    Promise.all([
      fetch(`${apiUrl}/api/v1/governance/analytics?chainId=${chainId}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${apiUrl}/api/v1/governance/proposals?chainId=${chainId}&limit=5`).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([analyticsData, proposalsData]) => {
      if (analyticsData) setAnalytics(analyticsData);
      if (proposalsData?.proposals) setRecentProposals(proposalsData.proposals);
    }).finally(() => setLoadingData(false));
  }, [chainId, governanceDeployed, apiUrl, hasFetched]);

  useEffect(() => {
    if (isConnected && address && governanceDeployed) {
      govToken.refetch();
    }
  }, [isConnected, address, chainId, governanceDeployed]);

  const statusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === "ACTIVE") return "text-teal-400 bg-teal-500/10 border-teal-500/20";
    if (s === "SUCCEEDED") return "text-green-400 bg-green-500/10 border-green-500/20";
    if (s === "DEFEATED") return "text-rose-400 bg-rose-500/10 border-rose-500/20";
    if (s === "EXECUTED") return "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
    if (s === "CANCELED") return "text-slate-400 bg-slate-500/10 border-slate-500/20";
    return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">

      {/* Header */}
      <header className="h-16 border-b border-white/10 bg-slate-900/40 backdrop-blur-md px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 p-[2px]">
            <div className="flex h-full w-full items-center justify-center rounded-[8px] bg-slate-950 text-sm font-black text-cyan-400">W</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] bg-gradient-to-r from-cyan-400 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent">Web3 Creator Operating System</div>
            <h1 className="text-sm font-bold text-white tracking-tight">WCOS DAO Governance</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ChainSelector />
          <SafeWalletButton showBalance={false} />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">

        {/* Sidebar */}
        <aside className="w-64 border-r border-white/5 bg-slate-950 flex flex-col p-4 space-y-1 flex-shrink-0">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-2 block mb-3">Creator Console</span>
          <button onClick={() => window.location.href = "/dashboard"} className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent transition-all">
            <span className="flex items-center gap-2.5"><Cpu className="h-4 w-4" /> Creator Dashboard</span>
            <ChevronRight className="h-3 w-3 opacity-60" />
          </button>

          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-2 block pt-4 mb-2">DAO Governance</span>

          <button onClick={() => window.location.href = "/dao"} className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold bg-teal-600/10 text-teal-400 border border-teal-500/20 transition-all">
            <span className="flex items-center gap-2.5"><BarChart3 className="h-4 w-4" /> Governance Overview</span>
            <ChevronRight className="h-3 w-3 opacity-60" />
          </button>

          <button onClick={() => window.location.href = "/dao/governance"} className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent transition-all">
            <span className="flex items-center gap-2.5"><Coins className="h-4 w-4" /> Token & Delegation</span>
            <ChevronRight className="h-3 w-3 opacity-60" />
          </button>

          <button onClick={() => window.location.href = "/dao/proposals/create"} className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent transition-all">
            <span className="flex items-center gap-2.5"><Plus className="h-4 w-4" /> Create Proposal</span>
            <ChevronRight className="h-3 w-3 opacity-60" />
          </button>

          <button onClick={() => window.location.href = "/dao/1/proposals"} className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent transition-all">
            <span className="flex items-center gap-2.5"><Vote className="h-4 w-4" /> All Proposals</span>
            <ChevronRight className="h-3 w-3 opacity-60" />
          </button>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6">

          {/* Network Guard */}
          {!governanceDeployed && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 flex items-start gap-4">
              <ShieldAlert className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-400">Governance Not Deployed on {govConfig.chainName}</p>
                <p className="text-xs text-slate-400 mt-1">WCOS DAO governance is currently available on Base Sepolia. Switch your network to access governance features.</p>
              </div>
            </div>
          )}

          {/* Page header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">WCOS DAO Governance</h2>
              <p className="text-xs text-slate-400 mt-0.5">{govConfig.chainName} · {govConfig.status}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.location.href = "/dao/proposals/create"}
                disabled={!governanceDeployed}
                className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-teal-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                <Plus className="h-3.5 w-3.5" /> New Proposal
              </button>
            </div>
          </div>

          {/* Your Governance Power */}
          {isConnected && governanceDeployed && (
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">Your Governance Power</h3>
                <button onClick={() => govToken.refetch()} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors">
                  <RefreshCw className={`h-3 w-3 ${govToken.isLoading ? "animate-spin" : ""}`} /> Refresh
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl bg-slate-950/60 p-4 border border-white/5">
                  <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1">WGT Balance</p>
                  <p className="text-lg font-bold text-white font-mono">{parseFloat(govToken.tokenBalanceFormatted).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">WGT tokens held</p>
                </div>
                <div className="rounded-xl bg-slate-950/60 p-4 border border-white/5">
                  <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1">Voting Power</p>
                  <p className="text-lg font-bold text-teal-400 font-mono">{parseFloat(govToken.votingPowerFormatted).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{govToken.isSelfDelegated ? "Self-delegated ✓" : "Not delegated — activate voting power"}</p>
                </div>
                <div className="rounded-xl bg-slate-950/60 p-4 border border-white/5">
                  <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1">Delegate</p>
                  <p className="text-sm font-mono text-slate-300 truncate">{govToken.currentDelegate ? `${govToken.currentDelegate.slice(0, 6)}...${govToken.currentDelegate.slice(-4)}` : "—"}</p>
                  <button
                    onClick={() => window.location.href = "/dao/governance"}
                    className="mt-1.5 text-[10px] text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
                  >
                    Manage delegation <ArrowRight className="h-2.5 w-2.5" />
                  </button>
                </div>
              </div>
              {!govToken.isSelfDelegated && govToken.tokenBalance > BigInt(0) && (
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                  <Zap className="h-4 w-4 text-amber-400 flex-shrink-0" />
                  <p className="text-xs text-amber-300">Your tokens are not delegated. <button onClick={() => window.location.href = "/dao/governance"} className="underline hover:text-amber-200">Delegate to yourself</button> to activate voting power.</p>
                </div>
              )}
            </div>
          )}

          {/* Analytics */}
          {governanceDeployed && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total Proposals", value: analytics?.totalProposals ?? "—", icon: Activity, color: "text-indigo-400" },
                { label: "Active", value: analytics?.activeProposals ?? "—", icon: Clock, color: "text-teal-400" },
                { label: "Executed", value: analytics?.executedProposals ?? "—", icon: CheckCircle2, color: "text-green-400" },
                { label: "Unique Voters", value: analytics?.uniqueVoters ?? "—", icon: Users, color: "text-fuchsia-400" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">{label}</p>
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                  <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Recent Proposals */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Recent Proposals</h3>
              <button onClick={() => window.location.href = "/dao/1/proposals"} className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors">
                View all <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {!governanceDeployed && (
              <p className="text-xs text-slate-500 py-4 text-center">Governance not deployed on this network.</p>
            )}

            {governanceDeployed && loadingData && (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-slate-950/50 animate-pulse" />
                ))}
              </div>
            )}

            {governanceDeployed && !loadingData && recentProposals.length === 0 && (
              <div className="text-center py-8">
                <Vote className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No proposals yet.</p>
                <button
                  onClick={() => window.location.href = "/dao/proposals/create"}
                  className="mt-3 text-xs text-teal-400 hover:text-teal-300 underline"
                >
                  Create the first proposal
                </button>
              </div>
            )}

            {governanceDeployed && !loadingData && recentProposals.length > 0 && (
              <div className="space-y-2">
                {recentProposals.map((proposal) => (
                  <button
                    key={proposal.id}
                    onClick={() => window.location.href = `/dao/proposals/${proposal.id}`}
                    className="w-full flex items-center justify-between rounded-xl border border-white/5 bg-slate-950/50 px-4 py-3 hover:bg-slate-900/50 transition-colors text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white truncate">{proposal.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {proposal.onChainProposalId ? `#${proposal.onChainProposalId}` : "Pending"} · {proposal.voteCount} votes
                      </p>
                    </div>
                    <span className={`flex-shrink-0 ml-3 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadge(proposal.status)}`}>
                      {proposal.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Contract Info */}
          {governanceDeployed && (
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 backdrop-blur-xl">
              <h3 className="text-sm font-bold text-white mb-3">Contract Addresses</h3>
              <div className="space-y-2 text-xs font-mono">
                {[
                  { label: "Governor", address: govConfig.governorContract },
                  { label: "Gov Token", address: govConfig.governanceToken },
                  { label: "Treasury", address: govConfig.treasuryContract },
                ].map(({ label, address }) => (
                  <div key={label} className="flex items-center justify-between rounded-lg bg-slate-950/60 border border-white/5 px-3 py-2">
                    <span className="text-slate-400">{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-300">{address ? `${address.slice(0, 8)}...${address.slice(-6)}` : "Not deployed"}</span>
                      {address && address !== "0x0000000000000000000000000000000000000000" && (
                        <a
                          href={`${govConfig.explorerUrl}/address/${address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-500 hover:text-teal-400 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
