"use client";

import React, { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useParams } from "next/navigation";
import {
  Users, Wallet, Compass, Coins, Layers, Sparkles, FileText, ShoppingBag, 
  ChevronRight, Activity, Cpu, Plus, Globe, ShieldAlert, Award, FileSpreadsheet,
  CheckCircle2, RefreshCw, X, ArrowUpRight, HelpCircle
} from "lucide-react";

interface ProposalRecord {
  id: string;
  daoId: string;
  title: string;
  description: string;
  targetAddress: string;
  valueTransferred: string;
  forVotes: number;
  againstVotes: number;
  status: 'ACTIVE' | 'DEFEATED' | 'SUCCEEDED' | 'EXECUTED';
  startBlock: number;
  endBlock: number;
  timestamp: string;
}

export default function DaoProposalsPage() {
  const params = useParams();
  const daoId = params.id as string;

  const { address, isConnected } = useAccount();
  const [activeModule] = useState("dao-proposals");
  const [selectedChain, setSelectedChain] = useState("base-sepolia");
  const [proposals, setProposals] = useState<ProposalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Proposal Creation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newValue, setNewValue] = useState("0");

  const [votingOnPropId, setVotingOnPropId] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/v1/daos/${daoId}/proposals`);
      if (res.ok) {
        const data = await res.json();
        setProposals(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (daoId) fetchProposals();
  }, [daoId]);

  const handleCreateProposal = async () => {
    if (!newTitle || !newDesc) return;
    try {
      const response = await fetch(`${backendUrl}/api/v1/daos/${daoId}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          targetAddress: newTarget || "0x0000000000000000000000000000000000000000",
          valueTransferred: newValue
        })
      });

      if (response.ok) {
        setIsModalOpen(false);
        setNewTitle("");
        setNewDesc("");
        setNewTarget("");
        setNewValue("0");
        fetchProposals();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const castVote = async (propId: string, support: boolean) => {
    if (!isConnected || !address) return;
    setVotingOnPropId(propId);
    setIsVoting(true);

    // Mock voting weight
    const voteWeight = 1000; 

    setTimeout(async () => {
      try {
        const response = await fetch(`${backendUrl}/api/v1/daos/proposals/${propId}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            voter: address,
            support,
            weight: voteWeight
          })
        });

        if (response.ok) {
          fetchProposals();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsVoting(false);
        setVotingOnPropId(null);
      }
    }, 1500);
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
            <h1 className="text-sm font-bold text-white tracking-tight">WCOS DAO Governance</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-slate-900 border border-white/10 p-1.5 rounded-full text-xs">
            <Globe className="h-3.5 w-3.5 text-teal-400 ml-1.5" />
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

            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-2 block pt-4 mb-2">DAO governance</span>
            
            <button
              onClick={() => window.location.href = "/dao"}
              className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent transition-all"
            >
              <span className="flex items-center gap-2.5">
                <Users className="h-4 w-4" /> DAO Registries
              </span>
              <ChevronRight className="h-3 w-3 opacity-60" />
            </button>

            <button
              onClick={() => window.location.href = "/dao/create"}
              className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent transition-all"
            >
              <span className="flex items-center gap-2.5">
                <Plus className="h-4 w-4" /> Create DAO
              </span>
              <ChevronRight className="h-3 w-3 opacity-60" />
            </button>
          </div>
        </aside>

        {/* Central proposals listing */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">DAO Proposals Workspace</h2>
              <p className="text-slate-400 text-xs mt-1">Review active proposals and cast votes with checkpoint weight delegations.</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="rounded-full bg-gradient-to-r from-teal-500 to-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow transition hover:opacity-95 flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> Create Proposal
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12 text-slate-500">
              <RefreshCw className="h-8 w-8 animate-spin text-teal-500" />
            </div>
          ) : proposals.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-3xl text-slate-500">
              <FileSpreadsheet className="h-12 w-12 mb-3 text-slate-600" />
              <p className="text-sm font-semibold">No proposals found.</p>
              <p className="text-xs text-slate-500 mt-1">Click Create Proposal to launch a voting round.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {proposals.map((prop) => (
                <div key={prop.id} className="p-6 rounded-3xl border border-white/5 bg-slate-900/30 space-y-4 shadow-lg flex flex-col justify-between">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-white">{prop.title}</h4>
                        <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold ${
                          prop.status === 'ACTIVE' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20 animate-pulse' : 'bg-slate-950 text-slate-500 border-white/5'
                        }`}>
                          {prop.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">{prop.description}</p>
                    </div>

                    {/* Vote progress */}
                    <div className="bg-slate-950 border border-white/5 p-4 rounded-2xl w-full md:w-64 space-y-2.5 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-teal-400 font-bold">For:</span>
                        <span className="text-white font-bold">{prop.forVotes} votes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-rose-400 font-bold">Against:</span>
                        <span className="text-white font-bold">{prop.againstVotes} votes</span>
                      </div>
                    </div>
                  </div>

                  {prop.status === "ACTIVE" && (
                    <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center gap-3">
                      {votingOnPropId === prop.id && isVoting ? (
                        <div className="flex items-center gap-2 text-xs text-teal-400 font-semibold animate-pulse py-2">
                          <RefreshCw className="h-4 w-4 animate-spin" /> Submitting vote confirmation...
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => castVote(prop.id, true)}
                            className="w-full sm:w-auto rounded-full bg-teal-600/10 border border-teal-500/20 text-teal-400 px-6 py-2 text-xs font-bold hover:bg-teal-500/15 transition"
                          >
                            Vote For
                          </button>
                          <button
                            onClick={() => castVote(prop.id, false)}
                            className="w-full sm:w-auto rounded-full bg-rose-600/10 border border-rose-500/20 text-rose-400 px-6 py-2 text-xs font-bold hover:bg-rose-500/15 transition"
                          >
                            Vote Against
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </main>
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold text-white">Create Proposal</h3>
            
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 uppercase font-bold">Proposal Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-teal-500"
                placeholder="e.g. Adjust Core parameters"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 uppercase font-bold">Details</label>
              <textarea
                rows={3}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-teal-500"
                placeholder="Details of the voted upgrade..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase font-bold">Target Address</label>
                <input
                  type="text"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-teal-500 font-mono"
                  placeholder="0x..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase font-bold">Value Transferred (Wei)</label>
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-teal-500 font-mono"
                />
              </div>
            </div>

            <button
              onClick={handleCreateProposal}
              className="w-full rounded-full bg-gradient-to-r from-teal-500 to-indigo-600 py-3.5 text-xs font-semibold text-white transition hover:opacity-95"
            >
              Submit Proposal
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
