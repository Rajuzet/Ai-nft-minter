"use client";

import React, { useEffect, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { SafeWalletButton } from "../../../../components/ui/SafeWalletButton";
import { WalletGuard } from "../../../../components/ui/WalletGuard";
import { ChainSelector } from "../../../../components/ui/ChainSelector";
import {
  ChevronRight, Cpu, Plus, Vote, BarChart3, Coins,
  FileText, Loader2, CheckCircle2, ExternalLink,
  AlertTriangle, ArrowLeft, Info
} from "lucide-react";
import { useGovernanceProposals } from "../../../../lib/useGovernanceProposals";
import { useGovernanceToken } from "../../../../lib/useGovernanceToken";
import { getGovernanceConfig, isGovernanceDeployed, getGovExplorerTxUrl } from "../../../../lib/web3/governanceConfig";

export default function CreateProposalPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const govConfig = getGovernanceConfig(chainId);
  const governanceDeployed = isGovernanceDeployed(chainId);
  const govToken = useGovernanceToken();
  const govProposals = useGovernanceProposals();

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [proposalType, setProposalType] = useState("INFORMATIONAL");
  const [targetAddress, setTargetAddress] = useState("");
  const [calldata, setCalldata] = useState("0x");
  const [ethValue, setEthValue] = useState("0");
  const [createdProposalId, setCreatedProposalId] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && address && governanceDeployed) {
      govToken.refetch();
    }
  }, [isConnected, address, chainId]);

  const hasTokens = govToken.tokenBalance > BigInt(0);
  const hasVotingPower = govToken.votingPower > BigInt(0) || hasTokens; // contract allows balance fallback

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      alert("Title and description are required.");
      return;
    }
    if (!hasTokens) {
      alert("You must hold WGT governance tokens to create a proposal.");
      return;
    }

    const result = await govProposals.createProposal({
      title: title.trim(),
      summary: summary.trim() || undefined,
      description: description.trim(),
      category,
      proposalType,
      target: (targetAddress && targetAddress.startsWith("0x"))
        ? targetAddress as `0x${string}`
        : undefined,
      value: ethValue && parseFloat(ethValue) > 0
        ? BigInt(Math.floor(parseFloat(ethValue) * 1e18))
        : BigInt(0),
      calldata: (calldata && calldata !== "0x")
        ? calldata as `0x${string}`
        : undefined,
    });

    if (result) {
      setCreatedProposalId(result);
    }
  };

  const statusDisplay = () => {
    switch (govProposals.createProposalStatus) {
      case "AWAITING_SIGNATURE":
        return <div className="flex items-center gap-2 text-yellow-400"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-xs">Awaiting wallet signature...</span></div>;
      case "PENDING":
        return <div className="flex items-center gap-2 text-blue-400"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-xs">Transaction pending...</span></div>;
      case "CONFIRMED":
        return <div className="flex items-center gap-2 text-green-400"><CheckCircle2 className="h-4 w-4" /><span className="text-xs">Proposal created on-chain!</span></div>;
      case "ERROR":
        return <div className="text-rose-400 text-xs">{govProposals.createProposalError}</div>;
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
            <h1 className="text-sm font-bold text-white tracking-tight">Create Proposal</h1>
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
          <button onClick={() => window.location.href = "/dao/proposals/create"} className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold bg-teal-600/10 text-teal-400 border border-teal-500/20 transition-all">
            <span className="flex items-center gap-2.5"><Plus className="h-4 w-4" /> Create Proposal</span>
            <ChevronRight className="h-3 w-3 opacity-60" />
          </button>
          <button onClick={() => window.location.href = "/dao/1/proposals"} className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent transition-all">
            <span className="flex items-center gap-2.5"><Vote className="h-4 w-4" /> All Proposals</span>
            <ChevronRight className="h-3 w-3 opacity-60" />
          </button>
        </aside>

        <main className="flex-1 overflow-y-auto bg-slate-950 p-6">
          <WalletGuard requiredFeature="Proposal Creation">

            {/* Network guard */}
            {!governanceDeployed && (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 mb-6 flex items-start gap-4">
                <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300">Governance is not deployed on <strong>{govConfig.chainName}</strong>. Switch to Base Sepolia to create proposals.</p>
              </div>
            )}

            {/* Success State */}
            {govProposals.createProposalStatus === "CONFIRMED" && createdProposalId && (
              <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-6 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle2 className="h-6 w-6 text-green-400" />
                  <h3 className="text-sm font-bold text-green-400">Proposal Created On-Chain</h3>
                </div>
                <p className="text-xs text-slate-400 mb-1">On-chain Proposal ID: <span className="font-mono text-white">#{createdProposalId}</span></p>
                {govProposals.createProposalTxHash && (
                  <a
                    href={getGovExplorerTxUrl(chainId, govProposals.createProposalTxHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 mt-2"
                  >
                    View on explorer <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <div className="flex gap-2 mt-4">
                  <button onClick={() => window.location.href = "/dao/1/proposals"} className="rounded-full bg-gradient-to-r from-teal-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white">
                    View All Proposals
                  </button>
                  <button onClick={() => { setTitle(""); setSummary(""); setDescription(""); setCreatedProposalId(null); }} className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900/40">
                    Create Another
                  </button>
                </div>
              </div>
            )}

            {govProposals.createProposalStatus !== "CONFIRMED" && (
              <div className="max-w-2xl space-y-5">

                <div className="flex items-center gap-3 mb-2">
                  <button onClick={() => window.location.href = "/dao"} className="text-slate-500 hover:text-white transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <h2 className="text-xl font-bold text-white">Create Governance Proposal</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Proposals are submitted on-chain via WcosGovernor. Requires WGT token balance.</p>
                  </div>
                </div>

                {/* Token check warning */}
                {!govToken.isLoading && !hasTokens && isConnected && (
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0" />
                    <p className="text-xs text-rose-300">You need WGT governance tokens to create a proposal. Your current balance is 0.</p>
                  </div>
                )}

                {/* Informational notice */}
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3 flex items-start gap-3">
                  <Info className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-400">
                    <p className="font-semibold text-indigo-300 mb-0.5">How this works</p>
                    <p>Submitting this form calls <code className="text-indigo-300">WcosGovernor.propose()</code> on-chain. The proposal ID and voting period are set by the contract. Voting duration: ~{govConfig.votingDurationBlocksHint} blocks. Quorum: {govConfig.quorumPercentHint}% of total supply.</p>
                  </div>
                </div>

                {/* Form */}
                <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 space-y-5 backdrop-blur-xl">

                  {/* Title */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">Proposal Title <span className="text-rose-400">*</span></label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      maxLength={120}
                      placeholder="e.g. Upgrade WCOS treasury allocation Q3 2025"
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-teal-400 placeholder-slate-600"
                    />
                  </div>

                  {/* Summary */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">Short Summary</label>
                    <input
                      type="text"
                      value={summary}
                      onChange={e => setSummary(e.target.value)}
                      maxLength={240}
                      placeholder="One sentence description for proposal list view"
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-teal-400 placeholder-slate-600"
                    />
                  </div>

                  {/* Category + Type */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">Category</label>
                      <select value={category} onChange={e => setCategory(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-teal-400">
                        <option value="GENERAL">General</option>
                        <option value="TREASURY">Treasury</option>
                        <option value="PROTOCOL">Protocol Upgrade</option>
                        <option value="GRANTS">Grants</option>
                        <option value="COMMUNITY">Community</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">Proposal Type</label>
                      <select value={proposalType} onChange={e => setProposalType(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-teal-400">
                        <option value="INFORMATIONAL">Informational (no on-chain action)</option>
                        <option value="EXECUTABLE">Executable (calls contract)</option>
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">Full Description <span className="text-rose-400">*</span></label>
                    <textarea
                      rows={5}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Describe the motivation, specification, and expected impact of this proposal..."
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-teal-400 placeholder-slate-600 resize-none"
                    />
                  </div>

                  {/* Executable fields */}
                  {proposalType === "EXECUTABLE" && (
                    <div className="rounded-xl bg-indigo-500/5 border border-indigo-500/20 p-4 space-y-3">
                      <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Execution Parameters</p>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">Target Contract Address</label>
                        <input
                          type="text"
                          value={targetAddress}
                          onChange={e => setTargetAddress(e.target.value)}
                          placeholder="0x..."
                          className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-400 font-mono placeholder-slate-600"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">ETH Value (optional)</label>
                          <input
                            type="number"
                            value={ethValue}
                            onChange={e => setEthValue(e.target.value)}
                            placeholder="0"
                            min="0"
                            step="0.001"
                            className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-400"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">Calldata (hex)</label>
                          <input
                            type="text"
                            value={calldata}
                            onChange={e => setCalldata(e.target.value)}
                            placeholder="0x..."
                            className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-400 font-mono placeholder-slate-600"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit */}
                  <div className="pt-1 space-y-3">
                    <button
                      onClick={handleSubmit}
                      disabled={
                        !governanceDeployed ||
                        !hasTokens ||
                        !title.trim() ||
                        !description.trim() ||
                        govProposals.createProposalStatus === "AWAITING_SIGNATURE" ||
                        govProposals.createProposalStatus === "PENDING"
                      }
                      className="w-full rounded-full bg-gradient-to-r from-teal-500 to-indigo-600 py-3.5 text-xs font-semibold text-white shadow-lg hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                    >
                      {govProposals.createProposalStatus === "AWAITING_SIGNATURE" || govProposals.createProposalStatus === "PENDING"
                        ? "Submitting..."
                        : "Submit Proposal On-Chain"
                      }
                    </button>
                    <div className="h-5">{statusDisplay()}</div>
                  </div>
                </div>
              </div>
            )}

          </WalletGuard>
        </main>
      </div>
    </div>
  );
}
