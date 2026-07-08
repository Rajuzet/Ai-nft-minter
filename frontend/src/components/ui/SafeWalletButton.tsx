"use client";

import React, { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet, AlertTriangle } from "lucide-react";

interface SafeWalletButtonProps {
  showBalance?: boolean;
  chainStatus?: "icon" | "name" | "full" | "none";
  accountStatus?: "avatar" | "address" | "full";
  className?: string;
}

export function SafeWalletButton({
  showBalance = false,
  className = "",
}: SafeWalletButtonProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-9 w-32 bg-slate-900 border border-white/10 rounded-full animate-pulse flex items-center justify-center text-[10px] text-slate-500 font-mono">
        Loading Wallet…
      </div>
    );
  }

  return (
    <div className={className}>
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted: innerMounted,
        }) => {
          const ready = innerMounted && authenticationStatus !== "loading";
          const connected =
            ready &&
            account &&
            chain &&
            (!authenticationStatus ||
              authenticationStatus === "authenticated");

          if (!ready) {
            return (
              <div className="h-9 w-32 bg-slate-900 border border-white/10 rounded-full animate-pulse flex items-center justify-center text-[10px] text-slate-500 font-mono">
                Loading Wallet…
              </div>
            );
          }

          if (!connected) {
            return (
              <button
                onClick={openConnectModal}
                type="button"
                className="rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 flex items-center gap-1.5 transition shadow-lg shadow-indigo-500/20 active:scale-95"
              >
                <Wallet className="h-3.5 w-3.5" />
                Connect Wallet
              </button>
            );
          }

          if (chain.unsupported) {
            return (
              <button
                onClick={openChainModal}
                type="button"
                className="rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-semibold text-xs px-4 py-2 flex items-center gap-1.5 hover:bg-rose-500/20 transition active:scale-95 animate-pulse"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                Wrong Network
              </button>
            );
          }

          return (
            <div className="flex items-center gap-2">
              {/* Chain Selector Trigger */}
              <button
                onClick={openChainModal}
                style={{ display: "flex", alignItems: "center" }}
                type="button"
                className="hidden md:flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-white/10 px-3 py-1.5 rounded-full text-xs text-white transition active:scale-95"
              >
                {chain.hasIcon && (
                  <div
                    style={{
                      background: chain.iconBackground,
                      width: 14,
                      height: 14,
                      borderRadius: 999,
                      overflow: "hidden",
                    }}
                  >
                    {chain.iconUrl && (
                      <img
                        alt={chain.name ?? "Chain icon"}
                        src={chain.iconUrl}
                        style={{ width: 14, height: 14 }}
                      />
                    )}
                  </div>
                )}
                <span className="font-bold text-[11px]">{chain.name}</span>
              </button>

              {/* Account Details Trigger */}
              <button
                onClick={openAccountModal}
                type="button"
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-white/10 px-3 py-1.5 rounded-full text-xs text-white transition active:scale-95"
              >
                {account.ensAvatar ? (
                  <img
                    src={account.ensAvatar}
                    alt={account.ensName ?? "Avatar"}
                    className="h-4.5 w-4.5 rounded-full border border-white/20"
                  />
                ) : (
                  <div className="h-4 w-4 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-500 border border-white/20" />
                )}
                <span className="font-mono font-bold text-[11px]">
                  {account.displayName}
                </span>
                {(showBalance || true) && account.displayBalance && (
                  <span className="hidden sm:inline text-slate-400 font-semibold border-l border-white/10 pl-2">
                    {account.displayBalance}
                  </span>
                )}
              </button>
            </div>
          );
        }}
      </ConnectButton.Custom>
    </div>
  );
}

export default SafeWalletButton;
