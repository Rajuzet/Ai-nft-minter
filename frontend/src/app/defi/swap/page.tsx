"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { SafeWalletButton } from "../../../components/ui/SafeWalletButton";
import { WalletGuard } from "../../../components/ui/WalletGuard";
import { useAccount, useChainId, useSwitchChain, useSendTransaction, useWaitForTransactionReceipt, useReadContract, useWriteContract, useBalance } from "wagmi";
import { parseUnits, formatUnits, parseAbiItem } from "viem";
import {
  Coins, Wallet, Compass, Layers, RefreshCw, Eye, EyeOff, ShieldAlert,
  Globe, Info, DollarSign, TrendingUp, TrendingDown, EyeIcon, Award,
  ArrowUpRight, ArrowDownLeft, Landmark, FileText, ChevronRight, Cpu,
  Settings, ArrowDown, AlertTriangle, CheckCircle2, X
} from "lucide-react";
import { useChainGuard } from "../../../lib/useChainGuard";
import { parseContractError } from "../../../lib/useWeb3Transaction";
import { getExplorerTxUrl } from "../../../lib/contracts";

interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
}

const WGT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || "0x498e82d77C29FAf0605a96E3D4F59E9E0C1BEc3A";

const TOKEN_REGISTRY: Record<number, Token[]> = {
  84532: [ // Base Sepolia
    { symbol: "ETH", name: "Ethereum", address: "NATIVE", decimals: 18 },
    { symbol: "WGT", name: "WCOS Governance Token", address: WGT_ADDRESS, decimals: 18 },
    { symbol: "USDC", name: "USD Coin", address: "0x036cbd53842c5426634e7929541ec2318f3dcf7e", decimals: 6 },
  ],
  8453: [ // Base Mainnet
    { symbol: "ETH", name: "Ethereum", address: "NATIVE", decimals: 18 },
    { symbol: "USDC", name: "USD Coin", address: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", decimals: 6 },
    { symbol: "DEGEN", name: "Degen", address: "0x4ed4e11a221506294411143a852641b17ac2f307", decimals: 18 },
  ],
  1: [ // Ethereum Mainnet
    { symbol: "ETH", name: "Ethereum", address: "NATIVE", decimals: 18 },
    { symbol: "USDC", name: "USD Coin", address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", decimals: 6 },
    { symbol: "USDT", name: "Tether USD", address: "0xdac17f958d2ee523a2206206994597c13d831ec7", decimals: 6 },
  ],
  137: [ // Polygon
    { symbol: "POL", name: "Polygon Ecosystem Token", address: "NATIVE", decimals: 18 },
    { symbol: "USDC", name: "USD Coin", address: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359", decimals: 6 },
  ],
  42161: [ // Arbitrum
    { symbol: "ETH", name: "Ethereum", address: "NATIVE", decimals: 18 },
    { symbol: "USDC", name: "USD Coin", address: "0xaf88d065e77cc8cc2239327c5edb3a432268e5831", decimals: 6 },
  ],
  10: [ // Optimism
    { symbol: "ETH", name: "Ethereum", address: "NATIVE", decimals: 18 },
    { symbol: "USDC", name: "USD Coin", address: "0x0b2c639c533813f4aa9d7837caf62653d097ff85", decimals: 6 },
  ],
};

const ERC20_ABI = [
  parseAbiItem("function allowance(address owner, address spender) view returns (uint256)"),
  parseAbiItem("function approve(address spender, uint256 amount) returns (bool)"),
  parseAbiItem("function balanceOf(address owner) view returns (uint256)"),
] as const;

export default function DefiSwapPage() {
  const { address, isConnected } = useAccount();
  const walletChainId = useChainId();
  const { switchChain } = useSwitchChain();

  const [selectedChain, setSelectedChain] = useState("base-sepolia");
  const [sellTokenSymbol, setSellTokenSymbol] = useState("ETH");
  const [buyTokenSymbol, setBuyTokenSymbol] = useState("WGT");
  const [sellAmountInput, setSellAmountInput] = useState("0.1");
  const [slippagePercent, setSlippagePercent] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);

  // Quote State
  const [quote, setQuote] = useState<any>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [countdown, setCountdown] = useState(30);

  // Transaction Status
  const [txStatus, setTxStatus] = useState<
    "IDLE" | "CHECKING_ALLOWANCE" | "APPROVAL_REQUIRED" | "AWAITING_APPROVAL_SIGNATURE" |
    "APPROVAL_PENDING" | "READY_TO_SWAP" | "AWAITING_SWAP_SIGNATURE" | "SWAP_PENDING" |
    "COMPLETED" | "FAILED"
  >("IDLE");

  const [activeTxHash, setActiveTxHash] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isConfirmingModal, setIsConfirmingModal] = useState(false);

  // Chain helpers
  const chainMap = React.useMemo(() => ({
    "base-sepolia": 84532,
    "base-mainnet": 8453,
    "ethereum": 1,
    "polygon": 137,
    "arbitrum": 42161,
    "optimism": 10,
  } as Record<string, number>), []);

  const activeChainId = chainMap[selectedChain] || 84532;
  const chainGuard = useChainGuard(activeChainId);
  const tokens = TOKEN_REGISTRY[activeChainId] || [];

  const sellToken = tokens.find((t) => t.symbol === sellTokenSymbol) || tokens[0];
  const buyToken = tokens.find((t) => t.symbol === buyTokenSymbol) || tokens[1] || tokens[0];

  // Sync chain selector dropdown with wallet network
  useEffect(() => {
    if (isConnected && walletChainId) {
      const key = Object.keys(chainMap).find((k) => chainMap[k] === walletChainId);
      if (key && key !== selectedChain) {
        setSelectedChain(key);
      }
    }
  }, [walletChainId, isConnected, selectedChain, chainMap]);

  // Adjust token choices if chain changes to avoid out-of-index
  useEffect(() => {
    const chainTokens = TOKEN_REGISTRY[activeChainId] || [];
    if (chainTokens.length > 0) {
      setSellTokenSymbol(chainTokens[0].symbol);
      setBuyTokenSymbol(chainTokens[1]?.symbol || chainTokens[0].symbol);
    }
  }, [activeChainId]);

  // Balance Hooks
  const { data: ethBalance, refetch: refetchEthBalance } = useBalance({
    address: address,
    chainId: activeChainId,
    query: { enabled: isConnected && !!address }
  });

  const { data: erc20Balance, refetch: refetchErc20Balance } = useReadContract({
    address: sellToken?.address !== "NATIVE" ? (sellToken?.address as `0x${string}`) : undefined,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address && sellToken?.address !== "NATIVE" }
  });

  const getActiveBalanceFormatted = () => {
    if (!isConnected || !address) return "0.00";
    if (sellToken?.address === "NATIVE") {
      return ethBalance ? parseFloat(ethBalance.formatted).toFixed(4) : "0.00";
    }
    return erc20Balance !== undefined
      ? (parseFloat(formatUnits(erc20Balance as bigint, sellToken.decimals))).toFixed(4)
      : "0.00";
  };

  const getActiveBalanceRaw = (): bigint => {
    if (!isConnected || !address) return 0n;
    if (sellToken?.address === "NATIVE") {
      return ethBalance ? ethBalance.value : 0n;
    }
    return (erc20Balance as bigint) || 0n;
  };

  // Allowance Hooks
  const allowanceSpender = quote?.allowanceTarget || "0x0000000000000000000000000000000000000000";
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: sellToken?.address !== "NATIVE" ? (sellToken?.address as `0x${string}`) : undefined,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && allowanceSpender !== "0x0000000000000000000000000000000000000000" ? [address, allowanceSpender as `0x${string}`] : undefined,
    query: { enabled: isConnected && !!address && sellToken?.address !== "NATIVE" && allowanceSpender !== "0x0000000000000000000000000000000000000000" }
  });

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

  // Fetch Swap Quote
  const fetchQuote = useCallback(async () => {
    if (!isConnected || !address || !sellToken || !buyToken) return;
    if (sellToken.symbol === buyToken.symbol) return;
    const sellAmtFloat = parseFloat(sellAmountInput);
    if (isNaN(sellAmtFloat) || sellAmtFloat <= 0) return;

    setIsQuoting(true);
    setQuoteError("");
    try {
      const rawSellAmt = parseUnits(sellAmountInput, sellToken.decimals).toString();
      const slippageBps = Math.floor(slippagePercent * 100);

      const response = await fetch(`${backendUrl}/api/v1/defi/swap-quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chainId: activeChainId,
          walletAddress: address,
          sellToken: sellToken.address,
          buyToken: buyToken.address,
          sellAmount: rawSellAmt,
          slippageBps,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch swap route from provider.");
      }

      const quoteData = await response.json();
      setQuote(quoteData);
      setCountdown(30);
    } catch (err: any) {
      setQuote(null);
      setQuoteError(err.message || "No supported routing available.");
    } finally {
      setIsQuoting(false);
    }
  }, [address, isConnected, sellToken, buyToken, sellAmountInput, slippagePercent, activeChainId, backendUrl]);

  // Debouncing Quote requests
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuote();
    }, 600);
    return () => clearTimeout(timer);
  }, [sellAmountInput, sellTokenSymbol, buyTokenSymbol, slippagePercent, fetchQuote]);

  // Countdown timer for quote freshness
  useEffect(() => {
    if (!quote) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchQuote();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [quote, fetchQuote]);

  const handleChainChange = (val: string) => {
    setSelectedChain(val);
    const targetId = chainMap[val];
    if (isConnected && targetId && switchChain) {
      switchChain({ chainId: targetId });
    }
  };

  const handleMaxClick = () => {
    const bal = getActiveBalanceFormatted();
    // reserve some ETH for gas if native
    if (sellToken?.address === "NATIVE") {
      const maxEth = Math.max(parseFloat(bal) - 0.005, 0);
      setSellAmountInput(maxEth.toFixed(4));
    } else {
      setSellAmountInput(bal);
    }
  };

  const { writeContractAsync: writeApproval } = useWriteContract();
  const { sendTransactionAsync: executeSwap } = useSendTransaction();

  // Approve Spender Contract
  const handleApprove = async () => {
    if (!isConnected || !address || !quote || !allowanceSpender) return;
    setTxStatus("AWAITING_APPROVAL_SIGNATURE");
    setErrorMessage("");

    try {
      const txHash = await writeApproval({
        address: sellToken.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [allowanceSpender as `0x${string}`, BigInt(quote.sellAmount)],
      });

      setTxStatus("APPROVAL_PENDING");
      setActiveTxHash(txHash);

      // Register Pending approval in backend (optional transaction indexing)
      await fetch(`${backendUrl}/api/v1/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          txHash,
          network: selectedChain,
          chainId: activeChainId,
          type: "APPROVE",
          status: "PENDING",
          details: { tokenSymbol: sellToken.symbol, spender: allowanceSpender }
        })
      });
    } catch (err: any) {
      setTxStatus("IDLE");
      setErrorMessage(parseContractError(err) || "Approval rejected by user.");
    }
  };

  // Perform Swap calldata execution
  const handleSwap = async () => {
    if (!isConnected || !address || !quote) return;
    setTxStatus("AWAITING_SWAP_SIGNATURE");
    setIsConfirmingModal(false);
    setErrorMessage("");

    try {
      // Validate wallet inputs
      const currentBal = getActiveBalanceRaw();
      const requiredAmt = BigInt(quote.sellAmount);
      if (currentBal < requiredAmt) {
        throw new Error("Insufficient balance to execute this trade.");
      }

      // Execute transaction with provider calldata
      const txHash = await executeSwap({
        to: quote.transactionTarget as `0x${string}`,
        data: quote.transactionCalldata as `0x${string}`,
        value: BigInt(quote.transactionValue),
      });

      setTxStatus("SWAP_PENDING");
      setActiveTxHash(txHash);

      // Register pending swap with backend
      await fetch(`${backendUrl}/api/v1/defi/swap/pending`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          chainId: activeChainId,
          provider: quote.provider,
          sellTokenAddress: sellToken.address,
          sellTokenSymbol: sellToken.symbol,
          sellTokenDecimals: sellToken.decimals,
          sellAmount: quote.sellAmount,
          buyTokenAddress: buyToken.address,
          buyTokenSymbol: buyToken.symbol,
          buyTokenDecimals: buyToken.decimals,
          quotedBuyAmount: quote.expectedBuyAmount,
          minimumBuyAmount: quote.minimumReceived,
          slippageBps: Math.floor(slippagePercent * 100),
          swapTransactionHash: txHash,
          allowanceTarget: quote.allowanceTarget,
          routerAddress: quote.transactionTarget,
        })
      });
    } catch (err: any) {
      setTxStatus("IDLE");
      setErrorMessage(parseContractError(err) || err.message || "Swap transaction rejected.");
    }
  };

  // Receipt monitoring for approvals & swaps
  const { data: receiptData } = useWaitForTransactionReceipt({ hash: activeTxHash as `0x${string}` });

  useEffect(() => {
    if (receiptData) {
      if (txStatus === "APPROVAL_PENDING") {
        if (receiptData.status === "success") {
          setTxStatus("READY_TO_SWAP");
          refetchAllowance();
          refetchErc20Balance();
        } else {
          setTxStatus("FAILED");
          setErrorMessage("Token approval transaction reverted.");
        }
      } else if (txStatus === "SWAP_PENDING") {
        if (receiptData.status === "success") {
          setTxStatus("COMPLETED");
          // Confirm backend sync
          fetch(`${backendUrl}/api/v1/defi/swap/confirm`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chainId: activeChainId, txHash: activeTxHash })
          }).then(() => {
            // refresh balances
            refetchEthBalance();
            refetchErc20Balance();
            refetchAllowance();
          });
        } else {
          setTxStatus("FAILED");
          setErrorMessage("Swap execution transaction reverted.");
        }
      }
    }
  }, [receiptData, txStatus, activeChainId, activeTxHash, backendUrl, refetchAllowance, refetchErc20Balance, refetchEthBalance]);

  // Determine button state
  const getActionButton = () => {
    if (!isConnected) {
      return (
        <SafeWalletButton showBalance={false} />
      );
    }

    if (!chainGuard.isCorrectChain) {
      return (
        <button
          onClick={() => switchChain?.({ chainId: activeChainId })}
          className="w-full rounded-full bg-rose-600 py-3.5 text-xs font-semibold text-white transition hover:bg-rose-500"
        >
          Switch Wallet Network to {chainGuard.requiredChainName}
        </button>
      );
    }

    const currentBal = getActiveBalanceRaw();
    const sellUnits = parseUnits(sellAmountInput, sellToken?.decimals || 18);

    if (currentBal < sellUnits) {
      return (
        <button
          disabled
          className="w-full rounded-full bg-slate-800 py-3.5 text-xs font-semibold text-slate-500 cursor-not-allowed border border-white/5"
        >
          Insufficient {sellToken?.symbol} Balance
        </button>
      );
    }

    // Check allowance if required
    if (sellToken?.address !== "NATIVE" && quote && allowance !== undefined) {
      const allowed = BigInt(allowance.toString());
      const required = BigInt(quote.sellAmount);

      if (allowed < required) {
        return (
          <button
            onClick={handleApprove}
            disabled={txStatus === "AWAITING_APPROVAL_SIGNATURE" || txStatus === "APPROVAL_PENDING"}
            className="w-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 py-3.5 text-xs font-semibold text-white transition hover:opacity-95"
          >
            {txStatus === "AWAITING_APPROVAL_SIGNATURE" ? "Awaiting wallet signature…" :
             txStatus === "APPROVAL_PENDING" ? "Approving spender contract on-chain…" :
             `Approve ${sellToken.symbol} Spender`}
          </button>
        );
      }
    }

    return (
      <button
        onClick={() => setIsConfirmingModal(true)}
        disabled={isQuoting || !quote || txStatus === "AWAITING_SWAP_SIGNATURE" || txStatus === "SWAP_PENDING"}
        className="w-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 py-3.5 text-xs font-semibold text-white transition hover:opacity-95"
      >
        {isQuoting ? "Fetching routing path…" : "Swap Assets"}
      </button>
    );
  };

  const formattedOutput = quote ? parseFloat(formatUnits(BigInt(quote.expectedBuyAmount), buyToken?.decimals || 18)).toFixed(6) : "0.00";
  const formattedMin = quote ? parseFloat(formatUnits(BigInt(quote.minimumReceived), buyToken?.decimals || 18)).toFixed(6) : "0.00";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Header */}
      <header className="h-16 border-b border-white/10 bg-slate-900/40 backdrop-blur-md px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-600 p-[2px]">
            <div className="flex h-full w-full items-center justify-center rounded-[8px] bg-slate-950 text-sm font-black text-amber-400">
              W
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
                Web3 Creator Operating System
              </span>
            </div>
            <h1 className="text-sm font-bold text-white tracking-tight">WCOS DeFi Center</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-slate-900 border border-white/10 p-1.5 rounded-full text-xs">
            <Globe className="h-3.5 w-3.5 text-amber-400 ml-1.5" />
            <select
              value={selectedChain}
              onChange={(e) => handleChainChange(e.target.value)}
              className="bg-transparent text-white text-[11px] font-bold outline-none pr-2 cursor-pointer"
            >
              <option value="base-sepolia" className="bg-slate-950">Base Sepolia</option>
              <option value="base-mainnet" className="bg-slate-950">Base Mainnet</option>
              <option value="ethereum" className="bg-slate-950">Ethereum</option>
              <option value="polygon" className="bg-slate-950">Polygon</option>
              <option value="arbitrum" className="bg-slate-950">Arbitrum</option>
              <option value="optimism" className="bg-slate-950">Optimism</option>
            </select>
          </div>
          <SafeWalletButton showBalance={false} />
        </div>
      </header>

      {/* Sidebar & Workspace */}
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

            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-2 block pt-4 mb-2">DeFi modules</span>
            
            <button
              onClick={() => window.location.href = "/defi"}
              className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent transition-all"
            >
              <span className="flex items-center gap-2.5">
                <Wallet className="h-4 w-4" /> Portfolio Overview
              </span>
              <ChevronRight className="h-3 w-3 opacity-60" />
            </button>

            <button
              onClick={() => window.location.href = "/defi/swap"}
              className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 transition-all"
            >
              <span className="flex items-center gap-2.5">
                <RefreshCw className="h-4 w-4" /> Swap Assets
              </span>
              <ChevronRight className="h-3 w-3 opacity-60" />
            </button>

            <button
              onClick={() => window.location.href = "/defi/staking"}
              className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent transition-all"
            >
              <span className="flex items-center gap-2.5">
                <Layers className="h-4 w-4" /> Staking Center
              </span>
              <ChevronRight className="h-3 w-3 opacity-60" />
            </button>
          </div>
        </aside>

        {/* Console Swap Panel */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 flex flex-col items-center justify-center">
          <WalletGuard requiredFeature="DeFi Swap Module">
            <div className="max-w-md w-full rounded-3xl border border-white/10 bg-slate-900/40 p-6 space-y-4 shadow-2xl backdrop-blur-xl relative">
              
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-amber-400" /> Swap Assets
                </h3>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 text-slate-400 hover:text-white transition"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>

              {/* Slippage Settings */}
              {showSettings && (
                <div className="p-4 bg-slate-950 border border-white/10 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-white">Slippage Tolerance</h4>
                  <div className="flex gap-2">
                    {[0.1, 0.5, 1.0].map((val) => (
                      <button
                        key={val}
                        onClick={() => setSlippagePercent(val)}
                        className={`flex-1 py-1.5 rounded-xl border text-xs font-bold font-mono transition ${
                          slippagePercent === val ? "border-amber-500 bg-amber-500/10 text-amber-400" : "border-white/5 bg-slate-900 text-slate-400"
                        }`}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Swap Inputs Form */}
              <div className="space-y-3.5">
                
                {/* Pay Input */}
                <div className="rounded-2xl bg-slate-950 border border-white/5 p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Sell Amount</label>
                    <span className="text-[10px] text-slate-400 font-bold">
                      Balance: <span className="font-mono">{getActiveBalanceFormatted()}</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <input
                      type="text"
                      value={sellAmountInput}
                      onChange={(e) => setSellAmountInput(e.target.value)}
                      className="bg-transparent text-xl font-bold font-mono outline-none text-white w-full"
                      placeholder="0.0"
                    />
                    <button
                      onClick={handleMaxClick}
                      className="text-[9px] font-bold bg-slate-900 border border-white/10 px-2 py-1 rounded hover:bg-slate-800 transition text-amber-400 uppercase"
                    >
                      Max
                    </button>
                    <select
                      value={sellTokenSymbol}
                      onChange={(e) => setSellTokenSymbol(e.target.value)}
                      className="bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white outline-none cursor-pointer"
                    >
                      {tokens.map((t) => (
                        <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Arrow spacer */}
                <div className="flex justify-center -my-2.5 relative z-10">
                  <div className="h-8 w-8 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer shadow-lg">
                    <ArrowDown className="h-4 w-4" />
                  </div>
                </div>

                {/* Receive Input */}
                <div className="rounded-2xl bg-slate-950 border border-white/5 p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Expected Return</label>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-xl font-bold font-mono text-slate-300">
                      {isQuoting ? (
                        <RefreshCw className="h-4 w-4 animate-spin text-amber-500" />
                      ) : (
                        formattedOutput
                      )}
                    </div>
                    <select
                      value={buyTokenSymbol}
                      onChange={(e) => setBuyTokenSymbol(e.target.value)}
                      className="bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white outline-none cursor-pointer"
                    >
                      {tokens.map((t) => (
                        <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
                      ))}
                    </select>
                  </div>
                </div>

              </div>

              {/* Quote Path / Route display */}
              {quote && !isQuoting && (
                <div className="p-3.5 bg-slate-950/60 border border-white/5 rounded-2xl text-[10px] font-mono space-y-1.5 text-slate-400">
                  <div className="flex justify-between items-center">
                    <span>Routing Route:</span>
                    <span className="text-white capitalize">{quote.route}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Min Received:</span>
                    <span className="text-white font-bold">{formattedMin} {buyToken.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gas estimation fee:</span>
                    <span className="text-white">{quote.estimatedGasCostEth} ETH</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-white/5 text-[9px] text-slate-500">
                    <span>Freshness:</span>
                    <span className="text-amber-500">Refreshing in {countdown}s</span>
                  </div>
                </div>
              )}

              {/* Main action triggers */}
              {getActionButton()}

              {/* Status / Errors display */}
              {errorMessage && (
                <div className="p-3.5 bg-rose-500/5 border border-rose-500/20 rounded-2xl flex items-start gap-2 text-xs text-rose-400 animate-fade-in">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {quoteError && (
                <div className="p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-start gap-2 text-xs text-amber-400 animate-fade-in">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{quoteError}</span>
                </div>
              )}

              {txStatus === "APPROVAL_PENDING" && (
                <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl flex items-center gap-2 text-xs text-cyan-400 font-semibold animate-pulse">
                  <RefreshCw className="h-4 w-4 animate-spin" /> Approval pending on-chain…
                </div>
              )}

              {txStatus === "SWAP_PENDING" && (
                <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl flex items-center gap-2 text-xs text-indigo-400">
                  <RefreshCw className="h-4 w-4 animate-spin" /> Swapping on-chain — confirming receipt…
                </div>
              )}

              {txStatus === "COMPLETED" && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-2 text-emerald-400 text-xs animate-fade-in">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span>Swap Executed Successfully!</span>
                  </div>
                  <a
                    href={getExplorerTxUrl(activeChainId, activeTxHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[9px] font-mono text-emerald-500/80 truncate block underline"
                  >
                    View Tx: {activeTxHash}
                  </a>
                </div>
              )}

            </div>
          </WalletGuard>
        </main>
      </div>

      {/* Confirmation Modal */}
      {isConfirmingModal && quote && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsConfirmingModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold text-white">Confirm Token Swap</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              DEX swaps require signature execution. Please verify routing, expected return, and gas impact before continuing.
            </p>
            <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-2.5 text-xs font-mono text-slate-300">
              <div className="flex justify-between">
                <span>Sell amount:</span>
                <span className="font-bold text-white">{sellAmountInput} {sellToken.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span>Buy expected:</span>
                <span className="font-bold text-white">{formattedOutput} {buyToken.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span>Min Received:</span>
                <span className="text-white font-bold">{formattedMin} {buyToken.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span>Slippage settings:</span>
                <span className="text-amber-400 font-bold">{slippagePercent}%</span>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-2.5">
                <span>Est. Gas Fee:</span>
                <span className="font-bold text-white">{quote.estimatedGasCostEth} ETH</span>
              </div>
            </div>
            <button
              onClick={handleSwap}
              className="w-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 py-3 text-xs font-semibold text-white transition hover:opacity-95"
            >
              Sign & Execute Swap
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
