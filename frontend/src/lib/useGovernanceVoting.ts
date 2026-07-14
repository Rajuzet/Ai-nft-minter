"use client";

/**
 * useGovernanceVoting
 * Provides real on-chain casting of votes on WcosGovernor proposals.
 */

import { useState, useCallback } from "react";
import { useAccount, useChainId, usePublicClient, useWalletClient } from "wagmi";
import { WcosGovernorABI } from "./contracts";
import { useContractAddresses } from "./contracts";
import { isGovernanceDeployed, getGovExplorerTxUrl } from "./web3/governanceConfig";

export type VoteStatus =
  | "IDLE"
  | "CHECKING"
  | "AWAITING_SIGNATURE"
  | "PENDING"
  | "CONFIRMED"
  | "ERROR";

export interface UseGovernanceVotingReturn {
  voteStatus: VoteStatus;
  voteTxHash: `0x${string}` | null;
  voteError: string | null;
  explorerUrl: string | null;
  hasVoted: (proposalId: bigint, address: `0x${string}`) => Promise<boolean>;
  votingPowerAt: (address: `0x${string}`, blockNumber: bigint) => Promise<bigint>;
  castVote: (proposalId: bigint, support: boolean) => Promise<void>;
  reset: () => void;
}

export function useGovernanceVoting(): UseGovernanceVotingReturn {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const contractAddresses = useContractAddresses();

  const [voteStatus, setVoteStatus] = useState<VoteStatus>("IDLE");
  const [voteTxHash, setVoteTxHash] = useState<`0x${string}` | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [explorerUrl, setExplorerUrl] = useState<string | null>(null);

  const governorAddress = contractAddresses.WcosGovernor;
  const governanceActive = isGovernanceDeployed(chainId);

  const hasVoted = useCallback(async (proposalId: bigint, voterAddress: `0x${string}`): Promise<boolean> => {
    if (!publicClient || !governanceActive) return false;
    try {
      const result = await publicClient.readContract({
        address: governorAddress,
        abi: WcosGovernorABI,
        functionName: "hasVoted",
        args: [proposalId, voterAddress],
      }) as boolean;
      return result;
    } catch {
      return false;
    }
  }, [publicClient, governorAddress, governanceActive]);

  const votingPowerAt = useCallback(async (voterAddress: `0x${string}`, blockNumber: bigint): Promise<bigint> => {
    if (!publicClient || !governanceActive) return BigInt(0);
    const tokenAddress = contractAddresses.WcosGovernanceToken;
    try {
      const { WcosGovernanceTokenABI } = await import("./contracts");
      const result = await publicClient.readContract({
        address: tokenAddress,
        abi: WcosGovernanceTokenABI,
        functionName: "getPastVotes",
        args: [voterAddress, blockNumber],
      }) as bigint;
      return result;
    } catch {
      return BigInt(0);
    }
  }, [publicClient, contractAddresses, governanceActive]);

  const castVote = useCallback(async (proposalId: bigint, support: boolean) => {
    if (!walletClient || !address || !publicClient) {
      setVoteError("Wallet not connected");
      return;
    }
    if (!governanceActive) {
      setVoteError("Governance is not deployed on this network");
      return;
    }

    setVoteStatus("CHECKING");
    setVoteError(null);
    setVoteTxHash(null);
    setExplorerUrl(null);

    // Pre-check: already voted?
    const alreadyVoted = await hasVoted(proposalId, address);
    if (alreadyVoted) {
      setVoteError("You have already voted on this proposal");
      setVoteStatus("ERROR");
      return;
    }

    // Get snapshot block to estimate voting weight
    let snapshotBlock = BigInt(0);
    let weight = BigInt(0);
    try {
      const proposalData = await publicClient.readContract({
        address: governorAddress,
        abi: WcosGovernorABI,
        functionName: "proposals",
        args: [proposalId],
      }) as any;
      snapshotBlock = proposalData[5]; // startBlock
      weight = await votingPowerAt(address, snapshotBlock);
    } catch {
      // Non-critical — contract will validate on-chain
    }

    if (weight === BigInt(0)) {
      // Warn but don't block — contract may fall back to current balance
      console.warn("No checkpoint voting power found at snapshot block. Contract may fall back to current balance.");
    }

    setVoteStatus("AWAITING_SIGNATURE");

    try {
      const hash = await walletClient.writeContract({
        address: governorAddress,
        abi: WcosGovernorABI,
        functionName: "castVote",
        args: [proposalId, support],
      });

      setVoteTxHash(hash);
      setVoteStatus("PENDING");
      setExplorerUrl(getGovExplorerTxUrl(chainId, hash));

      const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });

      setVoteStatus("CONFIRMED");

      // Log vote to backend
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      try {
        await fetch(`${apiUrl}/api/v1/governance/votes/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress: address,
            chainId,
            onChainProposalId: proposalId.toString(),
            support,
            weight: weight.toString(),
            transactionHash: hash,
          }),
        });

        // Confirm vote
        await fetch(`${apiUrl}/api/v1/governance/votes/confirm`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionHash: hash,
            blockNumber: receipt.blockNumber ? Number(receipt.blockNumber) : undefined,
          }),
        });
      } catch (logErr) {
        console.warn("Failed to log vote to backend:", logErr);
      }
    } catch (err: any) {
      const msg = err?.shortMessage || err?.message || "Vote transaction failed";
      setVoteError(msg);
      setVoteStatus("ERROR");
    }
  }, [walletClient, address, publicClient, governorAddress, chainId, governanceActive, hasVoted, votingPowerAt]);

  const reset = useCallback(() => {
    setVoteStatus("IDLE");
    setVoteTxHash(null);
    setVoteError(null);
    setExplorerUrl(null);
  }, []);

  return {
    voteStatus,
    voteTxHash,
    voteError,
    explorerUrl,
    hasVoted,
    votingPowerAt,
    castVote,
    reset,
  };
}
