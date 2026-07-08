"use client";

import { useAccount, useBalance, useChainId, useSwitchChain as useWagmiSwitchChain } from "wagmi";
import { useConnectModal, useChainModal } from "@rainbow-me/rainbowkit";
import { WCOS_CHAINS, supportedChains, DEFAULT_CHAIN } from "./web3/config/chains";
import { MULTI_CHAIN_CONTRACT_ADDRESSES } from "./contracts";
import { useEffect, useState, useMemo, useCallback } from "react";

// Helper to check if a chain ID is supported
export const isChainSupported = (id: number): boolean => {
  const config = WCOS_CHAINS[id];
  return config !== undefined && config.enabled;
};

// 1. useWalletStatus
export function useWalletStatus() {
  const { isConnected, address, status, isConnecting, isReconnecting } = useAccount();
  const chainId = useChainId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isSupportedChain = isConnected && isChainSupported(chainId);

  return {
    isConnected: mounted ? isConnected : false,
    address: mounted ? address : undefined,
    status: mounted ? status : "connecting",
    isConnecting: mounted ? isConnecting : false,
    isReconnecting: mounted ? isReconnecting : false,
    isSupportedChain: mounted ? isSupportedChain : false,
  };
}

// 2. useConnectedAddress
export function useConnectedAddress() {
  const { address } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !address) return null;

  return address;
}

// 3. useCurrentChain
export function useCurrentChain() {
  const { chain, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain: wagmiSwitchChain, isPending: isSwitching, error: switchError } = useWagmiSwitchChain();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeChainId = mounted ? (chain?.id ?? chainId) : undefined;
  const chainConfig = activeChainId ? WCOS_CHAINS[activeChainId] : undefined;
  const isSupported = activeChainId !== undefined && chainConfig?.enabled === true;

  return {
    chain: mounted ? chain : undefined,
    id: activeChainId,
    name: mounted ? (chainConfig?.name ?? chain?.name ?? "Disconnected") : "Loading...",
    isSupported: mounted ? isSupported : false,
    config: mounted ? chainConfig : undefined,
    switchChain: wagmiSwitchChain,
    isSwitching,
    switchError,
  };
}

// 4. useRequireWallet
export function useRequireWallet() {
  const { isConnected, isSupportedChain } = useWalletStatus();
  const { openConnectModal } = useConnectModal();
  const { openChainModal } = useChainModal();
  const [showPrompt, setShowPrompt] = useState(false);

  const requireWallet = (action: () => void) => {
    if (!isConnected) {
      setShowPrompt(true);
      if (openConnectModal) {
        openConnectModal();
      }
      return false;
    }
    if (!isSupportedChain) {
      setShowPrompt(true);
      if (openChainModal) {
        openChainModal();
      }
      return false;
    }
    action();
    return true;
  };

  return {
    requireWallet,
    showPrompt,
    setShowPrompt,
  };
}

// 5. useWalletBalance
export function useWalletBalance() {
  const { address } = useAccount();
  const { data, isLoading, refetch, error } = useBalance({
    address,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return {
    balance: mounted ? data : undefined,
    formatted: mounted ? data?.formatted ?? "0.00" : "0.00",
    symbol: mounted ? data?.symbol ?? "ETH" : "ETH",
    isLoading: mounted ? isLoading : true,
    error: mounted ? error : null,
    refetch,
  };
}

// 6. useSwitchToSupportedChain
export function useSwitchToSupportedChain() {
  const { switchChain, isPending: isSwitching, error } = useWagmiSwitchChain();

  const switchToSupportedChain = () => {
    if (switchChain) {
      switchChain({ chainId: DEFAULT_CHAIN.id });
    }
  };

  return {
    switchToSupportedChain,
    isSwitching,
    error,
  };
}

// 7. useSupportedChains
export function useSupportedChains() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return useMemo(() => {
    if (!mounted) return [];
    return Object.values(WCOS_CHAINS).filter((c) => c.enabled);
  }, [mounted]);
}

// 8. useSelectedChain
export function useSelectedChain(defaultChainKey: string = "base-sepolia") {
  const [selectedChainKey, setSelectedChainKey] = useState(defaultChainKey);
  const currentChain = useCurrentChain();

  const chainKeyMap = useMemo(() => ({
    "base-sepolia": 84532,
    "base-mainnet": 8453,
    "ethereum": 1,
    "polygon": 137,
    "arbitrum": 42161,
    "optimism": 10,
  } as Record<string, number>), []);

  const chainIdToKey = useCallback((id: number): string => {
    return Object.keys(chainKeyMap).find((key) => chainKeyMap[key] === id) || defaultChainKey;
  }, [chainKeyMap, defaultChainKey]);

  const selectedChainId = chainKeyMap[selectedChainKey] || 84532;
  const config = WCOS_CHAINS[selectedChainId];

  // Sync selected chain dropdown with wallet chain if connected and supported
  useEffect(() => {
    if (currentChain.isSupported && currentChain.id) {
      const key = chainIdToKey(currentChain.id);
      if (key && key !== selectedChainKey) {
        setSelectedChainKey(key);
      }
    }
  }, [currentChain.id, currentChain.isSupported, chainIdToKey, selectedChainKey]);

  return {
    selectedChainKey,
    selectedChainId,
    setSelectedChainKey,
    config,
  };
}

// 9. useSwitchChain
export function useSwitchChain() {
  const { switchChain: wagmiSwitchChain, isPending, error } = useWagmiSwitchChain();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const switchNetwork = useCallback(async (targetChainId: number) => {
    setErrorMsg(null);
    if (!wagmiSwitchChain) {
      setErrorMsg("Wallet switch network not ready.");
      return;
    }
    try {
      await wagmiSwitchChain({ chainId: targetChainId });
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to switch chain.");
    }
  }, [wagmiSwitchChain]);

  return {
    switchChain: switchNetwork,
    isSwitching: isPending,
    error: error || errorMsg,
  };
}

// 10. useIsSupportedChain
export function useIsSupportedChain() {
  return useCallback((id: number): boolean => {
    return isChainSupported(id);
  }, []);
}

// 11. useRequireSupportedChain
export function useRequireSupportedChain() {
  const currentChain = useCurrentChain();
  const { switchChain } = useSwitchChain();
  const [prompted, setPrompted] = useState(false);

  const enforceChain = useCallback(() => {
    if (!currentChain.isSupported) {
      setPrompted(true);
      switchChain(DEFAULT_CHAIN.id);
      return false;
    }
    return true;
  }, [currentChain.isSupported, switchChain]);

  return {
    enforceChain,
    prompted,
  };
}

// 12. useChainContracts
export function useChainContracts(chainId?: number) {
  const currentChain = useCurrentChain();
  const targetChainId = chainId || currentChain.id || DEFAULT_CHAIN.id;
  return useMemo(() => {
    const addresses = MULTI_CHAIN_CONTRACT_ADDRESSES[targetChainId];
    return addresses || MULTI_CHAIN_CONTRACT_ADDRESSES[DEFAULT_CHAIN.id];
  }, [targetChainId]);
}

// 13. useChainFeatureSupport
export function useChainFeatureSupport(chainId?: number) {
  const currentChain = useCurrentChain();
  const targetChainId = chainId || currentChain.id || DEFAULT_CHAIN.id;
  return useMemo(() => {
    const config = WCOS_CHAINS[targetChainId];
    return config?.features || {
      mint: false,
      marketplace: false,
      staking: false,
      dao: false,
      swap: false,
    };
  }, [targetChainId]);
}
