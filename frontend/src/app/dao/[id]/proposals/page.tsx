"use client";

import React, { useEffect, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { SafeWalletButton } from "../../../../components/ui/SafeWalletButton";
import { ChainSelector } from "../../../../components/ui/ChainSelector";
import {
  ChevronRight, Cpu, Plus, Vote, BarChart3, Coins,
  ThumbsUp, ThumbsDown, Clock, CheckCircle2, XCircle,
  Loader2, AlertTriangle, ArrowRight, RefreshCw
} from "lucide-react";
import { useGovernanceProposals } from "../../../../lib/useGovernanceProposals";
import { getGovernanceConfig, isGovernanceDeployed, PROPOSAL_STATE_COLORS, PROPOSAL_STATE_LABELS } from "../../../../lib/web3/governanceConfig";

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Active", value: "ACTIVE" },
  { label: "Succeeded", value: "SUCCEEDED" },
  { label: "Executed", value: "EXECUTED" },
  { label: "Defeated", value: "DEFEATED" },
  { label: "Canceled", value: "CANCELED" },
];

export default function DaoProposalsPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const govConfig = getGovernanceConfig(chainId);
  const governanceDeployed = isGovernanceDeployed(chainId);

  const gov = useGovernanceProposals();

  const formatBigTokens = (raw: string) => {
    try {
      const b = BigInt(raw);
      const whole = b / BigInt("1000000000000000000");
      return Number(whole).toLocaleString();
    } catch { return "0"; }
  };

  const statusBadgeClass = (status: string) => {
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

      <header className="h-16 border-b border-white/10 bg-slate-900/40 backdrop-blur-md px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 p-[2px]">
            <div className="flex h-full w-full items-center justify-center rounded-[8px] bg-slate-950 text-sm font-black text-cyan-400">W</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] bg-gradient-to-r from-cyan-400 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent">Web3 Creator Operating System</div>
            <h1 className="text-sm font-bold text-white tracking-tight">Governance Proposals</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ChainSelector />
          <SafeWalletButton showBalance={false} />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 border-r border-white/5 bg-slate-950 flex flex-col p-4 space-y-1 flex-shrink-0">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-2 block mb-3">Creator Console</span>
          <button onClick={() => window.location.href = "/dashboard"} className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent transition-all">
            <span className="flex items-center gap-2.5"><Cpu className="h-4 w-4" /> Creator Dashboard</span>
            <ChevronRight className="h-3 w-3 opacity-60" />
          </button>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-2 block pt-4 mb-2">DAO Governance</span>
          <button onClick={() => window.location.href = "/dao"} className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent transition-all">
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
          <button onClick={() => window.location.href = "/dao/1/proposals"} className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold bg-teal-600/10 text-teal-400 border border-teal-500/20 transition-all">
            <span className="flex items-center gap-2.5"><Vote className="h-4 w-4" /> All Proposals</span>
            <ChevronRight className="h-3 w-3 opacity-60" />
          </button>
        </aside>

        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-5">

          {!governanceDeployed && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 flex items-start gap-4">
              <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300">Governance not deployed on <strong>{govConfig.chainName}</strong>. Switch to Base Sepolia to view proposals.</p>
            </div>
          )}

          {/* Header row */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold text-white">Proposals</h2>
              <p className="text-xs text-slate-400 mt-0.5">{gov.total} total on {govConfig.chainName}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => gov.refetch()} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white border border-white/10 rounded-full px-3 py-1.5 transition-all hover:bg-slate-900/50">
                <RefreshCw className={`h-3 w-3 ${gov.isLoading ? "animate-spin" : ""}`} /> Refresh
              </button>
              <button
                onClick={() => window.location.href = "/dao/proposals/create"}
                disabled={!governanceDeployed}
                className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-teal-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                <Plus className="h-3.5 w-3.5" /> New Proposal
              </button>
            </div>
          </div>

          {/* Status filter tabs */}
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => { gov.setStatusFilter(f.value); gov.setPage(1); }}
                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider border transition-all ${
                  gov.statusFilter === f.value
                    ? "bg-teal-500/10 border-teal-500/30 text-teal-400"
                    : "border-white/10 text-slate-500 hover:text-white hover:border-white/20"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Proposal list */}
          {gov.isLoading && (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-slate-900/40 animate-pulse border border-white/5" />)}
            </div>
          )}

          {!gov.isLoading && gov.error && (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 text-xs text-rose-400">{gov.error}</div>
          )}

          {!gov.isLoading && !gov.error && gov.proposals.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-10 text-center">
              <Vote className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No proposals found.</p>
              <button onClick={() => window.location.href = "/dao/proposals/create"} className="mt-4 text-xs text-teal-400 hover:text-teal-300 underline">
                Create the first proposal
              </button>
            </div>
          )}

          {!gov.isLoading && !gov.error && gov.proposals.length > 0 && (
            <div className="space-y-3">
              {gov.proposals.map(p => {
                const forV = BigInt(p.forVotes);
                const againstV = BigInt(p.againstVotes);
                const total = forV + againstV;
                const forPct = total > BigInt(0) ? Number((forV * BigInt(10000)) / total) / 100 : 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => window.location.href = `/dao/proposals/${p.id}`}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/40 p-5 hover:bg-slate-900/60 transition-all text-left group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {p.onChainProposalId && <span className="font-mono text-[10px] text-slate-500">#{p.onChainProposalId}</span>}
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadgeClass(p.status)}`}>{p.status}</span>
                          <span className="text-[10px] text-slate-600 uppercase font-bold">{p.category}</span>
                        </div>
                        <h3 className="text-sm font-semibold text-white group-hover:text-teal-300 transition-colors">{p.title}</h3>
                        {p.summary && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{p.summary}</p>}
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                          <span className="flex items-center gap-1"><ThumbsUp className="h-2.5 w-2.5 text-green-500" />{formatBigTokens(p.forVotes)} WGT</span>
                          <span className="flex items-center gap-1"><ThumbsDown className="h-2.5 w-2.5 text-rose-500" />{formatBigTokens(p.againstVotes)} WGT</span>
                          <span>{p.voteCount} vote transactions</span>
                          {p.deadlineBlock && <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />Block {p.deadlineBlock}</span>}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-teal-400 flex-shrink-0 mt-1 transition-colors" />
                    </div>
                    {total > BigInt(0) && (
                      <div className="mt-3 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${forPct}%` }} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {gov.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => gov.setPage(Math.max(1, gov.page - 1))}
                disabled={gov.page === 1}
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-400 disabled:opacity-40 hover:border-white/20 hover:text-white transition-all"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500">Page {gov.page} of {gov.totalPages}</span>
              <button
                onClick={() => gov.setPage(Math.min(gov.totalPages, gov.page + 1))}
                disabled={gov.page === gov.totalPages}
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-400 disabled:opacity-40 hover:border-white/20 hover:text-white transition-all"
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
