"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { MessageSquare, X, Send, Bot, Check, ArrowRight, Zap, Sparkles, AlertCircle } from "lucide-react";

interface ActionCard {
  type: "deploy-erc20" | "deploy-erc721" | "estimate-gas" | "launch-dao" | "stake-nft" | "optimize-royalties";
  title: string;
  description: string;
  data: any;
  status: "pending" | "approved" | "rejected";
}

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: Date;
  actionCard?: ActionCard;
}

interface ChatAssistantProps {
  onNavigateToModule: (moduleId: string) => void;
  onAutoConfigureParams: (moduleId: string, params: any) => void;
}

export default function ChatAssistant({ onNavigateToModule, onAutoConfigureParams }: ChatAssistantProps) {
  const { isConnected, address } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      sender: "assistant",
      text: "Welcome to WCOS AI Assistant. I can help you orchestrate workflows like generating NFT collections, deploying tokens, launching DAOs, or analyzing portfolios. What would you like to build today?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleCommand = (text: string) => {
    setIsTyping(true);
    const cleanedText = text.toLowerCase().trim();

    setTimeout(() => {
      let responseText = "I'm not sure how to handle that command yet. Try saying 'Deploy ERC20', 'Create a cyberpunk NFT collection', 'Launch DAO', 'Estimate gas', or 'Stake my NFT'.";
      let actionCard: ActionCard | undefined = undefined;

      if (cleanedText.includes("cyberpunk") || cleanedText.includes("nft collection") || cleanedText.includes("deploy erc721")) {
        responseText = "I've drafted a premium Cyberpunk NFT collection configuration for you. Let's customize it before launching.";
        actionCard = {
          type: "deploy-erc721",
          title: "Draft NFT Collection (ERC-721)",
          description: "Initialize an AI-generated Cyberpunk collection on Base Network.",
          status: "pending",
          data: {
            name: "Cyberpunk Wanderers",
            symbol: "CYBER",
            royalty: "5%",
            size: "1000",
            style: "cyberpunk",
            prompt: "A futuristic wanderer in a neon-drenched cityscape, detailed cyborg parts, 8k resolution"
          }
        };
      } else if (cleanedText.includes("erc20") || cleanedText.includes("token") || cleanedText.includes("create token")) {
        responseText = "I've structured a utility token (ERC-20) configuration. You can adjust the tokenomics allocation in the builder.";
        actionCard = {
          type: "deploy-erc20",
          title: "Configure Utility Token (ERC-20)",
          description: "Launch a customized ERC-20 token for your community or dapp.",
          status: "pending",
          data: {
            name: "Creator OS Token",
            symbol: "WCOS",
            decimals: 18,
            totalSupply: "1,000,000",
            features: ["Mintable", "Burnable"]
          }
        };
      } else if (cleanedText.includes("dao") || cleanedText.includes("launch dao")) {
        responseText = "I've generated a governance structure for your community. This configuration will deploy a Governor contract and a Timelock controller.";
        actionCard = {
          type: "launch-dao",
          title: "Setup DAO Governance",
          description: "Configure DAO governance settings, voting quorum, and treasury variables.",
          status: "pending",
          data: {
            name: "Creator DAO",
            votingDelay: "1 day",
            votingPeriod: "7 days",
            quorum: "4%",
            proposalThreshold: "1,000 WCOS"
          }
        };
      } else if (cleanedText.includes("gas") || cleanedText.includes("estimate")) {
        responseText = "Here is the current gas estimation across networks. Transactions are currently optimized on Base Sepolia Testnet.";
        actionCard = {
          type: "estimate-gas",
          title: "WCOS Real-time Gas Estimation",
          description: "Approximate gas fees for deploying and minting assets across networks.",
          status: "pending",
          data: {
            baseGas: "0.0001 Gwei (~$0.02)",
            ethereumGas: "24 Gwei (~$12.50)",
            polygonGas: "80 Gwei (~$0.05)",
            arbitrumGas: "0.1 Gwei (~$0.01)"
          }
        };
      } else if (cleanedText.includes("stake") || cleanedText.includes("stake nft")) {
        responseText = "Secure staking is available. You can lock your generated NFTs in our yield pool to earn mock WCOS utility tokens.";
        actionCard = {
          type: "stake-nft",
          title: "Stake AI Studio NFT",
          description: "Stake your minted AI art to earn governance power and staking yields.",
          status: "pending",
          data: {
            apy: "12.5% Yield",
            lockPeriod: "None (Flexible)",
            rewardToken: "WCOS"
          }
        };
      } else if (cleanedText.includes("royalty") || cleanedText.includes("royalties")) {
        responseText = "I've reviewed your collection settings. To maximize your creator revenue while complying with ERC-2981, I recommend a 5.0% royalty model.";
        actionCard = {
          type: "optimize-royalties",
          title: "Optimize Royalties Layout",
          description: "Automatically sets up ERC-2981 specifications targeting active marketplaces.",
          status: "pending",
          data: {
            proposedRoyalty: "5.0%",
            supportedMarketplaces: ["OpenSea", "Blur", "WCOS Marketplace"]
          }
        };
      }

      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender: "assistant",
          text: responseText,
          timestamp: new Date(),
          actionCard
        }
      ]);
      setIsTyping(false);
    }, 1200);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: "user",
      text: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    handleCommand(userMessage.text);
  };

  const handleAction = (messageId: string, action: "approve" | "reject", card: ActionCard) => {
    setMessages(prev =>
      prev.map(m => {
        if (m.id === messageId && m.actionCard) {
          return {
            ...m,
            actionCard: { ...m.actionCard, status: action === "approve" ? "approved" : "rejected" }
          };
        }
        return m;
      })
    );

    if (action === "approve") {
      // Direct navigation and configuration logic based on action card
      if (card.type === "deploy-erc721") {
        onNavigateToModule("ai-studio");
        onAutoConfigureParams("ai-studio", card.data);
      } else if (card.type === "deploy-erc20") {
        onNavigateToModule("contract-builder");
        onAutoConfigureParams("contract-builder", card.data);
      } else if (card.type === "launch-dao") {
        onNavigateToModule("dao-builder");
      } else if (card.type === "stake-nft") {
        onNavigateToModule("defi-center");
      } else if (card.type === "estimate-gas") {
        onNavigateToModule("wallet-monitor");
      }
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 via-indigo-500 to-fuchsia-500 text-white shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20"
        title="WCOS AI Assistant"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6 animate-pulse" />}
      </button>

      {/* Expandable Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[500px] w-[380px] flex-col rounded-3xl border border-white/10 bg-slate-950/90 shadow-2xl backdrop-blur-2xl transition-all duration-300">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 bg-slate-900/40 p-4 rounded-t-3xl">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 text-white p-[2px]">
                <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
                  <Bot className="h-4.5 w-4.5 text-cyan-400" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">WCOS Assistant</h3>
                <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Active Model: Titan / Claude
                </span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    m.sender === "user"
                      ? "bg-indigo-600 text-white rounded-br-none"
                      : "bg-slate-900 text-slate-100 rounded-bl-none border border-white/5"
                  }`}
                >
                  {m.text}
                </div>

                {/* Render Action Card if present */}
                {m.actionCard && (
                  <div className="mt-3 w-[90%] rounded-2xl border border-white/10 bg-slate-900/60 p-4 space-y-3 shadow-lg">
                    <div className="flex items-start gap-2">
                      <Zap className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-white">{m.actionCard.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">{m.actionCard.description}</p>
                      </div>
                    </div>

                    {/* Data Payload Details */}
                    <div className="rounded-lg bg-slate-950/80 p-2 text-[10px] font-mono text-cyan-300 border border-white/5 space-y-1">
                      {Object.entries(m.actionCard.data).map(([key, val]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-slate-500">{key}:</span>
                          <span className="text-right truncate max-w-[150px]">{String(val)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action Controls */}
                    {m.actionCard.status === "pending" ? (
                      <div className="flex items-center gap-2 pt-1.5">
                        <button
                          onClick={() => handleAction(m.id, "reject", m.actionCard!)}
                          className="flex-1 rounded-full border border-white/10 py-1.5 text-[10px] font-semibold text-slate-400 hover:bg-slate-950 transition"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleAction(m.id, "approve", m.actionCard!)}
                          className="flex-1 flex items-center justify-center gap-1 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 py-1.5 text-[10px] font-semibold text-white shadow-md hover:opacity-90 active:scale-95 transition"
                        >
                          Approve <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    ) : m.actionCard.status === "approved" ? (
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                        <Check className="h-3.5 w-3.5" /> Action Approved & Set Up
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[10px] text-rose-400 font-semibold bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
                        <AlertCircle className="h-3.5 w-3.5" /> Configuration Rejected
                      </div>
                    )}
                  </div>
                )}

                <span className="text-[9px] text-slate-500 mt-1 px-1">
                  {m.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 text-cyan-400 text-[10px]">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="flex items-center gap-1 bg-slate-900 border border-white/5 px-3 py-2 rounded-2xl rounded-bl-none">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce" />
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce delay-100" />
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce delay-200" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions row */}
          <div className="flex flex-wrap items-center gap-1.5 px-4 py-2 border-t border-white/5 bg-slate-900/20">
            <button
              onClick={() => handleCommand("Deploy ERC20")}
              className="rounded-full bg-slate-950/80 px-2.5 py-1 text-[9px] text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/40 transition"
            >
              Deploy ERC-20
            </button>
            <button
              onClick={() => handleCommand("Create cyberpunk NFT collection")}
              className="rounded-full bg-slate-950/80 px-2.5 py-1 text-[9px] text-cyan-300 border border-cyan-500/20 hover:border-cyan-500/40 transition"
            >
              Cyberpunk NFT Collection
            </button>
            <button
              onClick={() => handleCommand("Launch DAO")}
              className="rounded-full bg-slate-950/80 px-2.5 py-1 text-[9px] text-fuchsia-300 border border-fuchsia-500/20 hover:border-fuchsia-500/40 transition"
            >
              Launch DAO
            </button>
          </div>

          {/* Input Box */}
          <form onSubmit={handleSend} className="flex gap-2 p-4 border-t border-white/5 bg-slate-900/40 rounded-b-3xl">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 rounded-full border border-white/10 bg-slate-950 px-4 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none transition focus:border-cyan-500/50"
            />
            <button
              type="submit"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 text-white shadow hover:opacity-90 active:scale-95 transition"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
