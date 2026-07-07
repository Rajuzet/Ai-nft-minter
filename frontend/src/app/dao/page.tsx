"use client";

import React, { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import {
  Users, Wallet, Compass, Coins, Layers, Sparkles, FileText, ShoppingBag, 
  ChevronRight, Activity, Cpu, Plus, Globe, ShieldAlert, Award, RefreshCw
} from "lucide-react";

interface DaoRecord {
  id: string;
  name: string;
  description: string;
  govType: string;
  votingToken: string;
  treasuryAddress: string;
  members: string[];
  timestamp: string;
}

export default function DaoListPage() {
  const { isConnected } = useAccount();
  const [activeModule] = useState("dao");
  const [selectedChain, setSelectedChain] = useState("base-sepolia");
  const [daos, setDaos] = useState<DaoRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

  const fetchDaos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/v1/daos`);
      if (res.ok) {
        const data = await res.json();
        setDaos(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDaos();
  }, []);

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

        {/* Central DAO registries */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <Users className="h-6 w-6 text-teal-400" /> DAO Governance Center
              </h2>
              <p className="text-slate-400 text-xs mt-1">Review, vote, and propose protocol upgrades and community treasury funding.</p>
            </div>
            <button
              onClick={() => window.location.href = "/dao/create"}
              className="rounded-full bg-gradient-to-r from-teal-500 to-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow transition hover:opacity-95"
            >
              Launch new DAO
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12 text-slate-500">
              <RefreshCw className="h-8 w-8 animate-spin text-teal-500" />
            </div>
          ) : daos.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-3xl text-slate-500">
              <Users className="h-12 w-12 mb-3 text-slate-600" />
              <p className="text-sm font-semibold">No DAOs registered.</p>
              <p className="text-xs text-slate-500 mt-1">Use the DAO Builder wizard to initialize voting policies for your collection.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {daos.map((dao) => (
                <div
                  key={dao.id}
                  onClick={() => window.location.href = `/dao/${dao.id}`}
                  className="rounded-3xl border border-white/5 bg-slate-900/30 p-6 space-y-4 hover:border-teal-500/30 transition duration-200 cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-bold text-white truncate">{dao.name}</h4>
                      <span className="rounded bg-teal-500/10 border border-teal-500/20 px-2.5 py-0.5 text-[9px] text-teal-400 uppercase font-mono">
                        {dao.govType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{dao.description}</p>
                  </div>

                  <div className="pt-4 border-t border-white/5 space-y-2 text-[10px] font-mono text-slate-500">
                    <div className="flex justify-between">
                      <span>Voting Token:</span>
                      <span className="text-slate-300 font-bold">{dao.votingToken}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Members:</span>
                      <span className="text-slate-300 font-bold">{dao.members.length} members</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Treasury vault:</span>
                      <span className="text-slate-500 truncate max-w-[120px]">{dao.treasuryAddress}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
