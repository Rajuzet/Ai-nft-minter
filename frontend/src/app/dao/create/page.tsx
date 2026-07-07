"use client";

import React, { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import {
  Users, Wallet, Compass, Coins, Layers, Sparkles, FileText, ShoppingBag, 
  ChevronRight, Activity, Cpu, Plus, Globe, ShieldAlert, Award
} from "lucide-react";

export default function DaoCreatePage() {
  const { address } = useAccount();
  const [activeModule] = useState("dao-create");
  const [selectedChain, setSelectedChain] = useState("base-sepolia");

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [govType, setGovType] = useState("Token-weighted");
  const [votingToken, setVotingToken] = useState("WGT");
  const [threshold, setThreshold] = useState(100);
  const [quorum, setQuorum] = useState(10);
  const [duration, setDuration] = useState(5760); // blocks (~1 day)
  const [treasuryAddress, setTreasuryAddress] = useState("");

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

  const handleCreateDao = async () => {
    if (!name || !desc) {
      alert("Name and description are required.");
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/v1/daos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: desc,
          govType,
          votingToken,
          threshold: Number(threshold),
          quorum: Number(quorum),
          duration: Number(duration),
          treasuryAddress: treasuryAddress || address || "0x0000000000000000000000000000000000000000"
        })
      });

      if (response.ok) {
        window.location.href = "/dao";
      }
    } catch (err) {
      console.error(err);
    }
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
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                activeModule === "dao-create"
                  ? "bg-teal-600/10 text-teal-400 border border-teal-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Plus className="h-4 w-4" /> Create DAO
              </span>
              <ChevronRight className="h-3 w-3 opacity-60" />
            </button>
          </div>
        </aside>

        {/* Central creation form */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 flex items-center justify-center">
          
          <div className="max-w-xl w-full rounded-3xl border border-white/10 bg-slate-900/40 p-8 space-y-5 shadow-2xl backdrop-blur-xl">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-teal-400" /> Create new DAO organization
              </h3>
              <p className="text-slate-400 text-xs mt-1">Configure proposal rules, voting quorums, thresholds, and treasury rules.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase block">DAO Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-teal-400"
                  placeholder="e.g. WCOS Core DAO"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase block">Governance Mechanism</label>
                <select
                  value={govType}
                  onChange={(e) => setGovType(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-teal-400"
                >
                  <option value="Token-weighted">ERC-20 Token-weighted</option>
                  <option value="NFT-weighted">NFT-holder weighted</option>
                  <option value="Multisig">Creator Multisig</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold uppercase block">DAO Description</label>
              <textarea
                rows={2}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-teal-400"
                placeholder="Describe the mission and objectives of this DAO..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase block">Proposal Threshold</label>
                <input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(parseInt(e.target.value) || 0)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-teal-400"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase block">Quorum %</label>
                <input
                  type="number"
                  value={quorum}
                  onChange={(e) => setQuorum(parseInt(e.target.value) || 0)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-teal-400"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase block">Voting Token Symbol</label>
                <input
                  type="text"
                  value={votingToken}
                  onChange={(e) => setVotingToken(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-teal-400 font-mono"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase block">Voting duration (Blocks)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 5760)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-teal-400"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase block">Treasury address</label>
                <input
                  type="text"
                  value={treasuryAddress}
                  onChange={(e) => setTreasuryAddress(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-teal-400 font-mono"
                  placeholder="0x..."
                />
              </div>
            </div>

            <button
              onClick={handleCreateDao}
              className="w-full rounded-full bg-gradient-to-r from-teal-500 to-indigo-600 py-3.5 text-xs font-semibold text-white shadow-lg hover:opacity-95"
            >
              Deploy & Initialize DAO Governance
            </button>
          </div>

        </main>
      </div>

    </div>
  );
}
