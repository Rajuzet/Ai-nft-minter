"use client";

import React, { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import {
  Settings, User, Globe, Twitter, Disc3, Instagram, Key, Bell, Shield,
  ChevronRight, Save, AlertTriangle, CheckCircle2, Loader2, ExternalLink,
  Palette, Cpu, Lock, Eye, EyeOff
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

type SettingsTab = "profile" | "notifications" | "security" | "api";

export default function SettingsPage() {
  const { address, isConnected } = useAccount();
  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const [profileForm, setProfileForm] = useState({
    displayName: "",
    bio: "",
    website: "",
    twitter: "",
    discord: "",
    instagram: "",
  });

  const [notifications, setNotifications] = useState({
    mintEvents:       true,
    saleEvents:       true,
    listingUpdates:   true,
    daoVotes:         true,
    stakingRewards:   false,
    weeklyDigest:     true,
  });

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

  const handleSaveProfile = async () => {
    if (!address) {
      toastError("Wallet not connected", "Connect your wallet to save profile.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${backendUrl}/api/v1/profile/${address}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      if (res.ok) {
        success("Profile Saved", "Your creator profile has been updated successfully.");
      } else {
        throw new Error();
      }
    } catch {
      toastError("Save Failed", "Could not update profile. Try again later.");
    } finally {
      setSaving(false);
    }
  };

  const TABS: { id: SettingsTab; label: string; icon: any }[] = [
    { id: "profile",       label: "Creator Profile",  icon: User },
    { id: "notifications", label: "Notifications",    icon: Bell },
    { id: "security",      label: "Security",         icon: Shield },
    { id: "api",           label: "API & Integrations", icon: Key },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">

      {/* Header */}
      <header className="h-14 border-b border-white/10 bg-slate-900/40 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => window.location.href = "/dashboard"}
            className="h-7 w-7 rounded-lg bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 p-[1.5px]">
            <div className="flex h-full w-full items-center justify-center rounded-[5px] bg-slate-950 text-[10px] font-black text-cyan-400">W</div>
          </button>
          <h1 className="text-sm font-bold text-white flex items-center gap-2">
            <Settings className="h-4 w-4 text-slate-400" /> Creator Settings
          </h1>
        </div>
        <ConnectButton showBalance={false} chainStatus="icon" />
      </header>

      <div className="max-w-4xl mx-auto flex gap-6 p-6">

        {/* Sidebar Tabs */}
        <aside className="w-52 space-y-1 flex-shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}

          <div className="pt-4">
            <button
              onClick={() => address && (window.location.href = `/profile/${address}`)}
              className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-500 hover:text-white hover:bg-slate-900/40 border border-transparent transition-all"
            >
              <ExternalLink className="h-4 w-4" /> View Public Profile
            </button>
          </div>
        </aside>

        {/* Content Panel */}
        <div className="flex-1 space-y-6">

          {/* ── Profile Tab ──────────────────────────────────────────────────── */}
          {activeTab === "profile" && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white">Creator Profile</h2>
                <p className="text-xs text-slate-400">This information is displayed on your public profile page.</p>
              </div>

              {!isConnected && (
                <div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs">
                  <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
                  <span className="text-slate-300">Connect your wallet to save profile changes.</span>
                </div>
              )}

              <div className="space-y-4">
                {[
                  { key: "displayName", label: "Display Name", placeholder: "Creator alias or ENS name" },
                  { key: "website",     label: "Website",      placeholder: "https://yourcreatorsite.com" },
                  { key: "twitter",     label: "Twitter / X",  placeholder: "username (without @)" },
                  { key: "discord",     label: "Discord",      placeholder: "username#0000" },
                  { key: "instagram",   label: "Instagram",    placeholder: "username" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      value={(profileForm as any)[field.key]}
                      onChange={(e) => setProfileForm((p) => ({ ...p, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500/50 transition"
                    />
                  </div>
                ))}

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Bio</label>
                  <textarea
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))}
                    placeholder="Write a short bio about your creative vision..."
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500/50 transition resize-none"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={saving || !isConnected}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 px-6 py-2.5 text-xs font-bold text-white hover:opacity-90 active:scale-95 transition disabled:opacity-40"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {saving ? "Saving…" : "Save Profile"}
              </button>
            </div>
          )}

          {/* ── Notifications Tab ─────────────────────────────────────────────── */}
          {activeTab === "notifications" && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white">Notification Preferences</h2>
                <p className="text-xs text-slate-400">Choose which events trigger in-app and email notifications.</p>
              </div>

              <div className="divide-y divide-white/5 rounded-2xl border border-white/5 bg-slate-900/20 overflow-hidden">
                {(Object.entries(notifications) as [keyof typeof notifications, boolean][]).map(([key, val]) => {
                  const labels: Record<string, string> = {
                    mintEvents:     "NFT Mint Events",
                    saleEvents:     "Sale Confirmations",
                    listingUpdates: "Marketplace Listing Updates",
                    daoVotes:       "DAO Proposal Votes",
                    stakingRewards: "Staking Reward Claims",
                    weeklyDigest:   "Weekly Creator Digest",
                  };
                  return (
                    <div key={key} className="flex items-center justify-between px-5 py-4">
                      <div>
                        <p className="text-xs font-semibold text-white">{labels[key]}</p>
                      </div>
                      <button
                        onClick={() => setNotifications((n) => ({ ...n, [key]: !val }))}
                        className={`relative h-5 w-9 rounded-full transition-colors ${val ? "bg-indigo-500" : "bg-slate-700"}`}
                      >
                        <span
                          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${val ? "left-4.5 translate-x-0" : "left-0.5"}`}
                          style={{ left: val ? "18px" : "2px" }}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Security Tab ──────────────────────────────────────────────────── */}
          {activeTab === "security" && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white">Security Settings</h2>
                <p className="text-xs text-slate-400">WCOS never stores private keys or seed phrases.</p>
              </div>

              {[
                { icon: Shield, title: "Non-Custodial Architecture", desc: "Your keys, your NFTs. WCOS never has custody of your assets.", status: "SECURE", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
                { icon: Lock, title: "Transaction Confirmation Required", desc: "Every on-chain action requires wallet confirmation. No auto-signing.", status: "ENFORCED", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
                { icon: AlertTriangle, title: "Testnet Mode Active", desc: "You are connected to Base Sepolia testnet. All funds are simulated.", status: "TESTNET", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-2xl border border-white/5 bg-slate-900/20">
                  <div className={`h-9 w-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${item.color}`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white">{item.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-1 rounded-full border ${item.color}`}>{item.status}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── API Tab ───────────────────────────────────────────────────────── */}
          {activeTab === "api" && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white">API & Integrations</h2>
                <p className="text-xs text-slate-400">Connect WCOS to external services and developer tools.</p>
              </div>

              {[
                { name: "Alchemy RPC (Base Sepolia)", key: "NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL", status: "Connected", color: "text-emerald-400" },
                { name: "WalletConnect Project ID",   key: "NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID", status: "Connected", color: "text-emerald-400" },
                { name: "AWS S3 Metadata Storage",    key: "AWS_S3_BUCKET",   status: "Configured", color: "text-cyan-400" },
                { name: "OpenAI Image Generation",    key: "OPENAI_API_KEY",  status: "Active", color: "text-indigo-400" },
                { name: "The Graph (Indexer)",        key: "GRAPH_API_KEY",   status: "Coming Soon", color: "text-slate-500" },
                { name: "Chainlink Price Feeds",      key: "CHAINLINK_FEEDS", status: "Coming Soon", color: "text-slate-500" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-slate-900/20">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-center">
                      <Cpu className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">{item.name}</p>
                      <p className="text-[10px] font-mono text-slate-600">{item.key}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold ${item.color}`}>{item.status}</span>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
