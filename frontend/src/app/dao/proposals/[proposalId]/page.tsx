"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAccount, useChainId } from "wagmi";
import { SafeWalletButton } from "../../../../components/ui/SafeWalletButton";
import { WalletGuard } from "../../../../components/ui/WalletGuard";
import { ChainSelector } from "../../../../components/ui/ChainSelector";
import {
  ChevronRight, Cpu, Plus, Vote, BarChart3, Coins,
  Loader2, CheckCircle2, XCircle, ExternalLink,
  AlertTriangle, ArrowLeft, ThumbsUp, ThumbsDown,
  Clock, Zap, RefreshCw
} from "lucide-react";
import { useGovernanceVoting } from "../../../../lib/useGovernanceVoting";
import { useGovernanceProposals } from "../../../../lib/useGovernanceProposals";
import { useGovernanceToken } from "../../../../lib/useGovernanceToken";
import { getGovernanceConfig, isGovernanceDeployed, getGovExplorerTxUrl, PROPOSAL_STATE_LABELS, PROPOSAL_STATE_COLORS, estimateBlockTimestamp } from "../../../../lib/web3/governanceConfig";
import { usePublicClient } from "wagmi";

interface Props {
  params: Promise<{ proposalId: string }>;
}

export default function ProposalDetailPage({ params }: Props) {
  const resolvedParams = React.use(params);
  const proposalId = resolvedParams.proposalId;

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const govConfig = getGovernanceConfig(chainId);
  const governanceDeployed = isGovernanceDeployed(chainId);
  const publicClient = usePublicClient();

  const govVoting = useGovernanceVoting();
  const govProposals = useGovernanceProposals();
  const govToken = useGovernanceToken();

  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chainState, setChainState] = useState<number>(-1);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [currentBlock, setCurrentBlock] = useState<bigint>(BigInt(0));
  const [endBlockDate, setEndBlockDate] = useState<Date | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

  const fetchProposal = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/v1/governance/proposals/${proposalId}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setProposal(data);

      // Get live chain state if governance deployed
      if (governanceDeployed && data.onChainProposalId !== null && data.onChainProposalId !== undefined) {
        const state = await govProposals.getProposalState(BigInt(data.onChainProposalId));
        setChainState(state);
      }
    } catch (e) {
      setProposal(null);
    } finally {
      setLoading(false);
    }
  }, [proposalId, apiUrl, governanceDeployed, govProposals]);

  const checkVotedStatus = useCallback(async () => {
    if (!address || !proposal?.onChainProposalId || !governanceDeployed) return;
    const voted = await govVoting.hasVoted(BigInt(proposal.onChainProposalId), address);
    setAlreadyVoted(voted);
  }, [address, proposal, governanceDeployed, govVoting]);

  useEffect(() => { fetchProposal(); }, [fetchProposal]);
  useEffect(() => { checkVotedStatus(); }, [checkVotedStatus]);

  useEffect(() => {
    if (isConnected && address && governanceDeployed) {
      govToken.refetch();
    }
  }, [isConnected, address, chainId]);

  useEffect(() => {
    if (!publicClient || !proposal?.deadlineBlock) return;
    publicClient.getBlockNumber().then(bn => {
      setCurrentBlock(bn);
      const deadline = parseInt(proposal.deadlineBlock);
      if (!isNaN(deadline)) {
        const est = estimateBlockTimestamp(deadline, Number(bn), Date.now(), chainId);
        setEndBlockDate(est);
      }
    }).catch(() => {});
  }, [publicClient, proposal, chainId]);

  const handleVote = async (support: boolean) => {
    if (!proposal?.onChainProposalId) return;
    await govVoting.castVote(BigInt(proposal.onChainProposalId), support);
    if (govVoting.voteStatus === "CONFIRMED" || true) {
      await fetchProposal();
      await checkVotedStatus();
    }
  };

  const handleExecute = async () => {
    if (!proposal?.onChainProposalId) return;
    await govProposals.executeProposal(BigInt(proposal.onChainProposalId));
    await fetchProposal();
  };

  const handleCancel = async () => {
    if (!proposal?.onChainProposalId) return;
    if (!confirm("Are you sure you want to cancel this proposal? This cannot be undone.")) return;
    await govProposals.cancelProposal(BigInt(proposal.onChainProposalId));
    await fetchProposal();
  };

  const isProposer = address && proposal?.proposer && address.toLowerCase() === proposal.proposer.toLowerCase();
  const effectiveState = chainState >= 0 ? chainState : -1;
  const stateLabel = effectiveState >= 0 ? (PROPOSAL_STATE_LABELS[effectiveState] || proposal?.status) : proposal?.status;
  const stateColor = effectiveState >= 0 ? (PROPOSAL_STATE_COLORS[effectiveState] || "") : "";

  const forVotes = BigInt(proposal?.forVotes || "0");
  const againstVotes = BigInt(proposal?.againstVotes || "0");
  const totalVotes = forVotes + againstVotes;
  const forPct = totalVotes > BigInt(0) ? Number((forVotes * BigInt(10000)) / totalVotes) / 100 : 0;
  const againstPct = totalVotes > BigInt(0) ? Number((againstVotes * BigInt(10000)) / totalVotes) / 100 : 0;

  const formatBigTokens = (raw: bigint) => {
    const whole = raw / BigInt(1e18.toString());
    return Number(whole).toLocaleString();
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
            <h1 className="text-sm font-bold text-white tracking-tight">Proposal Detail</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ChainSelector />
          <SafeWalletButton showBalance={false} />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 border-r border-white/5 bg-slate-950 flex flex-col p-4 space-y-1 flex-shrink-0">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-2 block mb-3">DAO Governance</span>
          <button onClick={() => window.location.href = "/dao"} className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent transition-all">
            <span className="flex items-center gap-2.5"><BarChart3 className="h-4 w-4" /> Governance Overview</span>
            <ChevronRight className="h-3 w-3 opacity-60" />
          </button>
          <button onClick={() => window.location.href = "/dao/governance"} className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent transition-all">
            <span className="flex items-center gap-2.5"><Coins className="h-4 w-4" /> Token & Delegation</span>
            <ChevronRight className="h-3 w-3 opacity-60" />
          </button>
          <button onClick={() => window.location.href = "/dao/1/proposals"} className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent transition-all">
            <span className="flex items-center gap-2.5"><Vote className="h-4 w-4" /> All Proposals</span>
            <ChevronRight className="h-3 w-3 opacity-60" />
          </button>
        </aside>

        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-5">

          <button onClick={() => window.location.href = "/dao/1/proposals"} className="flex items-center gap-2 text-xs text-slate-500 hover:text-white transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> All proposals
          </button>

          {loading && (
            <div className="space-y-4">
              <div className="h-8 w-1/2 bg-slate-900/50 rounded-xl animate-pulse" />
              <div className="h-40 bg-slate-900/50 rounded-2xl animate-pulse" />
            </div>
          )}

          {!loading && !proposal && (
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-8 text-center">
              <XCircle className="h-8 w-8 text-rose-400 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Proposal not found.</p>
            </div>
          )}

          {!loading && proposal && (
            <>
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {proposal.onChainProposalId !== null && (
                      <span className="font-mono text-xs text-slate-500">#{proposal.onChainProposalId}</span>
                    )}
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${stateColor}`}>
                      {stateLabel}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider border border-slate-700 rounded-full px-2 py-0.5">{proposal.category}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider border border-slate-700 rounded-full px-2 py-0.5">{proposal.proposalType}</span>
                  </div>
                  <h2 className="text-xl font-bold text-white">{proposal.title}</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Proposed by <span className="font-mono text-slate-300">{proposal.proposer?.slice(0, 8)}...{proposal.proposer?.slice(-6)}</span>
                    {proposal.snapshotBlock && <> · Snapshot block: <span className="font-mono">{proposal.snapshotBlock}</span></>}
                    {proposal.deadlineBlock && <> · End block: <span className="font-mono">{proposal.deadlineBlock}</span></>}
                    {endBlockDate && <> · Est. ends: <span className="text-slate-300">{endBlockDate.toLocaleString()}</span></>}
                  </p>
                </div>
                <button onClick={fetchProposal} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors flex-shrink-0">
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </button>
              </div>

              {/* Vote Results */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 backdrop-blur-xl">
                <h3 className="text-sm font-bold text-white mb-4">Vote Results</h3>
                <div className="space-y-3">
                  {/* For */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-green-400 font-semibold flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> For</span>
                      <span className="text-green-400 font-mono">{formatBigTokens(forVotes)} WGT ({forPct.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${forPct}%` }} />
                    </div>
                  </div>
                  {/* Against */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-rose-400 font-semibold flex items-center gap-1"><ThumbsDown className="h-3 w-3" /> Against</span>
                      <span className="text-rose-400 font-mono">{formatBigTokens(againstVotes)} WGT ({againstPct.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full transition-all" style={{ width: `${againstPct}%` }} />
                    </div>
                  </div>
                  {/* Quorum */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-white/5">
                    <span>Quorum: {govConfig.quorumPercentHint}% of total supply required</span>
                    <span className="font-mono">{proposal.voteCount} vote transactions</span>
                  </div>
                </div>
              </div>

              {/* Voting Actions */}
              {isConnected && governanceDeployed && effectiveState === 1 && (
                <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 backdrop-blur-xl">
                  <h3 className="text-sm font-bold text-white mb-3">Cast Your Vote</h3>
                  {alreadyVoted ? (
                    <div className="flex items-center gap-2 text-green-400 text-xs">
                      <CheckCircle2 className="h-4 w-4" /> You have already voted on this proposal.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-400">Your voting power: <span className="font-mono text-white">{parseFloat(govToken.votingPowerFormatted).toLocaleString()} WGT</span></p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleVote(true)}
                          disabled={govVoting.voteStatus === "AWAITING_SIGNATURE" || govVoting.voteStatus === "PENDING"}
                          className="flex-1 flex items-center justify-center gap-2 rounded-full bg-green-500/10 border border-green-500/30 py-3 text-xs font-semibold text-green-400 hover:bg-green-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          {govVoting.voteStatus === "AWAITING_SIGNATURE" || govVoting.voteStatus === "PENDING"
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <ThumbsUp className="h-3.5 w-3.5" />}
                          Vote For
                        </button>
                        <button
                          onClick={() => handleVote(false)}
                          disabled={govVoting.voteStatus === "AWAITING_SIGNATURE" || govVoting.voteStatus === "PENDING"}
                          className="flex-1 flex items-center justify-center gap-2 rounded-full bg-rose-500/10 border border-rose-500/30 py-3 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          {govVoting.voteStatus === "AWAITING_SIGNATURE" || govVoting.voteStatus === "PENDING"
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <ThumbsDown className="h-3.5 w-3.5" />}
                          Vote Against
                        </button>
                      </div>
                      {govVoting.voteStatus === "AWAITING_SIGNATURE" && <p className="text-xs text-yellow-400">Awaiting wallet signature...</p>}
                      {govVoting.voteStatus === "PENDING" && (
                        <div className="text-xs text-blue-400 flex items-center gap-1.5">
                          <Loader2 className="h-3 w-3 animate-spin" /> Confirming on-chain...
                          {govVoting.explorerUrl && <a href={govVoting.explorerUrl} target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300 ml-1 flex items-center gap-0.5">View <ExternalLink className="h-3 w-3" /></a>}
                        </div>
                      )}
                      {govVoting.voteStatus === "CONFIRMED" && (
                        <div className="text-xs text-green-400 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3 w-3" /> Vote confirmed on-chain!
                          {govVoting.voteTxHash && <a href={getGovExplorerTxUrl(chainId, govVoting.voteTxHash)} target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300 ml-1 flex items-center gap-0.5">View tx <ExternalLink className="h-3 w-3" /></a>}
                        </div>
                      )}
                      {govVoting.voteStatus === "ERROR" && <p className="text-xs text-rose-400">{govVoting.voteError}</p>}
                    </div>
                  )}
                </div>
              )}

              {/* Execute / Cancel */}
              {isConnected && governanceDeployed && (
                <div className="flex gap-3 flex-wrap">
                  {effectiveState === 3 && (
                    <button
                      onClick={handleExecute}
                      disabled={govProposals.executeStatus === "AWAITING_SIGNATURE" || govProposals.executeStatus === "PENDING"}
                      className="flex items-center gap-2 rounded-full bg-gradient-to-r from-green-500 to-teal-600 px-5 py-2.5 text-xs font-semibold text-white shadow disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                    >
                      {govProposals.executeStatus === "AWAITING_SIGNATURE" || govProposals.executeStatus === "PENDING"
                        ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Executing...</>
                        : <><Zap className="h-3.5 w-3.5" /> Execute Proposal</>}
                    </button>
                  )}
                  {(effectiveState === 0 || effectiveState === 1) && isProposer && (
                    <button
                      onClick={handleCancel}
                      disabled={govProposals.cancelStatus === "AWAITING_SIGNATURE" || govProposals.cancelStatus === "PENDING"}
                      className="flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-5 py-2.5 text-xs font-semibold text-rose-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-rose-500/20 transition-all"
                    >
                      {govProposals.cancelStatus === "AWAITING_SIGNATURE" || govProposals.cancelStatus === "PENDING"
                        ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Canceling...</>
                        : <><XCircle className="h-3.5 w-3.5" /> Cancel Proposal</>}
                    </button>
                  )}
                  {govProposals.executeStatus === "CONFIRMED" && govProposals.executeTxHash && (
                    <a href={getGovExplorerTxUrl(chainId, govProposals.executeTxHash)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 transition-colors py-2.5">
                      View execute tx <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {govProposals.executeStatus === "ERROR" && <p className="text-xs text-rose-400 py-2.5">{govProposals.executeError}</p>}
                  {govProposals.cancelStatus === "ERROR" && <p className="text-xs text-rose-400 py-2.5">{govProposals.cancelError}</p>}
                </div>
              )}

              {/* Description */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 backdrop-blur-xl">
                <h3 className="text-sm font-bold text-white mb-3">Description</h3>
                <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{proposal.description}</div>
              </div>

              {/* Transaction Hashes */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 backdrop-blur-xl">
                <h3 className="text-sm font-bold text-white mb-3">On-Chain References</h3>
                <div className="space-y-2 text-xs">
                  {proposal.creationTransactionHash && (
                    <div className="flex items-center justify-between rounded-lg bg-slate-950/60 border border-white/5 px-3 py-2">
                      <span className="text-slate-400">Creation Tx</span>
                      <a href={getGovExplorerTxUrl(chainId, proposal.creationTransactionHash)} target="_blank" rel="noopener noreferrer" className="font-mono text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors">
                        {proposal.creationTransactionHash.slice(0, 10)}... <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {proposal.executionTransactionHash && (
                    <div className="flex items-center justify-between rounded-lg bg-slate-950/60 border border-white/5 px-3 py-2">
                      <span className="text-slate-400">Execution Tx</span>
                      <a href={getGovExplorerTxUrl(chainId, proposal.executionTransactionHash)} target="_blank" rel="noopener noreferrer" className="font-mono text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors">
                        {proposal.executionTransactionHash.slice(0, 10)}... <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {proposal.cancellationTransactionHash && (
                    <div className="flex items-center justify-between rounded-lg bg-slate-950/60 border border-white/5 px-3 py-2">
                      <span className="text-slate-400">Cancellation Tx</span>
                      <a href={getGovExplorerTxUrl(chainId, proposal.cancellationTransactionHash)} target="_blank" rel="noopener noreferrer" className="font-mono text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors">
                        {proposal.cancellationTransactionHash.slice(0, 10)}... <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {proposal.governorContract && (
                    <div className="flex items-center justify-between rounded-lg bg-slate-950/60 border border-white/5 px-3 py-2">
                      <span className="text-slate-400">Governor Contract</span>
                      <span className="font-mono text-slate-300">{proposal.governorContract.slice(0, 10)}...{proposal.governorContract.slice(-8)}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
