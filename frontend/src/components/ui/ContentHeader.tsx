"use client";

import React, { useState } from "react";
import { SafeWalletButton } from "./SafeWalletButton";
import { Sparkles, BookOpen, FileText, Newspaper, Compass, ChevronRight, Menu, X, Rocket } from "lucide-react";

interface ContentHeaderProps {
  activePage?: "learn" | "manual" | "news" | "magazine";
}

export function ContentHeader({ activePage }: ContentHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "learn", label: "Learn", icon: BookOpen, href: "/learn" },
    { id: "manual", label: "User Manual", icon: FileText, href: "/manual" },
    { id: "news", label: "Daily News", icon: Newspaper, href: "/news" },
    { id: "magazine", label: "Magazine", icon: Compass, href: "/magazine" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => (window.location.href = "/")}>
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 p-[2px] shadow-lg shadow-cyan-500/10">
            <div className="flex h-full w-full items-center justify-center rounded-[9px] bg-slate-950 text-xs font-black text-cyan-400">
              W
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent">
                WCOS Hub
              </span>
              <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-[9px] text-cyan-400 font-mono">
                Knowledge Base
              </span>
            </div>
          </div>
        </div>

        {/* Navigation links - desktop */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 border border-white/10 p-1 rounded-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                  isActive
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => (window.location.href = "/mint")}
            className="hidden lg:flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-md hover:opacity-90 transition active:scale-95"
          >
            <Sparkles className="h-3.5 w-3.5" /> Start Minting
          </button>

          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="hidden sm:flex items-center gap-1 rounded-full border border-white/10 bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            Console <ChevronRight className="h-3 w-3 opacity-60" />
          </button>

          <div className="scale-90 origin-right">
            <SafeWalletButton showBalance={false} />
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden pt-4 pb-2 border-t border-white/10 mt-3 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-xs font-semibold ${
                  isActive ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-slate-300 hover:bg-white/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" /> {item.label}
                </span>
                <ChevronRight className="h-3.5 w-3.5 opacity-60" />
              </a>
            );
          })}
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => (window.location.href = "/mint")}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 py-2.5 text-xs font-bold text-white text-center flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" /> Start Minting NFTs
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
