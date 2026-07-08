"use client";

import React, { useState, useEffect } from "react";
import { SafeWalletButton } from "../components/ui/SafeWalletButton";
import { useAccount } from "wagmi";
import {
  Sparkles, BarChart2, Coins, Users, Shield, ChevronRight,
  Zap, Globe, Layers, Package, ArrowRight, Star, Check,
  Bot, Cpu, Lock
} from "lucide-react";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Art Studio",
    description: "Generate stunning NFT artwork with AI. Cyberpunk, anime, abstract — one prompt away.",
    color: "from-cyan-500 to-indigo-500",
    glow: "shadow-cyan-500/20",
  },
  {
    icon: Package,
    title: "Collection Builder",
    description: "Deploy ERC-721 and ERC-1155 collections with royalties, traits, and unlockable content.",
    color: "from-indigo-500 to-fuchsia-500",
    glow: "shadow-indigo-500/20",
  },
  {
    icon: Layers,
    title: "NFT Marketplace",
    description: "List, bid, and trade NFTs with on-chain price discovery and zero hidden fees.",
    color: "from-fuchsia-500 to-rose-500",
    glow: "shadow-fuchsia-500/20",
  },
  {
    icon: Coins,
    title: "DeFi Center",
    description: "Swap tokens, stake for yield, and manage your Web3 portfolio — all in one place.",
    color: "from-amber-500 to-orange-500",
    glow: "shadow-amber-500/20",
  },
  {
    icon: Users,
    title: "DAO Governance",
    description: "Launch community DAOs with on-chain voting, proposal lifecycles, and treasury vaults.",
    color: "from-teal-500 to-emerald-500",
    glow: "shadow-teal-500/20",
  },
  {
    icon: Bot,
    title: "AI Orchestrator",
    description: "Natural language → action. Describe what to build and the AI sets it up instantly.",
    color: "from-violet-500 to-indigo-500",
    glow: "shadow-violet-500/20",
  },
];

const STATS = [
  { label: "Creators", value: "1,240+" },
  { label: "NFTs Minted", value: "48,900+" },
  { label: "Total Volume", value: "$12.4M" },
  { label: "Active DAOs", value: "18" },
];

const PLANS = [
  {
    name: "Creator Free",
    price: "Free",
    desc: "Perfect for exploring the platform.",
    features: ["5 AI art generations/month", "1 NFT collection", "Basic analytics", "Base Sepolia testnet"],
    cta: "Start Free",
    highlight: false,
  },
  {
    name: "Creator Pro",
    price: "$29/mo",
    desc: "For serious Web3 creators.",
    features: ["Unlimited AI generations", "Unlimited collections", "Advanced analytics", "DeFi & DAO access", "Creator profile", "Priority support"],
    cta: "Start Pro",
    highlight: true,
  },
  {
    name: "Studio",
    price: "$99/mo",
    desc: "For agencies and power users.",
    features: ["Everything in Pro", "Revenue splitter contracts", "Membership NFTs", "API access", "White-label dashboard", "Dedicated account manager"],
    cta: "Contact Sales",
    highlight: false,
  },
];

// Animated gradient orbs background
function OrbBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl animate-pulse" />
      <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl animate-pulse [animation-delay:1500ms]" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl animate-pulse [animation-delay:3000ms]" />
    </div>
  );
}

export default function LandingPage() {
  const { isConnected, address } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleEnterApp = () => {
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans overflow-x-hidden">

      {/* ── NAV ──────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 p-[2px]">
            <div className="flex h-full w-full items-center justify-center rounded-[8px] bg-slate-950 font-black text-cyan-400 text-sm">W</div>
          </div>
          <span className="text-sm font-black tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent">
            WCOS
          </span>
        </div>

        <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-400">
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="/learn" className="hover:text-white transition">Learn</a>
          <a href="/manual" className="hover:text-white transition">Manual</a>
          <a href="/news" className="hover:text-white transition">News</a>
          <a href="/magazine" className="hover:text-white transition">Magazine</a>
          <a href="http://localhost:3001/api/docs" target="_blank" rel="noreferrer" className="hover:text-white transition">API Docs</a>
        </div>

        <div className="flex items-center gap-3">
          {mounted && (
            <>
              <SafeWalletButton showBalance={false} />
              {isConnected && (
                <button onClick={handleEnterApp}
                  className="hidden md:flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 px-4 py-2 text-xs font-bold text-white hover:opacity-90 active:scale-95 transition">
                  Open Console <ChevronRight className="h-3 w-3" />
                </button>
              )}
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center min-h-screen pt-16 px-6 text-center">
        <OrbBackground />

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5 text-[11px] font-bold text-cyan-400 uppercase tracking-widest">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
            Now on Base Network — Phase 5 Complete
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-tight">
            The{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
              AI-Powered
            </span>
            <br />
            Web3 Creator OS
          </h1>

          <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Mint AI-generated NFTs, launch collections, run a marketplace, govern a DAO, and manage DeFi — all from a single creator operating system built on Base Network.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button onClick={handleEnterApp}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-500/25 hover:opacity-90 active:scale-95 transition">
              <Sparkles className="h-4 w-4" /> Launch Creator Console
            </button>
            <a href="#features"
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition">
              Explore Features <ChevronRight className="h-4 w-4" />
            </a>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-[11px] text-slate-500 font-semibold">
            {["Non-custodial", "Open source contracts", "Base Network", "Testnet-first"].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <Check className="h-3 w-3 text-emerald-400" /> {item}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-[10px] text-slate-600 animate-bounce">
          <ChevronRight className="h-4 w-4 rotate-90" />
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────────── */}
      <section id="stats" className="py-16 border-y border-white/5 bg-slate-900/30">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s, i) => (
            <div key={i} className="space-y-1">
              <p className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">{s.value}</p>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto space-y-14">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">
              Everything a Creator Needs
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
              Six integrated modules — AI Studio, Collections, Marketplace, DeFi, DAO, and AI Orchestrator — working together in one console.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feat, i) => (
              <div key={i}
                className={`group relative rounded-3xl border border-white/5 bg-slate-900/30 p-6 space-y-4 hover:bg-slate-900/60 transition-all duration-300 overflow-hidden`}
              >
                {/* Glow on hover */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${feat.color} rounded-3xl blur-3xl`} style={{ opacity: 0.04 }} />

                <div className={`relative h-11 w-11 rounded-2xl bg-gradient-to-tr ${feat.color} p-[2px] shadow-lg ${feat.glow}`}>
                  <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
                    <feat.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="relative space-y-1.5">
                  <h3 className="text-sm font-bold text-white">{feat.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{feat.description}</p>
                </div>
                <button
                  onClick={handleEnterApp}
                  className="relative flex items-center gap-1.5 text-[11px] font-bold text-slate-500 group-hover:text-white transition"
                >
                  Open module <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECURITY STRIP ───────────────────────────────────────────────────── */}
      <section className="py-12 border-y border-white/5 bg-slate-900/20">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Shield, title: "Non-Custodial", desc: "Your keys, your assets. WCOS never holds your funds or signs on your behalf." },
            { icon: Cpu, title: "Testnet-First", desc: "All deployments default to Base Sepolia. Zero real funds at risk during development." },
            { icon: Lock, title: "Audited Contracts", desc: "OpenZeppelin-based contracts with reentrancy guards and access controls." },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-4 p-4 rounded-2xl border border-white/5 bg-slate-900/20">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <item.icon className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">{item.title}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">Simple, Creator-First Pricing</h2>
            <p className="text-slate-400 text-sm">No lock-in. Upgrade or cancel anytime.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {PLANS.map((plan, i) => (
              <div key={i}
                className={`relative rounded-3xl border p-6 space-y-5 flex flex-col ${
                  plan.highlight
                    ? "border-indigo-500/40 bg-indigo-500/5 shadow-2xl shadow-indigo-500/10"
                    : "border-white/5 bg-slate-900/20"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 px-3 py-0.5 text-[10px] font-black text-white uppercase tracking-widest">
                      Most Popular
                    </span>
                  </div>
                )}

                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{plan.name}</p>
                  <p className="text-3xl font-black text-white mt-1">{plan.price}</p>
                  <p className="text-xs text-slate-500 mt-1">{plan.desc}</p>
                </div>

                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-xs text-slate-300">
                      <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={handleEnterApp}
                  className={`w-full rounded-full py-2.5 text-xs font-bold transition active:scale-95 ${
                    plan.highlight
                      ? "bg-gradient-to-r from-cyan-500 to-indigo-500 text-white hover:opacity-90"
                      : "border border-white/10 text-slate-300 hover:bg-white/5"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FOOTER ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 text-center relative overflow-hidden border-t border-white/5">
        <OrbBackground />
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">
            Ready to Build on Web3?
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Connect your wallet, generate your first AI NFT, and deploy your collection — all in under 5 minutes.
          </p>
          <button onClick={handleEnterApp}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 px-10 py-4 text-sm font-bold text-white shadow-2xl shadow-indigo-500/30 hover:opacity-90 active:scale-95 transition">
            <Zap className="h-4 w-4" /> Launch WCOS Console
          </button>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 bg-slate-950 py-8 px-6 text-center">
        <div className="flex flex-col md:flex-row items-center justify-between max-w-5xl mx-auto gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <div className="h-5 w-5 rounded-md bg-gradient-to-tr from-cyan-400 to-indigo-500 flex items-center justify-center text-[8px] font-black text-white">W</div>
            WCOS — Web3 Creator Operating System
          </div>
          <div className="flex items-center gap-6 text-[10px] text-slate-600 font-semibold">
            <span>Built on Base Network</span>
            <span>·</span>
            <span>Powered by OpenZeppelin</span>
            <span>·</span>
            <span>AI by Bedrock</span>
          </div>
          <p className="text-[10px] text-slate-700">© 2026 WCOS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
