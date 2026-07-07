"use client";

import React, { useState, useEffect } from "react";
import { ContentHeader } from "@/components/ui/ContentHeader";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { SearchInput } from "@/components/ui/SearchInput";
import { CategoryTabs } from "@/components/ui/CategoryTabs";
import {
  Newspaper, Zap, TrendingUp, Sparkles, Shield, Mail, 
  ArrowRight, Flame, Clock, Radio, RefreshCw
} from "lucide-react";

export default function NewsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [emailInput, setEmailInput] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [liveArticles, setLiveArticles] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

  const fetchLiveNews = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/v1/news`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((item: any, idx: number) => ({
            id: item.id || `news-${idx}`,
            title: item.title,
            description: item.summary,
            category: (item.category || "Web3").toLowerCase(),
            readTime: item.readTime || "3 min",
            author: { name: item.source || "WCOS Feed", role: "Verified Source" },
            date: new Date(item.publishedAt || Date.now()).toLocaleDateString(),
            imageUrl: item.imageUrl || "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80",
            href: item.sourceUrl || "#",
            featured: item.isFeatured || idx === 0,
          }));
          setLiveArticles(mapped);
        }
      }
    } catch {
      // Fallback to initial static articles
    }
  };

  const handleSyncNews = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(`${backendUrl}/api/v1/news/sync`, { method: "POST" });
      if (res.ok) {
        await fetchLiveNews();
      }
    } catch {
      // non-critical
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchLiveNews();
  }, []);

  const categories = [
    { id: "all", label: "All News" },
    { id: "nfts", label: "NFTs & Art", icon: Sparkles },
    { id: "defi", label: "DeFi & Yield", icon: TrendingUp },
    { id: "base", label: "Base Network", icon: Zap },
    { id: "tech", label: "AI & Tech", icon: Radio },
    { id: "security", label: "Security", icon: Shield },
  ];

  const newsArticles = [
    {
      id: "news-1",
      title: "WCOS Platform Integrates Pinata IPFS Engine for Immutable Metadata Pinning",
      description: "Creators on Base Network can now pin high-resolution AI artwork and standard EIP-721 metadata JSON directly to IPFS via Pinata API, ensuring permanent decentralized availability.",
      category: "nfts",
      readTime: "3 min",
      author: { name: "Alex Mercer", role: "Protocol Engineer" },
      date: "July 6, 2026",
      imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
      featured: true,
    },
    {
      id: "news-2",
      title: "Base Sepolia Testnet Achieves Sub-Second Finality and Lowest Gas Overhead",
      description: "Recent Base network updates reduce Layer 2 rollup submission costs by 40%, bringing minting fees down to less than $0.001 per token.",
      category: "base",
      readTime: "4 min",
      author: { name: "Elena Rostova", role: "L2 Researcher" },
      date: "July 5, 2026",
      imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80",
      featured: false,
    },
    {
      id: "news-3",
      title: "AI Generative Model Upgrade: Ultra-High Resolution Artwork Synthesis",
      description: "WCOS AI Studio incorporates seed-prompt parameter control, enabling creators to fine-tune lighting, camera lenses, and style weights before minting.",
      category: "tech",
      readTime: "5 min",
      author: { name: "David Chen", role: "AI Specialist" },
      date: "July 4, 2026",
      imageUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80",
      featured: false,
    },
    {
      id: "news-4",
      title: "DeFi Yield Pools Pass $10M Volume in Simulated Base Ecosystem Testing",
      description: "Automated Market Maker (AMM) swap vaults and staking contracts report stable APYs with zero smart contract vulnerabilities.",
      category: "defi",
      readTime: "3 min",
      author: { name: "Sarah Jenkins", role: "DeFi Analyst" },
      date: "July 3, 2026",
      imageUrl: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=800&q=80",
      featured: false,
    },
    {
      id: "news-5",
      title: "EIP-2981 Standard Royalty Compliance Guaranteed Across Marketplace Listings",
      description: "Direct contract royalty routing ensures creators receive earned secondary sales royalties without reliance on off-chain marketplace databases.",
      category: "security",
      readTime: "2 min",
      author: { name: "Marcus Thorne", role: "Security Auditor" },
      date: "July 2, 2026",
      imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80",
      featured: false,
    },
  ];

  const displayArticles = liveArticles.length > 0 ? liveArticles : newsArticles;

  const filteredArticles = displayArticles.filter((article) => {
    const matchesCategory = activeCategory === "all" || article.category === activeCategory;
    const matchesSearch =
      searchQuery === "" ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredArticle = displayArticles.find((a) => a.featured) || displayArticles[0];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubscribed(true);
      setEmailInput("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <ContentHeader activePage="news" />

      {/* Breaking News Ticker Bar */}
      <div className="bg-gradient-to-r from-cyan-950 via-indigo-950 to-slate-950 border-b border-white/10 px-6 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 px-2.5 py-0.5 text-[10px] font-black text-cyan-400 uppercase tracking-widest flex-shrink-0">
            <Radio className="h-3 w-3 animate-pulse" /> Live News
          </span>
          <p className="text-slate-300 font-mono text-[11px] truncate">
            WCOS Event Indexer live on Base Sepolia • Pinata IPFS pinning active • Zero gas overhead on L2
          </p>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative py-14 px-6 border-b border-white/5 overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-bold text-cyan-400 uppercase tracking-widest">
                <Newspaper className="h-3.5 w-3.5" /> Daily Web3 & Creator Briefing
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
                Platform & Web3{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
                  Daily News
                </span>
              </h1>
              <p className="text-slate-400 text-xs md:text-sm max-w-xl">
                Stay updated with protocol releases, Base network upgrades, AI art generator features, and market trends.
              </p>
            </div>

            <div className="w-full md:w-80">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search news updates..."
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

      {/* Main News Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* Featured Story (Shown if no filter active or matches) */}
        {activeCategory === "all" && searchQuery === "" && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-widest font-mono">
              <Flame className="h-4 w-4 text-amber-400" /> Top Lead Story
            </div>
            <ArticleCard {...featuredArticle} featured={true} />
          </section>
        )}

        {/* Article Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-cyan-400" /> Latest Protocol & Ecosystem Updates
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              {filteredArticles.length} Article(s) Found
            </span>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map((article) => (
              <ArticleCard key={article.id} {...article} />
            ))}
          </div>
        </section>

        {/* Newsletter Subscription Box */}
        <section className="rounded-3xl border border-white/10 bg-gradient-to-tr from-slate-900 via-slate-950 to-indigo-950/40 p-8 text-center space-y-6">
          <div className="max-w-xl mx-auto space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mx-auto">
              <Mail className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-black text-white">Subscribe to Web3 Daily Brief</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Get protocol news, IPFS storage updates, and AI creator tips delivered directly to your inbox.
            </p>
          </div>

          {subscribed ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold inline-flex items-center gap-2">
              ✓ Subscribed! You will receive daily creator briefings.
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="max-w-md mx-auto flex gap-2">
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter your email address..."
                className="flex-1 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                className="rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-md hover:opacity-90 transition active:scale-95"
              >
                Subscribe
              </button>
            </form>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-950 py-8 px-6 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 WCOS Hub — Web3 Creator Operating System</p>
          <div className="flex items-center gap-4 text-[11px]">
            <a href="/learn" className="hover:underline">Learn</a>
            <a href="/manual" className="hover:underline">Manual</a>
            <a href="/news" className="text-cyan-400 hover:underline">News</a>
            <a href="/magazine" className="hover:underline">Magazine</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
