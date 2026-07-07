"use client";

import React, { useState } from "react";
import { ContentHeader } from "@/components/ui/ContentHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { CategoryTabs } from "@/components/ui/CategoryTabs";
import {
  BookOpen, Sparkles, Wallet, Coins, Layers, Users, Shield, Zap, 
  HelpCircle, ChevronDown, ChevronUp, ArrowRight, CheckCircle2, ShoppingBag, FileText
} from "lucide-react";

export default function LearnPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const categories = [
    { id: "all", label: "All Topics" },
    { id: "nfts", label: "NFTs & Art", icon: Sparkles },
    { id: "wallets", label: "Wallets & Gas", icon: Wallet },
    { id: "dao", label: "DAOs & Governance", icon: Users },
    { id: "defi", label: "DeFi & Yield", icon: Coins },
  ];

  const concepts = [
    {
      id: "nft",
      category: "nfts",
      title: "What is an NFT?",
      icon: Sparkles,
      color: "from-cyan-500 to-indigo-500",
      description:
        "An NFT (Non-Fungible Token) is a unique digital asset verified on a blockchain smart contract. Unlike cryptocurrency tokens (like ETH or BTC) where every coin is identical, NFTs have distinct metadata, token IDs, and provenances making them ideal for digital artwork, collectibles, domain names, and access passes.",
      points: [
        "Unique Token ID: Every NFT has an unalterable identifier on-chain.",
        "Immutability: Provenance and history are permanent on Base network.",
        "Standards: ERC-721 for single items, ERC-1155 for multi-edition series.",
      ],
    },
    {
      id: "wallet",
      category: "wallets",
      title: "What is a Web3 Wallet?",
      icon: Wallet,
      color: "from-indigo-500 to-fuchsia-500",
      description:
        "A Web3 wallet (such as Rainbow, MetaMask, or Coinbase Wallet) is your non-custodial digital vault and cryptographic identity. Instead of relying on a username and password owned by a corporation, your wallet holds public/private key pairs that sign transactions directly on the blockchain.",
      points: [
        "Non-Custodial: You hold secret recovery phrases — WCOS never controls your keys.",
        "Sign-In with Ethereum (SIWE): Authenticate securely without password risks.",
        "Asset Custody: Holds your ETH, tokens, and AI-generated NFTs safely.",
      ],
    },
    {
      id: "gas",
      category: "wallets",
      title: "What is a Gas Fee?",
      icon: Zap,
      color: "from-amber-500 to-orange-500",
      description:
        "Gas fees are network execution costs paid to validators who process and secure blockchain transactions. On Layer 2 networks like Base Sepolia and Base Mainnet, gas fees are up to 100x lower than Ethereum mainnet, costing just fractions of a cent.",
      points: [
        "Execution Cost: Covers computational resources needed by smart contracts.",
        "Base Network L2: Low latency, near-zero cost per transaction.",
        "Transparent: Estimated automatically in your wallet before signing.",
      ],
    },
    {
      id: "minting",
      category: "nfts",
      title: "What is Minting?",
      icon: Layers,
      color: "from-emerald-500 to-teal-500",
      description:
        "Minting is the process of writing your AI-generated artwork and metadata onto the blockchain. When you click Mint on WCOS, the contract assigns a unique Token ID to your wallet address and links the artwork's IPFS URI permanently.",
      points: [
        "On-Chain Record: Your address is set as the initial creator & owner.",
        "Metadata Pinning: Image & traits are stored decentrally via IPFS Pinata.",
        "Instant Ownership: Transfer, hold, or trade immediately after confirmation.",
      ],
    },
    {
      id: "listing",
      category: "nfts",
      title: "What is Listing & Marketplace Trading?",
      icon: ShoppingBag,
      color: "from-fuchsia-500 to-rose-500",
      description:
        "Listing an NFT means placing it for sale in a smart contract marketplace escrow. Buyers can purchase your item directly with ETH, and the marketplace contract automatically transfers the token to the buyer while sending sales proceeds and creator royalties to you.",
      points: [
        "Escrow Protection: Tokens are safely held by the audited marketplace contract.",
        "Creator Royalties: Automated EIP-2981 royalty payouts on secondary sales.",
        "Zero Hidden Fees: Direct peer-to-peer execution without middleman delays.",
      ],
    },
    {
      id: "dao",
      category: "dao",
      title: "What is a DAO?",
      icon: Users,
      color: "from-teal-500 to-emerald-500",
      description:
        "A DAO (Decentralized Autonomous Organization) is a community led by smart contracts instead of executive managers. Token holders can submit proposals, cast token-weighted votes, and execute treasury payouts automatically based on community consensus.",
      points: [
        "Governance Tokens: Voting weight corresponds to your held governance tokens.",
        "On-Chain Voting: Transparent, verifiable proposal lifecycles.",
        "Treasury Vaults: Community funds managed by smart contract rules.",
      ],
    },
    {
      id: "defi",
      category: "defi",
      title: "What is DeFi?",
      icon: Coins,
      color: "from-cyan-500 to-blue-500",
      description:
        "DeFi (Decentralized Finance) replaces traditional financial intermediaries with automated smart contracts. Users can swap tokens instantly, stake assets to earn yield rewards, and participate in liquidity pools without bank approvals.",
      points: [
        "Instant Swaps: Automated Market Maker (AMM) token exchange.",
        "Yield Staking: Earn rewards on held platform tokens.",
        "Permissionless: Accessible 24/7 to anyone with a Web3 wallet.",
      ],
    },
    {
      id: "platform",
      category: "all",
      title: "How Does the WCOS Platform Work?",
      icon: Shield,
      color: "from-violet-500 to-indigo-500",
      description:
        "WCOS brings AI synthesis, IPFS decentralized storage, Base smart contracts, and marketplace escrow into a single unified workspace. You generate artwork with AI prompts, pin standard metadata to IPFS via Pinata, mint on Base network, and trade seamlessly.",
      points: [
        "1. AI Art Studio: Synthesize artwork using text prompts & style presets.",
        "2. IPFS Metadata: Pin standard OpenSea-compatible JSON to Pinata.",
        "3. Base Network Mint: On-chain EIP-721 minting with full royalty support.",
        "4. Marketplace & DAO: List tokens for sale or participate in governance.",
      ],
    },
  ];

  const faqs = [
    {
      q: "Do I need real money or crypto to try WCOS?",
      a: "No! WCOS defaults to the Base Sepolia testnet. You can request free testnet ETH from a Sepolia faucet to test AI generation, metadata pinning, minting, and trading with zero financial risk.",
    },
    {
      q: "Where is my NFT artwork image actually stored?",
      a: "Images and JSON metadata are pinned to IPFS (InterPlanetary File System) using Pinata. This ensures your artwork remains available on a decentralized network even if local servers are offline.",
    },
    {
      q: "What is the difference between ERC-721 and ERC-1155?",
      a: "ERC-721 represents unique 1-of-1 assets where every token has an individual Token ID. ERC-1155 allows semi-fungible multi-edition tokens, ideal for gaming passes or series items.",
    },
    {
      q: "How do creator royalties work on secondary sales?",
      a: "WCOS smart contracts implement the EIP-2981 royalty standard. When an NFT is sold on the marketplace, the specified royalty percentage (e.g. 5%) is automatically routed to the creator's wallet.",
    },
  ];

  const filteredConcepts = concepts.filter((c) => {
    const matchesCategory = activeCategory === "all" || c.category === activeCategory;
    const matchesSearch =
      searchQuery === "" ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <ContentHeader activePage="learn" />

      {/* Hero Section */}
      <section className="relative py-16 px-6 text-center border-b border-white/5 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-bold text-cyan-400 uppercase tracking-widest">
            <BookOpen className="h-3.5 w-3.5" /> Web3 & Creator Economy Knowledge Base
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            Learn How{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
              Web3 & NFTs Work
            </span>
          </h1>

          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about NFTs, Web3 wallets, gas fees, smart contracts, DAOs, and creator monetization on Base Network.
          </p>

          {/* Search & Category Filter Controls */}
          <div className="max-w-2xl mx-auto space-y-4 pt-4">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search concepts e.g. What is gas fee, IPFS, DAO..."
            />
            <CategoryTabs
              categories={categories}
              activeCategory={activeCategory}
              onSelect={setActiveCategory}
            />
          </div>
        </div>
      </section>

      {/* Main Concepts Grid */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 space-y-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredConcepts.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="rounded-3xl border border-white/5 bg-slate-900/30 p-6 flex flex-col justify-between space-y-5 transition-all duration-300 hover:border-cyan-500/30 hover:bg-slate-900/50"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`h-10 w-10 rounded-2xl bg-gradient-to-tr ${item.color} p-[1px] shadow-lg`}>
                      <div className="h-full w-full rounded-[14px] bg-slate-950 flex items-center justify-center text-cyan-400">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider">
                      {item.category}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white tracking-tight">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                </div>

                <div className="pt-4 border-t border-white/5 space-y-2">
                  {item.points.map((pt, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-300 leading-tight">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <section className="rounded-3xl border border-white/5 bg-slate-900/20 p-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
              <HelpCircle className="h-5 w-5 text-cyan-400" /> Frequently Asked Questions
            </h2>
            <p className="text-xs text-slate-400">Common questions about minting, storage, and testnets.</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-2xl border border-white/5 bg-slate-950 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full px-5 py-4 text-left text-xs font-bold text-white flex items-center justify-between gap-4 hover:bg-white/5 transition"
                >
                  <span>{faq.q}</span>
                  {expandedFaq === i ? (
                    <ChevronUp className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-500 flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === i && (
                  <div className="px-5 pb-4 text-xs text-slate-400 border-t border-white/5 pt-3 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Clear Call-To-Action Banner */}
        <section className="rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-cyan-950/40 via-indigo-950/40 to-slate-950 p-8 text-center space-y-6">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Ready to Put Knowledge into Action?
            </h2>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              Mint your first AI-generated NFT, explore marketplace listings, or follow the step-by-step user manual.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => (window.location.href = "/mint")}
              className="rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-lg hover:opacity-90 transition active:scale-95 flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" /> Start Minting
            </button>
            <button
              onClick={() => (window.location.href = "/manual")}
              className="rounded-full border border-white/10 bg-slate-900 px-6 py-3 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-2"
            >
              <FileText className="h-4 w-4" /> Read Manual
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
            <a href="/learn" className="text-cyan-400 hover:underline">Learn</a>
            <a href="/manual" className="hover:underline">Manual</a>
            <a href="/news" className="hover:underline">News</a>
            <a href="/magazine" className="hover:underline">Magazine</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
