"use client";

import React, { useState, useEffect } from "react";
import { ContentHeader } from "@/components/ui/ContentHeader";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { SearchInput } from "@/components/ui/SearchInput";
import { CategoryTabs } from "@/components/ui/CategoryTabs";
import {
  Compass, Feather, Sparkles, Code, TrendingUp, Users, 
  BookOpen, Bookmark, UserCheck, Star, ShoppingBag, FileText
} from "lucide-react";

export default function MagazinePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [liveArticles, setLiveArticles] = useState<any[]>([]);

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

  useEffect(() => {
    fetch(`${backendUrl}/api/v1/magazine`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((item: any, idx: number) => ({
            id: item.id || `mag-${idx}`,
            title: item.title,
            description: item.excerpt,
            category: item.category,
            readTime: item.readTime || "5 min",
            author: {
              name: item.authorName || "WCOS Editorial",
              role: item.authorRole || "Core Writer",
              avatarUrl: item.authorAvatar,
            },
            date: new Date(item.publishedAt || Date.now()).toLocaleDateString(),
            imageUrl: item.imageUrl || "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80",
            featured: item.isFeatured || idx === 0,
          }));
          setLiveArticles(mapped);
        }
      })
      .catch(() => {});
  }, [backendUrl]);

  const categories = [
    { id: "all", label: "All Essays" },
    { id: "founder-notes", label: "Founder Notes", icon: Feather },
    { id: "artist-spotlight", label: "Artist Spotlight", icon: Sparkles },
    { id: "web3-deep-dives", label: "Web3 Deep Dives", icon: Code },
    { id: "defi-strategies", label: "DeFi Strategies", icon: TrendingUp },
    { id: "dao-governance", label: "DAO Governance", icon: Users },
  ];

  const magazineArticles = [
    {
      id: "mag-1",
      title: "Founder Notes: Building a Non-Custodial Creator OS on Base Network",
      description: "Why we chose Base Layer 2, SIWE Sign-In with Ethereum, Pinata IPFS pinning, and standard ERC-721 royalties to empower digital creators without corporate lock-in.",
      category: "founder-notes",
      readTime: "8 min",
      author: { name: "WCOS Founder", role: "Core Architect", avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=FounderWCOS" },
      date: "July 2026 Issue",
      imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80",
      featured: true,
    },
    {
      id: "mag-2",
      title: "Artist Spotlight: How Cyber-Visualist Nya Generates & Mints 1-of-1 AI Collectibles",
      description: "An inside look at Nya's workflow — combining custom seed prompts, IPFS Pinata metadata pinning, and automated Base Sepolia smart contract deployment.",
      category: "artist-spotlight",
      readTime: "6 min",
      author: { name: "Maya Lin", role: "Editorial Director" },
      date: "July 2026 Issue",
      imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
      featured: false,
    },
    {
      id: "mag-3",
      title: "Web3 Deep Dive: How Smart Contract Escrows Eliminate Counterparty Risk in NFT Marketplaces",
      description: "A technical breakdown of atomic swaps, EIP-2981 royalty calculations, and non-custodial token escrow mechanics built into WCOS Marketplace.",
      category: "web3-deep-dives",
      readTime: "10 min",
      author: { name: "Dr. Aris Vance", role: "Smart Contract Lead" },
      date: "June 2026 Issue",
      imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80",
      featured: false,
    },
    {
      id: "mag-4",
      title: "DeFi Strategy Basics: Understanding Automated Market Makers & Staking Vault Yields",
      description: "Learn how constant product market makers (x * y = k) calculate token swap slippage and how creator vaults generate staking rewards safely.",
      category: "defi-strategies",
      readTime: "7 min",
      author: { name: "Kaito Tanaka", role: "Financial Systems Lead" },
      date: "June 2026 Issue",
      imageUrl: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=800&q=80",
      featured: false,
    },
    {
      id: "mag-5",
      title: "DAO Governance Guide: Designing Tokenomics & Proposal Quorum Thresholds",
      description: "Best practices for building sustainable decentralized organizations: setting proposal vote delays, quorum minimums, and execution timelocks.",
      category: "dao-governance",
      readTime: "9 min",
      author: { name: "Sophia Martinez", role: "Governance Researcher" },
      date: "May 2026 Issue",
      imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
      featured: false,
    },
  ];

  const displayArticles = liveArticles.length > 0 ? liveArticles : magazineArticles;

  const filteredArticles = displayArticles.filter((article) => {
    const matchesCategory = activeCategory === "all" || article.category === activeCategory;
    const matchesSearch =
      searchQuery === "" ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredEssay = displayArticles.find((a) => a.featured) || displayArticles[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <ContentHeader activePage="magazine" />

      {/* Hero Section */}
      <section className="relative py-16 px-6 border-b border-white/5 overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-4 py-1.5 text-xs font-bold text-fuchsia-400 uppercase tracking-widest">
                <Compass className="h-3.5 w-3.5" /> Editorial Publication & Essays
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
                WCOS Creator{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
                  Magazine
                </span>
              </h1>
              <p className="text-slate-400 text-xs md:text-sm max-w-xl">
                Long-form essays, founder notes, artist spotlights, DeFi strategy guides, and DAO governance breakdowns.
              </p>
            </div>

            <div className="w-full md:w-80">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search essays & spotlights..."
              />
            </div>
          </div>

          <CategoryTabs
            categories={categories}
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
          />
        </div>
      </section>

      {/* Main Magazine Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* Cover Feature */}
        {activeCategory === "all" && searchQuery === "" && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-fuchsia-400 uppercase tracking-widest font-mono">
              <Star className="h-4 w-4 text-fuchsia-400 fill-fuchsia-400" /> Issue Cover Feature
            </div>
            <ArticleCard {...featuredEssay} featured={true} />
          </section>
        )}

        {/* Essays Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-cyan-400" /> Featured Articles & Deep Dives
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              {filteredArticles.length} Essay(s)
            </span>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map((article) => (
              <ArticleCard key={article.id} {...article} />
            ))}
          </div>
        </section>

        {/* Call to Action Banner */}
        <section className="rounded-3xl border border-white/10 bg-slate-900/40 p-8 text-center space-y-6">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl font-black text-white">Inspired by Web3 Creators?</h2>
            <p className="text-xs text-slate-400">Synthesize your own AI artwork, pin metadata to IPFS, and launch your collection today.</p>
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
          <p>© 2026 WCOS Magazine — Web3 Creator Operating System</p>
          <div className="flex items-center gap-4 text-[11px]">
            <a href="/learn" className="hover:underline">Learn</a>
            <a href="/manual" className="hover:underline">Manual</a>
            <a href="/news" className="hover:underline">News</a>
            <a href="/magazine" className="text-cyan-400 hover:underline">Magazine</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
