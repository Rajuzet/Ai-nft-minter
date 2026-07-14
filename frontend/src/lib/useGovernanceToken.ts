"use client";

/**
 * useGovernanceToken
 * Provides real on-chain reads and writes for the WcosGovernanceToken contract.
 * Chain-aware — reads the correct contract based on active wallet chain.
 */

import { useState, useCallback } from "react";
import { useAccount, useChainId, usePublicClient, useWalletClient } from "wagmi";
import { formatUnits, parseAbi } from "viem";
import { useContractAddresses } from "./contracts";
import { WcosGovernanceTokenABI } from "./contracts";
import { getGovernanceConfig, isGovernanceDeployed } from "./web3/governanceConfig";

export type DelegateStatus =
  | "IDLE"
  | "AWAITING_SIGNATURE"
  | "PENDING"
  | "CONFIRMED"
  | "ERROR";

export interface GovernanceTokenState {
  tokenBalance: bigint;
  tokenBalanceFormatted: string;
  currentDelegate: `0x${string}` | null;
  isSelfDelegated: boolean;
  votingPower: bigint;
  votingPowerFormatted: string;
  totalSupply: bigint;
  totalSupplyFormatted: string;
  numCheckpoints: number;
  isLoading: boolean;
  error: string | null;
  delegateStatus: DelegateStatus;
  delegateTxHash: `0x${string}` | null;
  delegateError: string | null;
  refetch: () => Promise<void>;
  delegate: (delegatee: `0x${string}`) => Promise<void>;
  selfDelegate: () => Promise<void>;
}

export function useGovernanceToken(): GovernanceTokenState {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const contractAddresses = useContractAddresses();

  const [tokenBalance, setTokenBalance] = useState<bigint>(BigInt(0));
  const [currentDelegate, setCurrentDelegate] = useState<`0x${string}` | null>(null);
  const [votingPower, setVotingPower] = useState<bigint>(BigInt(0));
  const [totalSupply, setTotalSupply] = useState<bigint>(BigInt(0));
  const [numCheckpoints, setNumCheckpoints] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [delegateStatus, setDelegateStatus] = useState<DelegateStatus>("IDLE");
  const [delegateTxHash, setDelegateTxHash] = useState<`0x${string}` | null>(null);
  const [delegateError, setDelegateError] = useState<string | null>(null);

  const govTokenAddress = contractAddresses.WcosGovernanceToken;
  const governanceActive = isGovernanceDeployed(chainId);

  const refetch = useCallback(async () => {
    if (!address || !publicClient || !governanceActive) return;
    setIsLoading(true);
    setError(null);

    try {
      const [balance, delegate, supply, checkpoints] = await Promise.all([
        publicClient.readContract({
          address: govTokenAddress,
          abi: WcosGovernanceTokenABI,
          functionName: "balanceOf",
          args: [address],
        }),
        publicClient.readContract({
          address: govTokenAddress,
          abi: WcosGovernanceTokenABI,
          functionName: "delegates",
          args: [address],
        }),
        publicClient.readContract({
          address: govTokenAddress,
          abi: WcosGovernanceTokenABI,
          functionName: "totalSupply",
        }),
        publicClient.readContract({
          address: govTokenAddress,
          abi: WcosGovernanceTokenABI,
          functionName: "numCheckpoints",
          args: [address],
        }),
      ]) as [bigint, `0x${string}`, bigint, number];

      setTokenBalance(balance);
      setCurrentDelegate(delegate);
      setTotalSupply(supply);
      setNumCheckpoints(checkpoints);

      // Voting power: if delegated to self or others, read getPastVotes at latest block
      const currentBlock = await publicClient.getBlockNumber();
      if (currentBlock > BigInt(0)) {
        try {
          const power = await publicClient.readContract({
            address: govTokenAddress,
            abi: WcosGovernanceTokenABI,
            functionName: "getPastVotes",
            args: [address, currentBlock - BigInt(1)],
          }) as bigint;
          setVotingPower(power);
        } catch {
          // No checkpoints yet — voting power is 0 until first delegation
          setVotingPower(BigInt(0));
        }
      }
    } catch (err: any) {
      setError(err?.message || "Failed to read governance token data");
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient, govTokenAddress, governanceActive]);

  const delegate = useCallback(async (delegatee: `0x${string}`) => {
    if (!walletClient || !address || !publicClient) {
      setDelegateError("Wallet not connected");
      return;
    }
    if (!governanceActive) {
      setDelegateError("Governance is not deployed on this network");
      return;
    }

    setDelegateStatus("AWAITING_SIGNATURE");
    setDelegateError(null);
    setDelegateTxHash(null);

    try {
      const hash = await walletClient.writeContract({
        address: govTokenAddress,
        abi: WcosGovernanceTokenABI,
        functionName: "delegate",
        args: [delegatee],
      });

      setDelegateTxHash(hash);
      setDelegateStatus("PENDING");

      await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });

      setDelegateStatus("CONFIRMED");

      // Refetch voting power
      await refetch();

      // Log delegation to backend
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      try {
        await fetch(`${apiUrl}/api/v1/governance/delegations/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress: address,
            delegateAddress: delegatee,
            chainId,
            votingPower: tokenBalance.toString(),
            transactionHash: hash,
          }),
        });
      } catch (logErr) {
        // Non-critical — backend log is advisory only
        console.warn("Failed to log delegation to backend:", logErr);
      }
    } catch (err: any) {
      const msg = err?.shortMessage || err?.message || "Delegation failed";
      setDelegateError(msg);
      setDelegateStatus("ERROR");
    }
  }, [walletClient, address, publicClient, govTokenAddress, chainId, tokenBalance, governanceActive, refetch]);

  const selfDelegate = useCallback(async () => {
    if (!address) return;
    await delegate(address);
  }, [address, delegate]);

  const isSelfDelegated =
    !!address &&
    !!currentDelegate &&
    currentDelegate.toLowerCase() === address.toLowerCase();

  return {
    tokenBalance,
    tokenBalanceFormatted: formatUnits(tokenBalance, 18),
    currentDelegate,
    isSelfDelegated,
    votingPower,
    votingPowerFormatted: formatUnits(votingPower, 18),
    totalSupply,
    totalSupplyFormatted: formatUnits(totalSupply, 18),
    numCheckpoints,
    isLoading,
    error,
    delegateStatus,
    delegateTxHash,
    delegateError,
    refetch,
    delegate,
    selfDelegate,
  };
}
