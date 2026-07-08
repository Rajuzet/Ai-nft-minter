"use client";

import React, { useState, useEffect } from "react";
import { SafeWalletButton } from "../../../components/ui/SafeWalletButton";
import { WalletGuard } from "../../../components/ui/WalletGuard";
import { useAccount } from "wagmi";
import { useParams } from "next/navigation";
import {
  Users, Wallet, Compass, Coins, Layers, Sparkles, FileText, ShoppingBag, 
  ChevronRight, Activity, Cpu, Plus, Globe, ShieldAlert, Award, FileSpreadsheet, RefreshCw
} from "lucide-react";

interface DaoRecord {
  id: string;
  name: string;
  description: string;
  govType: string;
  votingToken: string;
  threshold: number;
  quorum: number;
  duration: number;
  treasuryAddress: string;
  members: string[];
  timestamp: string;
}

export default function DaoDetailPage() {
  const params = useParams();
  const daoId = params.id as string;

  const { isConnected } = useAccount();
  const [activeModule] = useState("dao");
  const [selectedChain, setSelectedChain] = useState("base-sepolia");
  const [dao, setDao] = useState<DaoRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

  const fetchDao = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/v1/daos/${daoId}`);
      if (res.ok) {
        const data = await res.json();
        setDao(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (daoId) fetchDao();
  }, [daoId]);

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

            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-2 block pt-4 mb-2">DAO governance</span>
            
            <button
              onClick={() => window.location.href = "/dao"}
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                activeModule === "dao"
                  ? "bg-teal-600/10 text-teal-400 border border-teal-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent"
              }`}
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

        {/* Central details */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6">
          <WalletGuard requiredFeature="DAO Governance">
            {loading ? (
            <div className="flex items-center justify-center p-12 text-slate-500">
              <RefreshCw className="h-8 w-8 animate-spin text-teal-500" />
            </div>
          ) : dao ? (
            <div className="space-y-6">
              
              {/* DAO Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold tracking-tight text-white">{dao.name}</h2>
                    <span className="rounded bg-teal-500/10 border border-teal-500/20 px-2.5 py-0.5 text-[10px] text-teal-400 uppercase font-mono">
                      {dao.govType}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-1">{dao.description}</p>
                </div>
                
                <button
                  onClick={() => window.location.href = `/dao/${daoId}/proposals`}
                  className="rounded-full bg-gradient-to-r from-teal-500 to-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow transition hover:opacity-95 flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="h-4 w-4" /> View Proposals Workspace
                </button>
              </div>

              {/* Stats overview */}
              <div className="grid gap-6 sm:grid-cols-3 pt-4">
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Treasury Vault Address</span>
                  <p className="text-sm font-bold text-white font-mono truncate">{dao.treasuryAddress}</p>
                </div>
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Voting Quorum</span>
                  <p className="text-base font-bold text-white font-mono">{dao.quorum}% required</p>
                </div>
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Voting Block Limit</span>
                  <p className="text-base font-bold text-white font-mono">{dao.duration} blocks</p>
                </div>
              </div>

              {/* Members Registry & Governance Configs */}
              <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
                
                {/* Member registry */}
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">DAO Member Registries</h3>
                  <div className="space-y-3">
                    {dao.members.map((member, i) => (
                      <div key={i} className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-white/5 rounded-2xl text-xs">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-bold font-mono">
                            M
                          </div>
                          <span className="font-mono text-slate-300">{member}</span>
                        </div>
                        <span className="rounded bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 text-[8px] text-teal-400 font-bold uppercase font-mono">
                          MEMBER
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Settings panel */}
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Governance Parameters</h3>
                  <div className="space-y-3 text-xs font-mono text-slate-400">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span>Propose Threshold:</span>
                      <span className="text-white font-bold">{dao.threshold} {dao.votingToken}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span>Standard Quorum:</span>
                      <span className="text-white font-bold">{dao.quorum}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Voting window:</span>
                      <span className="text-white font-bold">{dao.duration} blocks</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="p-8 border border-dashed border-white/10 rounded-3xl text-center text-slate-500">
              <ShieldAlert className="h-10 w-10 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-semibold">DAO record not found.</p>
            </div>
          )}
          </WalletGuard>
        </main>
      </div>

    </div>
  );
}
