"use client";

import React, { useState } from "react";
import { ContentHeader } from "@/components/ui/ContentHeader";
import { GuideCard } from "@/components/ui/GuideCard";
import { SearchInput } from "@/components/ui/SearchInput";
import {
  FileText, Wallet, Globe, ImageIcon, Sparkles, Compass, 
  ShoppingBag, Users, ShieldAlert, CheckCircle2, ArrowRight
} from "lucide-react";

export default function ManualPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const manualSteps = [
    {
      stepNumber: 1,
      title: "Create Account & Connect Web3 Wallet",
      description: "Connect your MetaMask, Rainbow, or Coinbase Wallet via RainbowKit in the top right header. Sign the non-custodial SIWE (Sign-In with Ethereum) message to authenticate your creator session without passwords.",
      icon: Wallet,
      difficulty: "Beginner" as const,
      estimatedTime: "2 min",
      actionText: "Connect Wallet",
      actionHref: "/dashboard",
    },
    {
      stepNumber: 2,
      title: "Select Network Chain & Testnet Guard",
      description: "Use the top header chain selector to switch between Base Sepolia testnet (ID 84532) and Base Mainnet (ID 84533). If your wallet is on the wrong network, tap the built-in Chain Guard button to switch automatically.",
      icon: Globe,
      difficulty: "Beginner" as const,
      estimatedTime: "1 min",
      actionText: "Check Chain Settings",
      actionHref: "/settings",
    },
    {
      stepNumber: 3,
      title: "Select Art File or Synthesize with AI Prompt",
      description: "In the AI Creator Studio, choose between 'AI Art Generator' to create artwork with seed text prompts and style presets (cyberpunk, anime, abstract), or 'Upload Image File' to upload custom PNG, JPG, GIF, WEBP, or SVG images (up to 10MB).",
      icon: ImageIcon,
      difficulty: "Beginner" as const,
      estimatedTime: "3 min",
      actionText: "Open AI Studio",
      actionHref: "/mint",
    },
    {
      stepNumber: 4,
      title: "Configure Standard NFT Metadata & Traits",
      description: "Fill in the required Asset Name, Description, Royalty Percentage (e.g. 5%), External URL, and Custom Attribute Traits (e.g. Background: Neon City, Rarity: Legendary). View live standard ERC-721 JSON formatting in real time.",
      icon: FileText,
      difficulty: "Intermediate" as const,
      estimatedTime: "2 min",
      actionText: "Configure Metadata",
      actionHref: "/mint",
    },
    {
      stepNumber: 5,
      title: "Pin Image & Metadata JSON to IPFS (Pinata)",
      description: "Click 'Upload Image & Metadata to IPFS (Pinata)'. WCOS uploads your image file buffer and generates standard NFT metadata, pinning both to the decentralized IPFS network and returning an immutable `ipfs://<hash>` URI and Pinata Gateway preview link.",
      icon: Compass,
      difficulty: "Intermediate" as const,
      estimatedTime: "2 min",
      actionText: "Upload to IPFS",
      actionHref: "/mint",
    },
    {
      stepNumber: 6,
      title: "Mint NFT Token On-Chain",
      description: "Once IPFS metadata is pinned, click 'Mint NFT'. Confirm the transaction prompt in your wallet (e.g. 0.005 ETH mint fee on Base Sepolia). The contract assigns a Token ID to your address and triggers event indexer tracking.",
      icon: Sparkles,
      difficulty: "Intermediate" as const,
      estimatedTime: "2 min",
      actionText: "Mint On-Chain",
      actionHref: "/mint",
    },
    {
      stepNumber: 7,
      title: "List NFT for Sale on Marketplace",
      description: "Navigate to your asset in the Creator Gallery or Marketplace tab. Enter your sale price in ETH and approve the audited `WcosMarketplace` contract escrow. Your token is listed for peer-to-peer trading.",
      icon: ShoppingBag,
      difficulty: "Intermediate" as const,
      estimatedTime: "2 min",
      actionText: "Explore Marketplace",
      actionHref: "/dashboard",
    },
    {
      stepNumber: 8,
      title: "Purchase NFTs & Receive Royalty Proceeds",
      description: "Browse active marketplace listings and tap 'Buy NFT' to execute the `buyToken()` contract call. Funds are transferred to the seller, EIP-2981 royalties are paid automatically, and the NFT is delivered to your wallet.",
      icon: ShoppingBag,
      difficulty: "Intermediate" as const,
      estimatedTime: "2 min",
      actionText: "Browse Items",
      actionHref: "/dashboard",
    },
    {
      stepNumber: 9,
      title: "Participate in DAO Proposals & Voting",
      description: "Open the DAO Governance module to submit governance proposals or vote on active protocol upgrades using token-weighted governance votes (`WcosGovernor`).",
      icon: Users,
      difficulty: "Advanced" as const,
      estimatedTime: "4 min",
      actionText: "DAO Center",
      actionHref: "/dao",
    },
  ];

  const safetyTips = [
    "Never share your 12 or 24-word Secret Recovery Phrase with anyone. WCOS team members will NEVER ask for it.",
    "Always check your wallet prompt details (contract address, gas fee, chain ID) before signing transactions.",
    "Use testnets (Base Sepolia) first to familiarize yourself with minting and marketplace listing without real funds.",
    "Verify IPFS preview links to ensure metadata JSON adheres to standard NFT formatting before triggering on-chain minting.",
  ];

  const filteredSteps = manualSteps.filter(
    (s) =>
      searchQuery === "" ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <ContentHeader activePage="manual" />

      {/* Hero Section */}
      <section className="relative py-16 px-6 text-center border-b border-white/5 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-bold text-indigo-400 uppercase tracking-widest">
            <FileText className="h-3.5 w-3.5" /> Official Platform User Manual
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            WCOS System{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
              Operating Manual
            </span>
          </h1>

          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Step-by-step documentation for minting NFTs, pinning IPFS metadata, listing on the marketplace, and governing DAOs.
          </p>

          <div className="max-w-xl mx-auto pt-2">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search manual steps e.g. connect wallet, IPFS upload, marketplace..."
            />
          </div>
        </div>
      </section>

      {/* Main Manual Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* Step Guides Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-cyan-400" /> Step-by-Step Execution Guides
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              {filteredSteps.length} Step(s) Available
            </span>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSteps.map((step) => (
              <GuideCard key={step.stepNumber} {...step} />
            ))}
          </div>
        </div>

        {/* Safety & Security Tips Banner */}
        <section className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Web3 Security & Safety Tips</h2>
              <p className="text-xs text-amber-400/80">Essential guidelines to keep your digital assets and keys safe.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {safetyTips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 rounded-2xl border border-white/5 bg-slate-950/60">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Action CTAs */}
        <section className="rounded-3xl border border-white/10 bg-slate-900/40 p-8 text-center space-y-6">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl font-black text-white">Ready to Launch Your Creator Workflow?</h2>
            <p className="text-xs text-slate-400">Jump straight into the WCOS Creator Studio to upload artwork and pin IPFS metadata.</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => (window.location.href = "/mint")}
              className="rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-lg hover:opacity-90 transition active:scale-95 flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" /> Start Minting
            </button>
            <button
              onClick={() => (window.location.href = "/learn")}
              className="rounded-full border border-white/10 bg-slate-900 px-6 py-3 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-2"
            >
              <FileText className="h-4 w-4" /> Learn Concepts
            </button>
            <button
              onClick={() => (window.location.href = "/dashboard")}
              className="rounded-full border border-white/10 bg-slate-900 px-6 py-3 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-2"
            >
              <ShoppingBag className="h-4 w-4" /> Explore Marketplace
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-950 py-8 px-6 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 WCOS Hub — Web3 Creator Operating System</p>
          <div className="flex items-center gap-4 text-[11px]">
            <a href="/learn" className="hover:underline">Learn</a>
            <a href="/manual" className="text-cyan-400 hover:underline">Manual</a>
            <a href="/news" className="hover:underline">News</a>
            <a href="/magazine" className="hover:underline">Magazine</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
