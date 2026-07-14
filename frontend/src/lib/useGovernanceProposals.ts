"use client";

/**
 * useGovernanceProposals
 * Fetches proposals from backend and provides real propose() + execute() + cancel() contract calls.
 */

import { useState, useCallback, useEffect } from "react";
import { useAccount, useChainId, usePublicClient, useWalletClient } from "wagmi";
import { decodeEventLog } from "viem";
import { useContractAddresses } from "./contracts";
import { WcosGovernorABI } from "./contracts";
import { isGovernanceDeployed, getGovExplorerTxUrl, PROPOSAL_STATE_LABELS } from "./web3/governanceConfig";

export type ProposalActionStatus =
  | "IDLE"
  | "AWAITING_SIGNATURE"
  | "PENDING"
  | "CONFIRMED"
  | "ERROR";

export interface BackendProposal {
  id: string;
  onChainProposalId: string | null;
  proposer: string;
  title: string;
  summary: string | null;
  description: string;
  category: string;
  proposalType: string;
  targetAddress: string;
  calldata: string;
  valueTransferred: string;
  snapshotBlock: string | null;
  deadlineBlock: string | null;
  governorContract: string | null;
  forVotes: string;
  againstVotes: string;
  status: string;
  chainId: number;
  creationTransactionHash: string | null;
  executionTransactionHash: string | null;
  cancellationTransactionHash: string | null;
  voteCount: number;
  createdAt: string;
  updatedAt: string;
  /** Live state from chain (may override DB status) */
  chainState?: number;
  chainStateLabel?: string;
}

export interface UseGovernanceProposalsReturn {
  proposals: BackendProposal[];
  total: number;
  isLoading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  setPage: (p: number) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  refetch: () => Promise<void>;
  getProposalState: (proposalId: bigint) => Promise<number>;
  createProposalStatus: ProposalActionStatus;
  createProposalTxHash: `0x${string}` | null;
  createProposalError: string | null;
  createProposal: (params: {
    title: string;
    summary?: string;
    description: string;
    category?: string;
    proposalType?: string;
    target?: `0x${string}`;
    value?: bigint;
    calldata?: `0x${string}`;
  }) => Promise<string | null>;
  executeStatus: ProposalActionStatus;
  executeTxHash: `0x${string}` | null;
  executeError: string | null;
  executeProposal: (onChainProposalId: bigint) => Promise<void>;
  cancelStatus: ProposalActionStatus;
  cancelTxHash: `0x${string}` | null;
  cancelError: string | null;
  cancelProposal: (onChainProposalId: bigint) => Promise<void>;
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`;

export function useGovernanceProposals(): UseGovernanceProposalsReturn {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const contractAddresses = useContractAddresses();

  const [proposals, setProposals] = useState<BackendProposal[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createProposalStatus, setCreateProposalStatus] = useState<ProposalActionStatus>("IDLE");
  const [createProposalTxHash, setCreateProposalTxHash] = useState<`0x${string}` | null>(null);
  const [createProposalError, setCreateProposalError] = useState<string | null>(null);

  const [executeStatus, setExecuteStatus] = useState<ProposalActionStatus>("IDLE");
  const [executeTxHash, setExecuteTxHash] = useState<`0x${string}` | null>(null);
  const [executeError, setExecuteError] = useState<string | null>(null);

  const [cancelStatus, setCancelStatus] = useState<ProposalActionStatus>("IDLE");
  const [cancelTxHash, setCancelTxHash] = useState<`0x${string}` | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const governorAddress = contractAddresses.WcosGovernor;
  const governanceActive = isGovernanceDeployed(chainId);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        chainId: chainId.toString(),
        page: page.toString(),
        limit: "20",
      });
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`${apiUrl}/api/v1/governance/proposals?${params}`);
      if (!res.ok) throw new Error(`Backend error: ${res.status}`);
      const data = await res.json();

      setProposals(data.proposals || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      setError(err?.message || "Failed to load proposals");
    } finally {
      setIsLoading(false);
    }
  }, [chainId, page, statusFilter, apiUrl]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const getProposalState = useCallback(async (proposalId: bigint): Promise<number> => {
    if (!publicClient || !governanceActive) return -1;
    try {
      const state = await publicClient.readContract({
        address: governorAddress,
        abi: WcosGovernorABI,
        functionName: "state",
        args: [proposalId],
      }) as number;
      return state;
    } catch {
      return -1;
    }
  }, [publicClient, governorAddress, governanceActive]);

  const createProposal = useCallback(async (params: {
    title: string;
    summary?: string;
    description: string;
    category?: string;
    proposalType?: string;
    target?: `0x${string}`;
    value?: bigint;
    calldata?: `0x${string}`;
  }): Promise<string | null> => {
    if (!walletClient || !address || !publicClient) {
      setCreateProposalError("Wallet not connected");
      return null;
    }
    if (!governanceActive) {
      setCreateProposalError("Governance is not deployed on this network");
      return null;
    }

    setCreateProposalStatus("AWAITING_SIGNATURE");
    setCreateProposalError(null);
    setCreateProposalTxHash(null);

    const target = params.target || ZERO_ADDRESS;
    const value = params.value || BigInt(0);
    const calldata = params.calldata || ("0x" as `0x${string}`);
    const description = params.description;

    try {
      const hash = await walletClient.writeContract({
        address: governorAddress,
        abi: WcosGovernorABI,
        functionName: "propose",
        args: [target, value, calldata, description],
      });

      setCreateProposalTxHash(hash);
      setCreateProposalStatus("PENDING");

      const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });

      // Decode ProposalCreated event to get on-chain proposalId
      let onChainProposalId: string | null = null;
      let snapshotBlock: string | null = null;
      let deadlineBlock: string | null = null;

      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: WcosGovernorABI,
            data: log.data,
            topics: log.topics,
            eventName: "ProposalCreated",
          });
          onChainProposalId = (decoded.args as any).proposalId?.toString() || null;
          snapshotBlock = (decoded.args as any).startBlock?.toString() || null;
          deadlineBlock = (decoded.args as any).endBlock?.toString() || null;
          break;
        } catch {
          // Not this event
        }
      }

      setCreateProposalStatus("CONFIRMED");

      // Register proposal in backend
      try {
        await fetch(`${apiUrl}/api/v1/governance/proposals/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress: address,
            chainId,
            governorContract: governorAddress,
            onChainProposalId: onChainProposalId || "0",
            title: params.title,
            summary: params.summary || null,
            description: params.description,
            category: params.category || "GENERAL",
            proposalType: params.proposalType || "INFORMATIONAL",
            targetAddress: target,
            calldata: calldata,
            valueTransferred: value.toString(),
            snapshotBlock,
            deadlineBlock,
            creationTransactionHash: hash,
          }),
        });
      } catch (logErr) {
        console.warn("Failed to register proposal in backend:", logErr);
      }

      await refetch();
      return onChainProposalId;
    } catch (err: any) {
      const msg = err?.shortMessage || err?.message || "Proposal creation failed";
      setCreateProposalError(msg);
      setCreateProposalStatus("ERROR");
      return null;
    }
  }, [walletClient, address, publicClient, governorAddress, chainId, governanceActive, apiUrl, refetch]);

  const executeProposal = useCallback(async (onChainProposalId: bigint) => {
    if (!walletClient || !address || !publicClient) {
      setExecuteError("Wallet not connected");
      return;
    }

    setExecuteStatus("AWAITING_SIGNATURE");
    setExecuteError(null);
    setExecuteTxHash(null);

    try {
      const hash = await walletClient.writeContract({
        address: governorAddress,
        abi: WcosGovernorABI,
        functionName: "execute",
        args: [onChainProposalId],
      });

      setExecuteTxHash(hash);
      setExecuteStatus("PENDING");

      await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });
      setExecuteStatus("CONFIRMED");

      // Update backend state
      try {
        await fetch(`${apiUrl}/api/v1/governance/proposals/state`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            onChainProposalId: onChainProposalId.toString(),
            chainId,
            status: "EXECUTED",
            executionTransactionHash: hash,
          }),
        });
      } catch (logErr) {
        console.warn("Failed to update proposal state in backend:", logErr);
      }

      await refetch();
    } catch (err: any) {
      const msg = err?.shortMessage || err?.message || "Execute failed";
      setExecuteError(msg);
      setExecuteStatus("ERROR");
    }
  }, [walletClient, address, publicClient, governorAddress, chainId, apiUrl, refetch]);

  const cancelProposal = useCallback(async (onChainProposalId: bigint) => {
    if (!walletClient || !address || !publicClient) {
      setCancelError("Wallet not connected");
      return;
    }

    setCancelStatus("AWAITING_SIGNATURE");
    setCancelError(null);
    setCancelTxHash(null);

    try {
      const hash = await walletClient.writeContract({
        address: governorAddress,
        abi: WcosGovernorABI,
        functionName: "cancel",
        args: [onChainProposalId],
      });

      setCancelTxHash(hash);
      setCancelStatus("PENDING");

      await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });
      setCancelStatus("CONFIRMED");

      // Update backend state
      try {
        await fetch(`${apiUrl}/api/v1/governance/proposals/state`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            onChainProposalId: onChainProposalId.toString(),
            chainId,
            status: "CANCELED",
            cancellationTransactionHash: hash,
          }),
        });
      } catch (logErr) {
        console.warn("Failed to update proposal state in backend:", logErr);
      }

      await refetch();
    } catch (err: any) {
      const msg = err?.shortMessage || err?.message || "Cancel failed";
      setCancelError(msg);
      setCancelStatus("ERROR");
    }
  }, [walletClient, address, publicClient, governorAddress, chainId, apiUrl, refetch]);

  return {
    proposals,
    total,
    isLoading,
    error,
    page,
    totalPages,
    setPage,
    statusFilter,
    setStatusFilter,
    refetch,
    getProposalState,
    createProposalStatus,
    createProposalTxHash,
    createProposalError,
    createProposal,
    executeStatus,
    executeTxHash,
    executeError,
    executeProposal,
    cancelStatus,
    cancelTxHash,
    cancelError,
    cancelProposal,
  };
}
