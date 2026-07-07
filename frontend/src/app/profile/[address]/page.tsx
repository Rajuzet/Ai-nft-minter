"use client";

import React, { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import {
  Globe, Twitter, Disc3, Instagram, Copy, CheckCircle2,
  Sparkles, BarChart2, Users, Award, Package, DollarSign,
  ChevronRight, Activity, Shield, ExternalLink, Loader2, Edit3
} from "lucide-react";

interface CreatorProfile {
  address: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  website?: string;
  twitter?: string;
  discord?: string;
  instagram?: string;
  verified: boolean;
  joinedAt: string;
  stats: {
    totalNftsMinted: number;
    totalCollections: number;
    totalRevenue: string;
    totalRoyalties: string;
    totalHolders: number;
    avgSalePrice: string;
  };
  featuredCollections: Array<{
    name: string;
    symbol: string;
    coverImage: string;
    minted: number;
    floorPrice: string;
  }>;
  recentActivity: Array<{
    type: "mint" | "sale" | "listing" | "dao-vote";
    description: string;
    timestamp: string;
    txHash?: string;
  }>;
}

const activityColors: Record<string, string> = {
  "mint":      "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  "sale":      "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  "listing":   "text-amber-400 bg-amber-500/10 border-amber-500/20",
  "dao-vote":  "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20",
};

const activityLabels: Record<string, string> = {
  "mint": "Mint", "sale": "Sale", "listing": "Listed", "dao-vote": "DAO Vote",
};

export default function CreatorProfilePage({ params }: { params: Promise<{ address: string }> }) {
  const { address: connectedAddress } = useAccount();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
  const resolvedParams = React.use(params);
  const profileAddress = resolvedParams.address;
  const isOwner = connectedAddress?.toLowerCase() === profileAddress?.toLowerCase();

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${backendUrl}/api/v1/profile/${profileAddress}`);
        if (res.ok) setProfile(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (profileAddress) fetchProfile();
  }, [profileAddress, backendUrl]);

  const copyAddress = () => {
    navigator.clipboard.writeText(profileAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <p>Profile not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">

      {/* Header Nav */}
      <header className="h-14 border-b border-white/10 bg-slate-900/40 backdrop-blur-md px-6 flex items-center justify-between z-10 sticky top-0">
        <button onClick={() => window.location.href = "/dashboard"}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 p-[1.5px]">
            <div className="flex h-full w-full items-center justify-center rounded-[5px] bg-slate-950 text-[10px] font-black text-cyan-400">W</div>
          </div>
          WCOS
        </button>
        <div className="flex items-center gap-3">
          {isOwner && (
            <button
              onClick={() => window.location.href = "/settings"}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              <Edit3 className="h-3 w-3" /> Edit Profile
            </button>
          )}
          <ConnectButton showBalance={false} chainStatus="icon" />
        </div>
      </header>

      {/* Banner */}
      <div className="relative h-48 w-full bg-gradient-to-r from-indigo-900/60 via-slate-900 to-fuchsia-900/50 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.25),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(56,189,248,0.2),transparent_60%)]" />
        {profile.bannerUrl && (
          <img src={profile.bannerUrl} alt="banner" className="h-full w-full object-cover absolute inset-0" />
        )}
      </div>

      {/* Profile header */}
      <div className="max-w-4xl mx-auto px-6">
        <div className="relative -mt-14 flex flex-col sm:flex-row sm:items-end gap-5 pb-6 border-b border-white/5">

          {/* Avatar */}
          <div className="h-28 w-28 rounded-3xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 p-1 flex-shrink-0 shadow-xl shadow-indigo-500/25">
            <div className="h-full w-full rounded-[20px] overflow-hidden bg-slate-950">
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="h-full w-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${profileAddress}`; }}
              />
            </div>
          </div>

          {/* Name + Social */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">{profile.displayName}</h1>
              {profile.verified && (
                <span className="flex items-center gap-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 text-[10px] font-bold text-cyan-400">
                  <Shield className="h-2.5 w-2.5" /> VERIFIED
                </span>
              )}
            </div>

            {/* Address + Copy */}
            <button onClick={copyAddress}
              className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 hover:text-slate-300 transition">
              {profileAddress.substring(0, 8)}…{profileAddress.slice(-6)}
              {copied ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            </button>

            {/* Social links */}
            <div className="flex flex-wrap items-center gap-3">
              {profile.twitter && (
                <a href={`https://twitter.com/${profile.twitter}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-400 transition">
                  <Twitter className="h-3.5 w-3.5" /> @{profile.twitter}
                </a>
              )}
              {profile.discord && (
                <a href="#" className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-400 transition">
                  <Disc3 className="h-3.5 w-3.5" /> {profile.discord}
                </a>
              )}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition">
                  <Globe className="h-3.5 w-3.5" /> Website
                </a>
              )}
              <span className="text-[10px] text-slate-600">Joined {profile.joinedAt}</span>
            </div>

            {profile.bio && (
              <p className="text-xs text-slate-400 leading-relaxed max-w-lg">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 py-6 border-b border-white/5">
          {[
            { label: "NFTs Minted",   value: profile.stats.totalNftsMinted,     icon: Sparkles,   color: "text-cyan-400" },
            { label: "Collections",   value: profile.stats.totalCollections,     icon: Package,    color: "text-fuchsia-400" },
            { label: "Total Revenue", value: profile.stats.totalRevenue,         icon: DollarSign, color: "text-emerald-400" },
            { label: "Royalties",     value: profile.stats.totalRoyalties,       icon: Award,      color: "text-amber-400" },
            { label: "Holders",       value: profile.stats.totalHolders,         icon: Users,      color: "text-indigo-400" },
            { label: "Avg Sale",      value: profile.stats.avgSalePrice,         icon: BarChart2,  color: "text-teal-400" },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl bg-slate-900/30 border border-white/5 p-3.5 space-y-1.5">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{s.label}</p>
              <p className={`text-sm font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] py-6">

          {/* Featured Collections */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Featured Collections</h2>
            {profile.featuredCollections.map((col, i) => (
              <div key={i}
                className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-slate-900/20 hover:bg-slate-900/40 transition cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 flex items-center justify-center text-sm font-black text-white shadow-md">
                    {col.symbol.substring(0, 2)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{col.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{col.minted} items · Floor {col.floorPrice}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Recent Activity</h2>
            <div className="space-y-2.5">
              {profile.recentActivity.map((act, i) => (
                <div key={i} className="flex items-start gap-3 p-3.5 rounded-2xl border border-white/5 bg-slate-900/20">
                  <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider flex-shrink-0 ${activityColors[act.type]}`}>
                    {activityLabels[act.type]}
                  </span>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-xs text-white leading-relaxed">{act.description}</p>
                    <p className="text-[9px] text-slate-600 font-mono">{act.timestamp}</p>
                  </div>
                  {act.txHash && (
                    <a href={`https://sepolia.basescan.org/tx/${act.txHash}`} target="_blank" rel="noreferrer"
                      className="text-slate-600 hover:text-cyan-400 transition flex-shrink-0">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
