"use client";

import React, { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Check, AlertTriangle, Loader2 } from "lucide-react";
import { useCurrentChain, useSwitchChain } from "../../lib/useWallet";
import { WCOS_CHAINS } from "../../lib/web3/config/chains";

export function ChainSelector() {
  const { id: currentChainId, name: currentChainName, isSupported } = useCurrentChain();
  const { switchChain, isSwitching, error } = useSwitchChain();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = async (chainId: number) => {
    if (chainId === currentChainId) return;
    setIsOpen(false);
    await switchChain(chainId);
  };

  const activeChainConfig = currentChainId ? WCOS_CHAINS[currentChainId] : undefined;

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all active:scale-95 ${
          !isSupported
            ? "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
            : "bg-slate-900/80 hover:bg-slate-800/80 border-white/10 text-white"
        }`}
      >
        {!isSupported ? (
          <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
        ) : (
          <Globe className="h-3.5 w-3.5 text-cyan-400" />
        )}
        <span className="truncate max-w-[100px] sm:max-w-none">
          {currentChainName}
        </span>
        {activeChainConfig && (
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase ${
            activeChainConfig.isTestnet 
              ? "bg-amber-500/15 text-amber-400 border border-amber-500/20" 
              : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
          }`}>
            {activeChainConfig.isTestnet ? "Testnet" : "Mainnet"}
          </span>
        )}
        <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl border border-white/10 bg-slate-950/95 backdrop-blur-xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-2 border-b border-white/5 mb-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Select Network</span>
            {!isSupported && currentChainId && (
              <div className="mt-1 text-[10px] text-rose-400 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Connected chain is unsupported.
              </div>
            )}
          </div>

          <div className="space-y-1 max-h-64 overflow-y-auto">
            {Object.values(WCOS_CHAINS).map((config) => {
              const isSelected = config.id === currentChainId;
              const hasRpc = !!config.rpcUrl;
              const isChainEnabled = config.enabled;

              return (
                <button
                  key={config.id}
                  onClick={() => isChainEnabled && handleSelect(config.id)}
                  disabled={!isChainEnabled}
                  type="button"
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-left transition-all ${
                    isSelected
                      ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20"
                      : isChainEnabled
                      ? "hover:bg-slate-900/60 text-slate-300 hover:text-white"
                      : "opacity-40 cursor-not-allowed text-slate-500"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Circle Chain Icon Fallback */}
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isSelected 
                        ? "bg-indigo-500 text-white" 
                        : "bg-slate-900 text-slate-400"
                    }`}>
                      {config.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold">{config.name}</span>
                        <span className="text-[8px] opacity-60">({config.chain.nativeCurrency?.symbol || "ETH"})</span>
                      </div>
                      {!isChainEnabled && (
                        <div className="text-[9px] text-amber-500 font-semibold mt-0.5">
                          {!hasRpc ? "Disabled: Missing RPC" : "Disabled"}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                      config.isTestnet 
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/10" 
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10"
                    }`}>
                      {config.isTestnet ? "Test" : "Live"}
                    </span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-indigo-400" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Action/Error Notification Footer */}
          {(isSwitching || error) && (
            <div className="mt-2 p-2 border-t border-white/5 text-[10px] text-center">
              {isSwitching && (
                <div className="flex items-center justify-center gap-1.5 text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                  <span>Confirm in wallet...</span>
                </div>
              )}
              {error && (
                <span className="text-rose-400 font-medium truncate block">
                  {typeof error === "string" ? error : error.message || "Switch failed"}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ChainSelector;
