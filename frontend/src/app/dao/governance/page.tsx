"use client";

import React, { useEffect, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { SafeWalletButton } from "../../../components/ui/SafeWalletButton";
import { WalletGuard } from "../../../components/ui/WalletGuard";
import { ChainSelector } from "../../../components/ui/ChainSelector";
import {
  Coins, ChevronRight, Cpu, Plus, Vote, BarChart3,
  Zap, CheckCircle2, Loader2, ArrowRight, ExternalLink,
  History, Users, AlertTriangle
} from "lucide-react";
import { useGovernanceToken } from "../../../lib/useGovernanceToken";
import { getGovernanceConfig, isGovernanceDeployed, getGovExplorerTxUrl } from "../../../lib/web3/governanceConfig";

export default function GovernanceDashboardPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const govConfig = getGovernanceConfig(chainId);
  const governanceDeployed = isGovernanceDeployed(chainId);
  const govToken = useGovernanceToken();

  const [delegateeInput, setDelegateeInput] = useState("");
  const [history, setHistory] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

  useEffect(() => {
    if (isConnected && address && governanceDeployed) {
      govToken.refetch();
    }
  }, [isConnected, address, chainId]);

  useEffect(() => {
    if (!address) return;
    setLoadingHistory(true);
    fetch(`${apiUrl}/api/v1/governance/wallet/${address}/history`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setHistory(data); })
      .catch(() => null)
      .finally(() => setLoadingHistory(false));
  }, [address, apiUrl]);

  const handleSelfDelegate = async () => {
    await govToken.selfDelegate();
  };

  const handleDelegateTo = async () => {
    if (!delegateeInput || !delegateeInput.startsWith("0x") || delegateeInput.length !== 42) {
      alert("Please enter a valid Ethereum address (0x...)");
      return;
    }
    await govToken.delegate(delegateeInput as `0x${string}`);
  };

  const delegateStatusDisplay = () => {
    switch (govToken.delegateStatus) {
      case "AWAITING_SIGNATURE": return <span className="text-yellow-400 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Awaiting signature...</span>;
      case "PENDING": return <span className="text-blue-400 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Transaction pending...</span>;
      case "CONFIRMED": return <span className="text-green-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Delegation confirmed!</span>;
      case "ERROR": return <span className="text-rose-400 text-xs">{govToken.delegateError}</span>;
      default: return null;
    }
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
            <h1 className="text-sm font-bold text-white tracking-tight">Token & Delegation</h1>
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
          <button onClick={() => window.location.href = "/dao/governance"} className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold bg-teal-600/10 text-teal-400 border border-teal-500/20 transition-all">
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

        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6">

          {!governanceDeployed && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 flex items-start gap-4">
              <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300">Governance not deployed on <strong>{govConfig.chainName}</strong>. Switch to Base Sepolia to use governance features.</p>
            </div>
          )}

          <div>
            <h2 className="text-xl font-bold text-white">WGT Token & Delegation</h2>
            <p className="text-xs text-slate-400 mt-0.5">Delegate your WGT tokens to activate voting power for governance proposals.</p>
          </div>

          <WalletGuard requiredFeature="Token Delegation">
            <div className="space-y-6">

              {/* Token Summary */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "WGT Balance", value: `${parseFloat(govToken.tokenBalanceFormatted).toLocaleString(undefined, { maximumFractionDigits: 4 })} WGT`, sub: "Total tokens held", color: "text-white" },
                  { label: "Voting Power", value: `${parseFloat(govToken.votingPowerFormatted).toLocaleString(undefined, { maximumFractionDigits: 4 })} WGT`, sub: govToken.isSelfDelegated ? "Active ✓" : "Inactive — delegate to activate", color: "text-teal-400" },
                  { label: "Checkpoints", value: govToken.numCheckpoints.toString(), sub: "On-chain voting snapshots", color: "text-indigo-400" },
                ].map(({ label, value, sub, color }) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
                    <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-2">{label}</p>
                    <p className={`text-xl font-bold font-mono ${color}`}>{govToken.isLoading ? "..." : value}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{sub}</p>
                  </div>
                ))}
              </div>

              {/* Current Delegate */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
                <h3 className="text-sm font-semibold text-white mb-3">Current Delegation</h3>
                {govToken.currentDelegate ? (
                  <div className="flex items-center justify-between rounded-xl bg-slate-950/60 border border-white/5 px-4 py-3">
                    <div>
                      <p className="text-xs font-mono text-slate-300">{govToken.currentDelegate}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {govToken.isSelfDelegated ? "Self-delegated (voting active)" : "Delegated to external address"}
                      </p>
                    </div>
                    {govToken.isSelfDelegated && <CheckCircle2 className="h-4 w-4 text-green-400" />}
                  </div>
                ) : (
                  <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 px-4 py-3">
                    <p className="text-xs text-amber-300">No delegation active. Delegate to yourself or another address to enable voting.</p>
                  </div>
                )}
              </div>

              {/* Delegation Actions */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 space-y-4">
                <h3 className="text-sm font-semibold text-white">Delegate Voting Power</h3>

                {/* Self delegate */}
                <div className="flex items-center gap-4 rounded-xl bg-slate-950/60 border border-white/5 p-4">
                  <Zap className="h-8 w-8 text-teal-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-white">Self-delegate</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Activate your own WGT tokens as voting power. Most common action.</p>
                  </div>
                  <button
                    onClick={handleSelfDelegate}
                    disabled={!governanceDeployed || govToken.delegateStatus === "AWAITING_SIGNATURE" || govToken.delegateStatus === "PENDING"}
                    className="flex-shrink-0 rounded-full bg-gradient-to-r from-teal-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                  >
                    {govToken.isSelfDelegated ? "Re-delegate Self" : "Self-Delegate"}
                  </button>
                </div>

                {/* Delegate to address */}
                <div className="rounded-xl bg-slate-950/60 border border-white/5 p-4 space-y-3">
                  <p className="text-xs font-semibold text-white">Delegate to an address</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={delegateeInput}
                      onChange={e => setDelegateeInput(e.target.value)}
                      placeholder="0x..."
                      className="flex-1 rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-teal-400 font-mono"
                    />
                    <button
                      onClick={handleDelegateTo}
                      disabled={!governanceDeployed || !delegateeInput || govToken.delegateStatus === "AWAITING_SIGNATURE" || govToken.delegateStatus === "PENDING"}
                      className="rounded-full border border-teal-500/40 px-4 py-2.5 text-xs font-semibold text-teal-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-teal-500/10 transition-all"
                    >
                      Delegate
                    </button>
                  </div>
                </div>

                {/* Delegate status */}
                <div className="text-xs h-5 flex items-center">{delegateStatusDisplay()}</div>

                {/* Tx link */}
                {govToken.delegateTxHash && (
                  <a
                    href={getGovExplorerTxUrl(chainId, govToken.delegateTxHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 transition-colors"
                  >
                    View transaction <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {/* Voting History */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <History className="h-4 w-4 text-slate-400" /> Your Governance Activity
                </h3>
                {loadingHistory && <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-slate-950/50 rounded-xl animate-pulse" />)}</div>}
                {!loadingHistory && !history && <p className="text-xs text-slate-500">No governance activity found.</p>}
                {!loadingHistory && history && (
                  <div className="space-y-4">
                    {history.votes?.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-2">Recent Votes ({history.votes.length})</p>
                        <div className="space-y-1.5">
                          {history.votes.slice(0, 5).map((v: any) => (
                            <div key={v.id} className="flex items-center justify-between rounded-lg bg-slate-950/60 border border-white/5 px-3 py-2 text-xs">
                              <span className="text-slate-300 truncate max-w-[60%]">{v.proposalTitle || `Proposal #${v.proposalId}`}</span>
                              <div className="flex items-center gap-2">
                                <span className={`font-semibold ${v.support ? "text-green-400" : "text-rose-400"}`}>{v.support ? "FOR" : "AGAINST"}</span>
                                {v.transactionHash && (
                                  <a href={getGovExplorerTxUrl(chainId, v.transactionHash)} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-teal-400">
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {history.proposals?.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-2">Created Proposals ({history.proposals.length})</p>
                        <div className="space-y-1.5">
                          {history.proposals.slice(0, 3).map((p: any) => (
                            <button
                              key={p.id}
                              onClick={() => window.location.href = `/dao/proposals/${p.id}`}
                              className="w-full flex items-center justify-between rounded-lg bg-slate-950/60 border border-white/5 px-3 py-2 text-xs hover:bg-slate-900/50 transition-colors"
                            >
                              <span className="text-slate-300 truncate max-w-[70%]">{p.title}</span>
                              <span className="text-slate-500">{p.status}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {history.votes?.length === 0 && history.proposals?.length === 0 && (
                      <p className="text-xs text-slate-500">No governance activity yet. Start by delegating your tokens and voting on proposals.</p>
                    )}
                  </div>
                )}
              </div>

            </div>
          </WalletGuard>
        </main>
      </div>
    </div>
  );
}
