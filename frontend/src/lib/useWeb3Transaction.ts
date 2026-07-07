"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useDeployContract,
} from "wagmi";
import type { Abi, Address } from "viem";

// ─── Transaction status types ────────────────────────────────────────────────

export type TxStatus =
  | "idle"
  | "preparing"
  | "pending_wallet"
  | "submitted"
  | "confirmed"
  | "failed";

export interface TxState {
  status: TxStatus;
  txHash: `0x${string}` | undefined;
  error: string | null;
  isLoading: boolean;
  isSuccess: boolean;
}

// ─── Write contract transaction hook ─────────────────────────────────────────

interface UseWeb3TransactionParams {
  onSuccess?: (txHash: `0x${string}`) => void;
  onError?: (error: string) => void;
}

/**
 * Wraps wagmi's useWriteContract + useWaitForTransactionReceipt into a
 * clean state machine: idle → preparing → pending_wallet → submitted → confirmed | failed.
 */
export function useWeb3Transaction({ onSuccess, onError }: UseWeb3TransactionParams = {}) {
  const [status, setStatus] = useState<TxStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const {
    data: txHash,
    writeContract,
    error: writeError,
    isPending: isWritePending,
    reset: resetWrite,
  } = useWriteContract();

  const {
    isLoading: isWaiting,
    isSuccess: isConfirmed,
    error: waitError,
  } = useWaitForTransactionReceipt({ hash: txHash });

  // Track transitions
  useEffect(() => {
    if (isWritePending && !txHash) {
      setStatus("pending_wallet");
      setError(null);
    }
  }, [isWritePending, txHash]);

  useEffect(() => {
    if (txHash) {
      setStatus("submitted");
    }
  }, [txHash]);

  useEffect(() => {
    if (isConfirmed && txHash) {
      setStatus("confirmed");
      onSuccess?.(txHash);
    }
  }, [isConfirmed, txHash]);

  useEffect(() => {
    if (writeError) {
      const msg = parseContractError(writeError);
      setError(msg);
      setStatus("failed");
      onError?.(msg);
    }
  }, [writeError]);

  useEffect(() => {
    if (waitError) {
      const msg = parseContractError(waitError);
      setError(msg);
      setStatus("failed");
      onError?.(msg);
    }
  }, [waitError]);

  const execute = useCallback(
    (params: any) => {
      setStatus("preparing");
      setError(null);
      writeContract(params);
    },
    [writeContract]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    resetWrite();
  }, [resetWrite]);

  const state: TxState = {
    status,
    txHash,
    error,
    isLoading: status === "preparing" || status === "pending_wallet" || status === "submitted",
    isSuccess: status === "confirmed",
  };

  return { execute, state, reset };
}

// ─── Deploy contract transaction hook ────────────────────────────────────────

interface UseWeb3DeployParams {
  onSuccess?: (contractAddress: Address, txHash: `0x${string}`) => void;
  onError?: (error: string) => void;
}

export function useWeb3Deploy({ onSuccess, onError }: UseWeb3DeployParams = {}) {
  const [status, setStatus] = useState<TxStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [deployedAddress, setDeployedAddress] = useState<Address | undefined>();

  const {
    data: deployHash,
    deployContract,
    error: deployError,
    isPending: isDeployPending,
    reset: resetDeploy,
  } = useDeployContract();

  const { isLoading: isWaiting, isSuccess: isConfirmed, data: receipt } =
    useWaitForTransactionReceipt({ hash: deployHash });

  useEffect(() => {
    if (isDeployPending && !deployHash) setStatus("pending_wallet");
  }, [isDeployPending, deployHash]);

  useEffect(() => {
    if (deployHash) setStatus("submitted");
  }, [deployHash]);

  useEffect(() => {
    if (isConfirmed && receipt?.contractAddress && deployHash) {
      setDeployedAddress(receipt.contractAddress);
      setStatus("confirmed");
      onSuccess?.(receipt.contractAddress, deployHash);
    }
  }, [isConfirmed, receipt, deployHash]);

  useEffect(() => {
    if (deployError) {
      const msg = parseContractError(deployError);
      setError(msg);
      setStatus("failed");
      onError?.(msg);
    }
  }, [deployError]);

  const execute = useCallback(
    (params: Parameters<typeof deployContract>[0]) => {
      setStatus("preparing");
      setError(null);
      deployContract(params);
    },
    [deployContract]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setDeployedAddress(undefined);
    resetDeploy();
  }, [resetDeploy]);

  return { execute, status, error, deployedAddress, deployHash, reset, isLoading: status !== "idle" && status !== "confirmed" && status !== "failed" };
}

// ─── Error parsing ────────────────────────────────────────────────────────────

export function parseContractError(err: Error | null | unknown): string {
  if (!err) return "Unknown error";
  const msg = (err as Error).message ?? String(err);
  if (msg.includes("User rejected") || msg.includes("user rejected"))
    return "Transaction cancelled — you rejected the wallet signature.";
  if (msg.includes("insufficient funds") || msg.includes("InsufficientFunds"))
    return "Insufficient ETH — not enough balance for gas + value.";
  if (msg.includes("execution reverted"))
    return "Contract call reverted — check inputs or contract state.";
  if (msg.includes("not deployed") || msg.includes("does not exist"))
    return "Contract not deployed on this network.";
  if (msg.includes("nonce too low"))
    return "Transaction nonce conflict — please retry.";
  if (msg.includes("already pending"))
    return "Transaction already pending — wait for it to confirm.";
  return msg.length > 160 ? msg.slice(0, 160) + "…" : msg;
}

// ─── Status label helper ──────────────────────────────────────────────────────

export function getTxStatusLabel(status: TxStatus, labels?: Partial<Record<TxStatus, string>>): string {
  const defaults: Record<TxStatus, string> = {
    idle: "Ready",
    preparing: "Preparing…",
    pending_wallet: "Awaiting wallet signature…",
    submitted: "Transaction submitted — confirming…",
    confirmed: "Confirmed ✓",
    failed: "Failed",
  };
  return labels?.[status] ?? defaults[status];
}
