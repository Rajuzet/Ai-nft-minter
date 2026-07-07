"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import {
  MessageSquare, X, Send, Bot, Check, ArrowRight, Zap, Sparkles,
  AlertCircle, Cpu, RefreshCw, ChevronRight, ExternalLink
} from "lucide-react";

interface ActionCard {
  type: string;
  title: string;
  description: string;
  data: Record<string, any>;
  navigateTo?: string;
  confidence?: number;
  status: "pending" | "approved" | "rejected";
}

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: Date;
  actionCard?: ActionCard;
  suggestions?: string[];
  isLoading?: boolean;
}

interface ChatAssistantProps {
  onNavigateToModule: (moduleId: string) => void;
  onAutoConfigureParams: (moduleId: string, params: any) => void;
}

const QUICK_COMMANDS = [
  { label: "Launch NFT Collection", command: "Create a cyberpunk NFT collection" },
  { label: "Deploy ERC-20 Token", command: "Deploy an ERC-20 utility token" },
  { label: "Launch DAO", command: "Launch a DAO governance system" },
  { label: "Swap Tokens", command: "Swap ETH to WGT tokens" },
  { label: "Check Staking APY", command: "Show me the staking yields" },
  { label: "Portfolio Analytics", command: "Show my creator analytics" },
];

export default function ChatAssistant({ onNavigateToModule, onAutoConfigureParams }: ChatAssistantProps) {
  const { isConnected, address } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      sender: "assistant",
      text: "Welcome to the WCOS AI Assistant. I orchestrate your Web3 creator workflows — from generating NFT collections and deploying DAOs to analyzing your portfolio and optimizing royalties. What would you like to build?",
      timestamp: new Date(),
      suggestions: ["Create cyberpunk NFT", "Launch DAO", "Check portfolio"],
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleCommand = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      sender: "user",
      text,
      timestamp: new Date(),
    };

    // Add loading placeholder
    const loadingId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: loadingId, sender: "assistant", text: "", timestamp: new Date(), isLoading: true },
    ]);
    setIsTyping(true);

    try {
      const res = await fetch(`${backendUrl}/api/v1/ai/orchestrate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, walletAddress: address }),
      });

      if (!res.ok) throw new Error("Orchestrator unavailable");
      const data = await res.json();

      const assistantMsg: Message = {
        id: loadingId,
        sender: "assistant",
        text: data.reply,
        timestamp: new Date(),
        suggestions: data.suggestions,
        actionCard: data.intent
          ? {
              ...data.intent,
              status: "pending",
            }
          : undefined,
      };

      setMessages((prev) => prev.map((m) => (m.id === loadingId ? assistantMsg : m)));
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? {
                ...m,
                isLoading: false,
                text: "I'm having trouble connecting to the orchestrator. Please check your network and try again.",
              }
            : m
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const val = inputValue.trim();
    if (!val) return;
    setInputValue("");
    handleCommand(val);
  };

  const handleAction = (messageId: string, action: "approve" | "reject", card: ActionCard) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === messageId && m.actionCard) {
          return { ...m, actionCard: { ...m.actionCard, status: action === "approve" ? "approved" : "rejected" } };
        }
        return m;
      })
    );

    if (action === "approve" && card.navigateTo) {
      const target = card.navigateTo;
      // Internal dashboard modules
      const dashboardModules = ["ai-studio", "contract-builder", "collections", "marketplace"];
      if (dashboardModules.includes(target)) {
        onNavigateToModule(target);
        onAutoConfigureParams(target, card.data);
      } else {
        // Navigate to page routes (defi, dao, analytics, etc.)
        window.location.href = `/${target}`;
      }
    }
  };

  return (
    <>
      {/* Floating Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 via-indigo-500 to-fuchsia-500 text-white shadow-xl shadow-indigo-500/25 hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20"
        title="WCOS AI Assistant"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6 animate-pulse" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[540px] w-[400px] flex-col rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/60 backdrop-blur-2xl transition-all duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 bg-slate-900/50 p-4 rounded-t-3xl flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 p-[2px]">
                <div className="flex h-full w-full items-center justify-center rounded-[9px] bg-slate-950">
                  <Cpu className="h-4 w-4 text-cyan-400" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">WCOS Assistant</h3>
                <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  AI Orchestrator Active
                </span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition p-1">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}>
                
                {m.isLoading ? (
                  <div className="flex items-center gap-2 bg-slate-900 border border-white/5 px-4 py-3 rounded-2xl rounded-bl-none">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:100ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:200ms]" />
                  </div>
                ) : (
                  <>
                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                        m.sender === "user"
                          ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-br-none shadow-md"
                          : "bg-slate-900 text-slate-100 rounded-bl-none border border-white/5"
                      }`}
                    >
                      {m.text}
                    </div>

                    {/* Suggestions row */}
                    {m.suggestions && m.suggestions.length > 0 && !m.actionCard && (
                      <div className="mt-2 flex flex-wrap gap-1.5 max-w-[88%]">
                        {m.suggestions.map((s, i) => (
                          <button
                            key={i}
                            onClick={() => handleCommand(s)}
                            className="rounded-full border border-indigo-500/20 bg-indigo-500/5 px-2.5 py-1 text-[10px] text-indigo-300 hover:border-indigo-500/40 hover:bg-indigo-500/10 transition"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Action Card */}
                    {m.actionCard && (
                      <div className="mt-3 w-[92%] rounded-2xl border border-white/10 bg-slate-900/70 p-4 space-y-3 shadow-xl">
                        {/* Card Header */}
                        <div className="flex items-start gap-2.5">
                          <div className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                            <Zap className="h-3.5 w-3.5 text-amber-400" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">{m.actionCard.title}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{m.actionCard.description}</p>
                            {m.actionCard.confidence && (
                              <span className="text-[9px] text-emerald-400 font-bold">
                                {Math.round(m.actionCard.confidence * 100)}% confidence
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Data payload */}
                        <div className="rounded-xl bg-slate-950/80 p-2.5 text-[10px] font-mono text-cyan-300 border border-white/5 space-y-1.5">
                          {Object.entries(m.actionCard.data).map(([key, val]) => (
                            <div key={key} className="flex justify-between gap-2">
                              <span className="text-slate-500 flex-shrink-0">{key}:</span>
                              <span className="text-right truncate max-w-[160px]">{String(val)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Action controls */}
                        {m.actionCard.status === "pending" ? (
                          <div className="flex gap-2 pt-0.5">
                            <button
                              onClick={() => handleAction(m.id, "reject", m.actionCard!)}
                              className="flex-1 rounded-full border border-white/10 py-1.5 text-[10px] font-semibold text-slate-400 hover:bg-slate-950 transition"
                            >
                              Decline
                            </button>
                            <button
                              onClick={() => handleAction(m.id, "approve", m.actionCard!)}
                              className="flex-1 flex items-center justify-center gap-1 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 py-1.5 text-[10px] font-bold text-white shadow hover:opacity-90 active:scale-95 transition"
                            >
                              Approve <ArrowRight className="h-3 w-3" />
                            </button>
                          </div>
                        ) : m.actionCard.status === "approved" ? (
                          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                            <Check className="h-3.5 w-3.5" /> Action Approved — Navigating to module
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[10px] text-rose-400 font-semibold bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                            <AlertCircle className="h-3.5 w-3.5" /> Configuration Declined
                          </div>
                        )}
                      </div>
                    )}

                    <span className="text-[9px] text-slate-600 mt-1 px-1">
                      {m.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Commands */}
          <div className="border-t border-white/5 bg-slate-900/20 px-4 py-2.5 flex-shrink-0">
            <p className="text-[9px] text-slate-600 uppercase font-bold tracking-widest mb-1.5">Quick Actions</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_COMMANDS.map((qc) => (
                <button
                  key={qc.label}
                  onClick={() => handleCommand(qc.command)}
                  className="rounded-full bg-slate-950/60 border border-white/5 px-2.5 py-1 text-[9px] text-slate-400 hover:text-white hover:border-white/15 transition"
                >
                  {qc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="flex gap-2 p-3.5 border-t border-white/5 bg-slate-900/40 rounded-b-3xl flex-shrink-0">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me to build anything..."
              className="flex-1 rounded-full border border-white/10 bg-slate-950 px-4 py-2 text-xs text-slate-100 placeholder-slate-600 outline-none transition focus:border-cyan-500/50"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={isTyping || !inputValue.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 text-white shadow hover:opacity-90 active:scale-95 transition disabled:opacity-40"
            >
              {isTyping ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
