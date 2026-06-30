"use client";

import React, { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import {
  Terminal, ShieldAlert, Cpu, Layers, Coins, Compass, Users, Rocket, Code2, 
  Wallet, RefreshCw, Send, CheckCircle2, ChevronRight, Activity, Sparkles, 
  Sliders, Play, Trash2, Image as ImageIcon, Video, Music, Box, Settings, 
  Database, Plus, Eye, ListFilter, Percent, Globe, AlertTriangle
} from "lucide-react";
import ChatAssistant from "../../components/assistant/ChatAssistant";

interface DeployedContractRecord {
  name: string;
  symbol: string;
  address: string;
  type: "ERC-20" | "ERC-721" | "ERC-1155";
  chain: string;
  txHash: string;
  timestamp: string;
}

interface CustomTrait {
  traitType: string;
  value: string;
  rarity: string;
}

interface DraftAsset {
  id: string;
  imageUrl: string;
  metadataUrl: string;
  prompt: string;
  name: string;
  description: string;
  category: string;
  royalty: number;
  externalUrl: string;
  unlockableContent: string;
  traits: CustomTrait[];
  status: "DRAFT" | "MINTED" | "MINTING";
  txHash?: string;
  timestamp: string;
}

export default function DashboardPage() {
  const { address, isConnected, chain } = useAccount();
  const [activeModule, setActiveModule] = useState<string>("home");
  const [selectedChain, setSelectedChain] = useState<string>("base-sepolia");
  
  // Terminal activity logs
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "WCOS Kernel v1.0.0 initialized.",
    "System security scan completed. Status: Secure.",
    "Awaiting blockchain network wallet connection..."
  ]);

  const addTerminalLog = (log: string) => {
    setTerminalLogs(prev => [...prev.slice(-15), `[${new Date().toLocaleTimeString()}] ${log}`]);
  };

  useEffect(() => {
    if (isConnected && address) {
      addTerminalLog(`Wallet connected: ${address.slice(0, 10)}...${address.slice(-8)} on ${chain?.name || "EVM Chain"}`);
      setSelectedChain(chain?.id === 8453 ? "base-mainnet" : "base-sepolia");
    } else {
      addTerminalLog("Wallet disconnected or session expired.");
    }
  }, [isConnected, address, chain]);

  const [autoConfigParams, setAutoConfigParams] = useState<Record<string, any>>({});

  // ----------------------------------------------------
  // Module 1: AI Creator Studio State & Handlers
  // ----------------------------------------------------
  const [aiStudioSubTab, setAiStudioSubTab] = useState<'image' | 'video' | 'audio' | '3d'>('image');
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("cyberpunk");
  const [storageDriver, setStorageDriver] = useState<'s3' | 'ipfs'>('s3');
  
  // Metadata Form State
  const [nftName, setNftName] = useState("");
  const [nftDescription, setNftDescription] = useState("");
  const [nftCategory, setNftCategory] = useState("art");
  const [nftRoyalty, setNftRoyalty] = useState(5);
  const [nftExternalUrl, setNftExternalUrl] = useState("");
  const [nftUnlockable, setNftUnlockable] = useState("");

  const [metadataUrl, setMetadataUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [aiStatus, setAiStatus] = useState("Ready.");
  const [isGenerating, setIsGenerating] = useState(false);

  // Multi-Modal configurations
  const [videoDuration, setVideoDuration] = useState("5s");
  const [videoResolution, setVideoResolution] = useState("1080p");
  const [audioTempo, setAudioTempo] = useState("120");
  const [audioGenre, setAudioGenre] = useState("synthwave");
  const [meshFormat, setMeshFormat] = useState(".glb");

  // Custom traits list
  const [traitsList, setTraitsList] = useState<CustomTrait[]>([
    { traitType: "Background", value: "Cyberpunk City Grid", rarity: "10%" },
    { traitType: "Eyewear", value: "Neon Visor", rarity: "5%" }
  ]);
  const [newTraitType, setNewTraitType] = useState("");
  const [newTraitValue, setNewTraitValue] = useState("");
  const [newTraitRarity, setNewTraitRarity] = useState("10%");

  // Drafts & Creator Gallery
  const [draftAssets, setDraftAssets] = useState<DraftAsset[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);

  const contractAddress = process.env.NEXT_PUBLIC_AINFT_MINTER_ADDRESS;
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

  // Web3 contracts mint hook for AI NFT
  const contractAbi = [
    {
      inputs: [
        { internalType: "address", name: "recipient", type: "address" },
        { internalType: "string", name: "_tokenURI", type: "string" }
      ],
      name: "mintAINFT",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "payable",
      type: "function"
    }
  ];

  const { data: mintHash, writeContract, error: mintError, isPending: isMinting } = useWriteContract();
  const { isLoading: isWaitingForTx, isSuccess: isMintSuccess } = useWaitForTransactionReceipt({ hash: mintHash });

  useEffect(() => {
    if (isMintSuccess && mintHash) {
      addTerminalLog(`Successfully minted AI NFT on-chain. Tx: ${mintHash}`);
      setAiStatus("NFT Minted successfully!");
      
      // Update local draft/gallery status
      setDraftAssets(prev =>
        prev.map(asset => {
          if (asset.id === selectedDraftId || (selectedDraftId === null && asset.metadataUrl === metadataUrl)) {
            return { ...asset, status: "MINTED", txHash: mintHash };
          }
          return asset;
        })
      );
    }
  }, [isMintSuccess, mintHash]);

  useEffect(() => {
    if (mintError) {
      addTerminalLog(`Minting transaction rejected or failed: ${mintError.message}`);
      setAiStatus("Minting failed.");
      
      setDraftAssets(prev =>
        prev.map(asset => {
          if (asset.id === selectedDraftId) {
            return { ...asset, status: "DRAFT" };
          }
          return asset;
        })
      );
    }
  }, [mintError]);

  const addCustomTrait = () => {
    if (!newTraitType.trim() || !newTraitValue.trim()) return;
    setTraitsList(prev => [...prev, {
      traitType: newTraitType.trim(),
      value: newTraitValue.trim(),
      rarity: newTraitRarity.trim()
    }]);
    setNewTraitType("");
    setNewTraitValue("");
    addTerminalLog(`Added trait: ${newTraitType} = ${newTraitValue}`);
  };

  const removeCustomTrait = (index: number) => {
    setTraitsList(prev => prev.filter((_, i) => i !== index));
    addTerminalLog("Removed trait attribute.");
  };

  const generateArt = async () => {
    if (!prompt.trim()) {
      setAiStatus("Enter a prompt first.");
      return;
    }
    setIsGenerating(true);
    setAiStatus(`Generating ${aiStudioSubTab}...`);
    addTerminalLog(`Requesting multi-modal (${aiStudioSubTab}) generation via driver: ${storageDriver.toUpperCase()}`);

    if (aiStudioSubTab === 'image') {
      const styleSuffixes: Record<string, string> = {
        cyberpunk: ", cyberpunk aesthetic, neon lights, high tech, futuristic, 8k resolution",
        cinematic: ", cinematic lighting, detailed, dramatic shadows, photorealistic, 35mm lens",
        anime: ", gorgeous modern anime style, makoto shinkai aesthetic, digital art, highly polished",
        retro: ", synthwave style, retro-futuristic, vaporwave, sunset grid, chrome reflections",
        abstract: ", abstract expressionism, rich textures, complex geometry, emotional color palette"
      };

      const fullPrompt = prompt.trim() + (styleSuffixes[selectedStyle] || "");

      try {
        const response = await fetch(`${backendUrl}/api/v1/ai/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: fullPrompt,
            storage: storageDriver,
            customMetadata: {
              name: nftName || undefined,
              description: nftDescription || undefined,
              category: nftCategory,
              traits: traitsList.map(t => ({ traitType: t.traitType, value: t.value })),
              royaltyPercentage: Number(nftRoyalty),
              externalUrl: nftExternalUrl || undefined,
              unlockableContent: nftUnlockable || undefined
            }
          })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Generation request failed");

        setMetadataUrl(data.metadataUrl);
        setImageUrl(data.imageUrl);
        setAiStatus(`Art generated & saved on ${storageDriver.toUpperCase()}! Ready to mint.`);
        addTerminalLog(`Art saved on ${storageDriver.toUpperCase()}: ${data.imageUrl}`);

        // Add to drafts list
        const newDraft: DraftAsset = {
          id: crypto.randomUUID(),
          imageUrl: data.imageUrl,
          metadataUrl: data.metadataUrl,
          prompt: fullPrompt,
          name: nftName || `AI Artwork #${Date.now()}`,
          description: nftDescription || "WCOS Custom AI Asset",
          category: nftCategory,
          royalty: nftRoyalty,
          externalUrl: nftExternalUrl,
          unlockableContent: nftUnlockable,
          traits: [...traitsList],
          status: "DRAFT",
          timestamp: new Date().toLocaleTimeString()
        };
        setDraftAssets(prev => [newDraft, ...prev]);

      } catch (err: any) {
        console.error(err);
        setAiStatus("Generation failed. Check server connectivity.");
        addTerminalLog(`AI Service Error: ${err.message || err}`);
      } finally {
        setIsGenerating(false);
      }
    } else {
      // Mock other multi-modal generators
      setTimeout(() => {
        setIsGenerating(false);
        setAiStatus(`${aiStudioSubTab.toUpperCase()} generated and saved on ${storageDriver.toUpperCase()}!`);
        addTerminalLog(`Mock ${aiStudioSubTab.toUpperCase()} generation success. File stored on ${storageDriver.toUpperCase()}`);
        
        let mockImageUrl = "";
        if (aiStudioSubTab === 'video') mockImageUrl = "https://wcos-nft-assets.s3.amazonaws.com/mock-assets/cyberpunk-animation.gif";
        else if (aiStudioSubTab === 'audio') mockImageUrl = "https://wcos-nft-assets.s3.amazonaws.com/mock-assets/audio-visualizer.png";
        else if (aiStudioSubTab === '3d') mockImageUrl = "https://wcos-nft-assets.s3.amazonaws.com/mock-assets/mesh-cube.png";

        const mockMetaUrl = `https://ipfs.io/ipfs/QmMockMetadata-${Date.now()}`;
        setImageUrl(mockImageUrl);
        setMetadataUrl(mockMetaUrl);

        const newDraft: DraftAsset = {
          id: crypto.randomUUID(),
          imageUrl: mockImageUrl,
          metadataUrl: mockMetaUrl,
          prompt: prompt,
          name: nftName || `AI ${aiStudioSubTab.toUpperCase()} #${Date.now()}`,
          description: nftDescription || "WCOS Multi-modal Asset",
          category: nftCategory,
          royalty: nftRoyalty,
          externalUrl: nftExternalUrl,
          unlockableContent: nftUnlockable,
          traits: [...traitsList],
          status: "DRAFT",
          timestamp: new Date().toLocaleTimeString()
        };
        setDraftAssets(prev => [newDraft, ...prev]);
      }, 2000);
    }
  };

  const handleMintDraft = (draft: DraftAsset) => {
    if (!isConnected || !address) {
      addTerminalLog("Wallet not connected.");
      return;
    }
    if (!contractAddress || contractAddress.startsWith("0xYour")) {
      addTerminalLog("Contract address not set in environment.");
      return;
    }

    setSelectedDraftId(draft.id);
    addTerminalLog(`Initiating minting for draft ${draft.name} on contract ${contractAddress}...`);
    
    // Update draft status to MINTING
    setDraftAssets(prev =>
      prev.map(asset => {
        if (asset.id === draft.id) {
          return { ...asset, status: "MINTING" };
        }
        return asset;
      })
    );

    writeContract({
      address: contractAddress as `0x${string}`,
      abi: contractAbi,
      functionName: "mintAINFT",
      args: [address, draft.metadataUrl],
      value: parseEther("0.005")
    });
  };

  // ----------------------------------------------------
  // Module 2: Contract Builder State & Handlers
  // ----------------------------------------------------
  const [contractType, setContractType] = useState<"ERC-20" | "ERC-721" | "ERC-1155">("ERC-721");
  const [contractName, setContractName] = useState("");
  const [contractSymbol, setContractSymbol] = useState("");
  const [tokenDecimals, setTokenDecimals] = useState(18);
  const [tokenSupply, setTokenSupply] = useState("1000000");
  const [contractRoyalty, setContractRoyalty] = useState(5);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compiledResult, setCompiledResult] = useState<any>(null);
  const [deployedContracts, setDeployedContracts] = useState<DeployedContractRecord[]>([]);

  useEffect(() => {
    const params = autoConfigParams["contract-builder"];
    if (params) {
      setContractName(params.name || "");
      setContractSymbol(params.symbol || "");
      setTokenSupply(params.totalSupply || "1000000");
      if (params.royalty) {
        setContractRoyalty(parseInt(params.royalty) || 5);
      }
      setContractType("ERC-20");
      addTerminalLog(`AI Assistant pre-configured Contract Builder params: ${params.name} (${params.symbol})`);
    }
  }, [autoConfigParams]);

  const compileContract = async () => {
    if (!contractName || !contractSymbol) {
      addTerminalLog("Contract compilation error: Name and Symbol are required.");
      return;
    }
    setIsCompiling(true);
    addTerminalLog(`Requesting compilation for ${contractType}: ${contractName} (${contractSymbol})...`);
    
    try {
      const response = await fetch(`${backendUrl}/api/v1/contracts/compile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: contractType,
          config: {
            name: contractName,
            symbol: contractSymbol,
            decimals: tokenDecimals,
            totalSupply: tokenSupply,
            royaltyPercentage: contractRoyalty,
            features: ["Mintable", "Burnable"]
          }
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Compilation failed");

      setCompiledResult(data);
      addTerminalLog("Solidity compilation successful. Generated bytecode & ABI.");
    } catch (err: any) {
      console.error(err);
      addTerminalLog(`Compilation error: ${err.message || err}`);
    } finally {
      setIsCompiling(false);
    }
  };

  const deployBuilderContract = () => {
    if (!isConnected) {
      addTerminalLog("Cannot deploy: Wallet not connected.");
      return;
    }
    addTerminalLog(`Simulating contract deployment on ${chain?.name || "current network"}...`);
    setTimeout(() => {
      const mockAddress = "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      const mockTx = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      
      const newContract: DeployedContractRecord = {
        name: contractName,
        symbol: contractSymbol,
        address: mockAddress,
        type: contractType,
        chain: chain?.name || "Base Sepolia",
        txHash: mockTx,
        timestamp: new Date().toLocaleTimeString()
      };

      setDeployedContracts(prev => [newContract, ...prev]);
      addTerminalLog(`Successfully deployed ${contractType} contract to ${mockAddress}`);
      addTerminalLog(`Transaction confirmed: ${mockTx}`);
    }, 2000);
  };

  // Compile live JSON metadata schema for preview
  const compileLiveMetadata = () => {
    return JSON.stringify({
      name: nftName || "Artwork #001",
      description: nftDescription || "WCOS Asset Description",
      image: imageUrl || "ipfs://QmPlaceholderImageHash",
      external_url: nftExternalUrl || "https://wcos.io",
      seller_fee_basis_points: nftRoyalty * 100,
      fee_recipient: address || "0x0000000000000000000000000000000000000000",
      attributes: traitsList.map(t => ({
        trait_type: t.traitType,
        value: t.value
      })),
      properties: {
        category: nftCategory,
        unlockable_content: nftUnlockable
      }
    }, null, 2);
  };

  // Apply AI configured parameters for AI NFT Studio (ERC721)
  useEffect(() => {
    const params = autoConfigParams["ai-studio"];
    if (params) {
      setPrompt(params.prompt || "");
      setSelectedStyle(params.style || "cyberpunk");
      setNftName(params.name || "Cyberpunk Wanderers");
      addTerminalLog(`AI Assistant pre-configured Studio params: prompt: "${params.prompt}"`);
    }
  }, [autoConfigParams]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top OS Header Menu */}
      <header className="h-16 border-b border-white/10 bg-slate-900/40 backdrop-blur-md px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 p-[2px] shadow-lg shadow-cyan-500/10">
            <div className="flex h-full w-full items-center justify-center rounded-[8px] bg-slate-950 text-sm font-black text-cyan-400">
              W
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] bg-gradient-to-r from-cyan-400 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent">
                Web3 Creator Operating System
              </span>
              <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-[9px] text-cyan-400 font-mono">
                v1.0-alpha
              </span>
            </div>
            <h1 className="text-sm font-bold text-white tracking-tight">WCOS workspace console</h1>
          </div>
        </div>

        {/* Global Selectors */}
        <div className="flex items-center gap-4">
          {/* Chain Selector UI */}
          <div className="flex items-center gap-1 bg-slate-900 border border-white/10 p-1.5 rounded-full text-xs">
            <Globe className="h-3.5 w-3.5 text-indigo-400 ml-1.5" />
            <select
              value={selectedChain}
              onChange={(e) => {
                setSelectedChain(e.target.value);
                addTerminalLog(`Chain switched to: ${e.target.value.toUpperCase()}`);
              }}
              className="bg-transparent text-white text-[11px] font-bold outline-none pr-2 cursor-pointer"
            >
              <option value="base-sepolia" className="bg-slate-950">Base Sepolia</option>
              <option value="base-mainnet" className="bg-slate-950">Base Mainnet</option>
              <option value="ethereum" className="bg-slate-950">Ethereum</option>
              <option value="polygon" className="bg-slate-950">Polygon</option>
              <option value="arbitrum" className="bg-slate-950">Arbitrum</option>
            </select>
          </div>

          <ConnectButton showBalance={false} chainStatus="icon" />
        </div>
      </header>

      {/* Main OS desktop dashboard environment */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Module Sidebar */}
        <aside className="w-64 border-r border-white/5 bg-slate-950 flex flex-col justify-between p-4 space-y-2 flex-shrink-0">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-2 block mb-3">System Modules</span>
            
            <button
              onClick={() => setActiveModule("home")}
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                activeModule === "home"
                  ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Cpu className="h-4 w-4" /> Creator Dashboard
              </span>
              <ChevronRight className="h-3 w-3 opacity-60" />
            </button>

            <button
              onClick={() => setActiveModule("ai-studio")}
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                activeModule === "ai-studio"
                  ? "bg-cyan-600/10 text-cyan-400 border border-cyan-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Sparkles className="h-4 w-4" /> AI Creator Studio
              </span>
              <ChevronRight className="h-3 w-3 opacity-60" />
            </button>

            <button
              onClick={() => setActiveModule("contract-builder")}
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                activeModule === "contract-builder"
                  ? "bg-fuchsia-600/10 text-fuchsia-400 border border-fuchsia-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Layers className="h-4 w-4" /> Contract Builder
              </span>
              <ChevronRight className="h-3 w-3 opacity-60" />
            </button>
          </div>

          {/* Connected session indicator */}
          <div className="rounded-2xl border border-white/5 bg-slate-900/20 p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              <Wallet className="h-3 w-3" /> Selected Network
            </div>
            <p className="text-[10px] font-mono text-indigo-300 truncate uppercase">
              {selectedChain}
            </p>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400 rounded-full w-full" />
            </div>
          </div>
        </aside>

        {/* Central Workspace Window */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6">
          
          {/* Module 1: Creator Dashboard Panel */}
          {activeModule === "home" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">Creator Dashboard</h2>
                  <p className="text-slate-400 text-xs mt-1">Review active token deployments, transaction logs, and generated NFT assets.</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-900/60 border border-white/5 rounded-full px-3 py-1 text-xs font-mono text-slate-400">
                  <Activity className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Chain: {selectedChain.toUpperCase()}</span>
                </div>
              </div>

              {/* Creator Gallery Grid */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Asset Creator Gallery</h3>
                
                {draftAssets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-3xl text-slate-500">
                    <ImageIcon className="h-12 w-12 mb-3 text-slate-600" />
                    <p className="text-sm font-semibold">No assets in this gallery yet.</p>
                    <p className="text-xs text-slate-500 mt-1">Use the AI Creator Studio module to synthesize custom image, audio, or video assets.</p>
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {draftAssets.map((asset) => (
                      <div key={asset.id} className="rounded-2xl border border-white/5 bg-slate-900/30 overflow-hidden flex flex-col justify-between shadow-lg">
                        <div>
                          {/* Visual element */}
                          <div className="relative aspect-square bg-slate-950">
                            <img src={asset.imageUrl} alt={asset.name} className="h-full w-full object-cover" />
                            <span className={`absolute top-3 right-3 rounded-full border px-2.5 py-0.5 text-[9px] font-bold ${
                              asset.status === 'MINTED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              asset.status === 'MINTING' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                              'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                              {asset.status}
                            </span>
                          </div>

                          {/* Info panel */}
                          <div className="p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold text-white truncate max-w-[150px]">{asset.name}</h4>
                              <span className="rounded bg-white/5 px-2 py-0.5 text-[8px] text-slate-400 uppercase font-mono">{asset.category}</span>
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{asset.description}</p>
                            
                            {/* Traits */}
                            {asset.traits.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {asset.traits.slice(0, 3).map((t, idx) => (
                                  <span key={idx} className="rounded-lg bg-slate-950 px-2 py-0.5 text-[8px] text-cyan-300 font-mono">
                                    {t.traitType}: {t.value}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="p-4 border-t border-white/5 bg-slate-900/10 flex flex-col gap-2">
                          {asset.status === "DRAFT" ? (
                            <button
                              onClick={() => handleMintDraft(asset)}
                              className="w-full rounded-full bg-indigo-600 hover:bg-indigo-500 py-2 text-xs font-semibold text-white transition-all duration-200"
                            >
                              Mint NFT on Base
                            </button>
                          ) : asset.status === "MINTING" ? (
                            <div className="w-full flex items-center justify-center gap-1.5 text-xs text-cyan-400 py-2 font-semibold">
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Publishing on-chain...
                            </div>
                          ) : (
                            <div className="w-full space-y-1.5">
                              <div className="flex items-center justify-center gap-1 text-xs text-emerald-400 py-1 font-semibold">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Minted Successfully
                              </div>
                              {asset.txHash && (
                                <p className="text-[9px] font-mono text-slate-500 text-center truncate">
                                  Tx: {asset.txHash}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Row grid */}
              <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                {/* Deployed Contract Records */}
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6">
                  <h3 className="text-sm font-bold text-white mb-4">Deployed Contracts Registry</h3>
                  {deployedContracts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 border border-dashed border-white/10 rounded-2xl text-slate-500 text-center">
                      <Code2 className="h-8 w-8 mb-2" />
                      <p className="text-xs">No active contract deployments registered on {selectedChain.toUpperCase()}.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {deployedContracts.map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-2xl border border-white/5 text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{c.name}</span>
                              <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[9px] text-indigo-400">
                                {c.type}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 font-mono">{c.address}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500">{c.timestamp}</span>
                            <span className="text-[10px] text-cyan-400 block mt-0.5 hover:underline cursor-pointer">Verify</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Shell monitor logs */}
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                      <Terminal className="h-4 w-4 text-cyan-400" /> WCOS Shell Activity
                    </h3>
                    <div className="rounded-2xl bg-slate-950 p-4 font-mono text-[10px] text-emerald-400 h-64 overflow-y-auto space-y-2 border border-white/5">
                      {terminalLogs.map((log, i) => (
                        <div key={i} className="leading-relaxed whitespace-pre-wrap">{log}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Module 2: AI Creator Studio */}
          {activeModule === "ai-studio" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-cyan-400" /> AI Creator Studio
                  </h2>
                  <p className="text-slate-400 text-xs mt-1">Configure prompt parameters, metadata tags, and storage destinations.</p>
                </div>
                
                {/* Storage Toggle */}
                <div className="flex items-center gap-2 bg-slate-900 border border-white/10 p-1.5 rounded-full">
                  <button
                    onClick={() => setStorageDriver('s3')}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition ${
                      storageDriver === 's3' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Database className="h-3 w-3" /> AWS S3
                  </button>
                  <button
                    onClick={() => setStorageDriver('ipfs')}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition ${
                      storageDriver === 'ipfs' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Compass className="h-3 w-3" /> IPFS
                  </button>
                </div>
              </div>

              {/* Sub tabs for multi-modal generation */}
              <div className="flex border-b border-white/10 gap-4">
                <button
                  onClick={() => setAiStudioSubTab('image')}
                  className={`flex items-center gap-1.5 pb-2.5 text-xs font-bold transition border-b-2 uppercase ${
                    aiStudioSubTab === 'image' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <ImageIcon className="h-3.5 w-3.5" /> Image Studio
                </button>
                <button
                  onClick={() => setAiStudioSubTab('video')}
                  className={`flex items-center gap-1.5 pb-2.5 text-xs font-bold transition border-b-2 uppercase ${
                    aiStudioSubTab === 'video' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Video className="h-3.5 w-3.5" /> Video Studio
                </button>
                <button
                  onClick={() => setAiStudioSubTab('audio')}
                  className={`flex items-center gap-1.5 pb-2.5 text-xs font-bold transition border-b-2 uppercase ${
                    aiStudioSubTab === 'audio' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Music className="h-3.5 w-3.5" /> Music Studio
                </button>
                <button
                  onClick={() => setAiStudioSubTab('3d')}
                  className={`flex items-center gap-1.5 pb-2.5 text-xs font-bold transition border-b-2 uppercase ${
                    aiStudioSubTab === '3d' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Box className="h-3.5 w-3.5" /> 3D mesh
                </button>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.3fr_1.1fr]">
                {/* Visual Metadata Form */}
                <div className="space-y-5 rounded-3xl border border-white/5 bg-slate-900/20 p-6">
                  
                  {/* NFT Details Card */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">1. Configure Collection Metadata</h3>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-bold uppercase block">Asset Name</label>
                        <input
                          type="text"
                          value={nftName}
                          onChange={(e) => setNftName(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                          placeholder="e.g. Cyberpunk Warrior #001"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-bold uppercase block">Category</label>
                        <select
                          value={nftCategory}
                          onChange={(e) => setNftCategory(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                        >
                          <option value="art">Digital Artwork</option>
                          <option value="gaming">Gaming Collectibles</option>
                          <option value="music">Audio Tracks</option>
                          <option value="utility">Utility passes</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase block">Description</label>
                      <textarea
                        rows={2}
                        value={nftDescription}
                        onChange={(e) => setNftDescription(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                        placeholder="Provide details about the utility or artwork..."
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-bold uppercase block">Royalty Percentage (%)</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={nftRoyalty}
                            onChange={(e) => setNftRoyalty(parseFloat(e.target.value) || 0)}
                            className="w-full rounded-xl border border-white/10 bg-slate-950 pl-3.5 pr-8 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                          />
                          <Percent className="absolute right-3 top-3 h-4 w-4 text-slate-500" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-bold uppercase block">External URL Link</label>
                        <input
                          type="text"
                          value={nftExternalUrl}
                          onChange={(e) => setNftExternalUrl(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                          placeholder="https://myproject.io"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase block">Unlockable Content Details</label>
                      <textarea
                        rows={2}
                        value={nftUnlockable}
                        onChange={(e) => setNftUnlockable(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                        placeholder="Add private downloads link or key code (Visible only to the NFT owner)..."
                      />
                    </div>

                    {/* Traits Manager Section */}
                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Attributes Traits Manager</span>
                      
                      {/* Add Trait Form */}
                      <div className="grid gap-3 sm:grid-cols-3 items-end">
                        <div className="space-y-1.5">
                          <label className="text-[9px] text-slate-400 uppercase">Trait Type</label>
                          <input
                            type="text"
                            value={newTraitType}
                            onChange={(e) => setNewTraitType(e.target.value)}
                            placeholder="e.g. Helmet"
                            className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] text-slate-400 uppercase">Value</label>
                          <input
                            type="text"
                            value={newTraitValue}
                            onChange={(e) => setNewTraitValue(e.target.value)}
                            placeholder="e.g. Obsidian Visor"
                            className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={addCustomTrait}
                          className="rounded-xl bg-cyan-600/10 border border-cyan-500/20 text-cyan-400 px-4 py-2 text-xs font-bold hover:bg-cyan-500/10 transition flex items-center justify-center gap-1.5 h-9.5"
                        >
                          <Plus className="h-4 w-4" /> Add Trait
                        </button>
                      </div>

                      {/* Traits List */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {traitsList.map((t, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 rounded-xl bg-slate-950/60 border border-white/10 px-3 py-1.5 text-xs"
                          >
                            <span className="text-[9px] text-slate-500 font-semibold">{t.traitType}:</span>
                            <span className="font-bold text-white">{t.value}</span>
                            <button
                              type="button"
                              onClick={() => removeCustomTrait(idx)}
                              className="text-slate-400 hover:text-rose-400 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Seed prompt input */}
                  <div className="space-y-2 pt-4 border-t border-white/5">
                    <label htmlFor="aiPrompt" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">2. Seed Text prompt</label>
                    <textarea
                      id="aiPrompt"
                      rows={4}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition focus:border-cyan-400 focus:bg-slate-950"
                      placeholder={`Describe the seed prompt for your ${aiStudioSubTab}...`}
                    />
                  </div>

                  {/* Render conditional inputs depending on active generator subtab */}
                  {aiStudioSubTab === 'image' && (
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Style Preset</label>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {["cyberpunk", "cinematic", "anime", "retro", "abstract"].map((style) => (
                          <button
                            key={style}
                            onClick={() => setSelectedStyle(style)}
                            className={`rounded-xl border py-2 px-3 text-xs font-semibold capitalize transition ${
                              selectedStyle === style
                                ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300"
                                : "border-white/5 bg-slate-950 text-slate-400 hover:border-white/10"
                            }`}
                          >
                            {style}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {aiStudioSubTab === 'video' && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-bold uppercase block">Duration</label>
                        <select
                          value={videoDuration}
                          onChange={(e) => setVideoDuration(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                        >
                          <option value="5s">5 Seconds</option>
                          <option value="10s">10 Seconds</option>
                          <option value="30s">30 Seconds</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-bold uppercase block">Resolution</label>
                        <select
                          value={videoResolution}
                          onChange={(e) => setVideoResolution(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                        >
                          <option value="720p">720p (Draft)</option>
                          <option value="1080p">1080p (HD)</option>
                          <option value="4k">4K UHD</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {aiStudioSubTab === 'audio' && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-bold uppercase block">Tempo (BPM)</label>
                        <input
                          type="text"
                          value={audioTempo}
                          onChange={(e) => setAudioTempo(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-bold uppercase block">Genre Loop Preset</label>
                        <select
                          value={audioGenre}
                          onChange={(e) => setAudioGenre(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                        >
                          <option value="synthwave">Synthwave</option>
                          <option value="cyber">Cyber Industrial</option>
                          <option value="orchestral">Cinematic Orchestral</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {aiStudioSubTab === '3d' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase block">Export Mesh Format</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[".glb", ".obj", ".fbx"].map((fmt) => (
                          <button
                            key={fmt}
                            onClick={() => setMeshFormat(fmt)}
                            className={`rounded-xl border py-2 px-3 text-xs font-semibold transition ${
                              meshFormat === fmt ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300" : "border-white/5 bg-slate-950 text-slate-400"
                            }`}
                          >
                            {fmt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Generate Button & Status info */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5">
                    <button
                      onClick={generateArt}
                      disabled={isGenerating}
                      className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 px-8 py-3.5 text-xs font-semibold text-white shadow-lg hover:opacity-90 active:scale-95 disabled:opacity-50"
                    >
                      {isGenerating ? `Synthesizing ${aiStudioSubTab}...` : `Generate ${aiStudioSubTab}`}
                    </button>
                    <div className="flex-1 rounded-2xl bg-slate-950/80 px-4 py-3 text-[10px] text-slate-400 border border-white/5">
                      <span className="font-bold text-cyan-400">Status:</span> {aiStatus}
                    </div>
                  </div>
                </div>

                {/* Live Schema & Preview Panel */}
                <div className="space-y-6 flex flex-col justify-between">
                  
                  {/* Canvas box */}
                  <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6">
                    <h3 className="text-sm font-bold text-white mb-4">Canvas Preview</h3>
                    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950 aspect-square flex items-center justify-center shadow-inner">
                      {imageUrl ? (
                        <img src={imageUrl} alt="Generated AI Asset" className="h-full w-full object-cover rounded-2xl" />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-6 text-slate-500">
                          <Cpu className="h-10 w-10 mb-2 animate-pulse text-slate-600" />
                          <p className="text-xs font-semibold text-slate-300">Awaiting AI Studio parameters</p>
                          <p className="text-[10px] mt-1 max-w-[200px]">Fill the prompts and style fields then tap generate to visualize the asset here.</p>
                        </div>
                      )}
                      
                      {imageUrl && (
                        <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-2.5 py-1 text-[9px] font-bold text-cyan-400 border border-cyan-500/20 backdrop-blur-md">
                          Generated ({storageDriver.toUpperCase()})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Schema Preview */}
                  <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-4">
                        <Eye className="h-4 w-4 text-cyan-400" /> Live Metadata JSON (ERC-721 Schema)
                      </h3>
                      <div className="rounded-2xl bg-slate-950 p-4 font-mono text-[9px] text-cyan-300 h-64 overflow-y-auto border border-white/5 whitespace-pre leading-relaxed select-all">
                        {compileLiveMetadata()}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* Module 3: Contract Builder */}
          {activeModule === "contract-builder" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Layers className="h-6 w-6 text-fuchsia-400" /> Visual Contract Builder
                </h2>
                <p className="text-slate-400 text-xs mt-1">Configure and deploy custom smart contracts directly to the network. No coding required.</p>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
                {/* Configuration wizard */}
                <div className="space-y-5 rounded-3xl border border-white/5 bg-slate-900/20 p-6">
                  
                  {/* Contract Type Selector UI */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Select Contract Standard Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["ERC-20", "ERC-721", "ERC-1155"].map((type) => (
                        <button
                          key={type}
                          onClick={() => setContractType(type as any)}
                          className={`rounded-xl border py-2.5 px-3 text-xs font-semibold transition ${
                            contractType === type
                              ? "border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-300 shadow-lg"
                              : "border-white/5 bg-slate-950 text-slate-400 hover:border-white/10"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Contract Details</h4>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Token Name</label>
                        <input
                          type="text"
                          value={contractName}
                          onChange={(e) => setContractName(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-fuchsia-400"
                          placeholder="e.g. My Custom Token"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Token Symbol</label>
                        <input
                          type="text"
                          value={contractSymbol}
                          onChange={(e) => setContractSymbol(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-fuchsia-400"
                          placeholder="e.g. MCT"
                        />
                      </div>
                    </div>

                    {contractType === "ERC-20" ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-500 font-bold uppercase">Total Supply</label>
                          <input
                            type="text"
                            value={tokenSupply}
                            onChange={(e) => setTokenSupply(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-fuchsia-400"
                            placeholder="1000000"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-500 font-bold uppercase">Decimals</label>
                          <input
                            type="number"
                            value={tokenDecimals}
                            onChange={(e) => setTokenDecimals(parseInt(e.target.value) || 18)}
                            className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-fuchsia-400"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Creator Royalty Percentage (ERC-2981)</label>
                        <input
                          type="number"
                          value={contractRoyalty}
                          onChange={(e) => setContractRoyalty(parseInt(e.target.value) || 0)}
                          className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-fuchsia-400"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-white/5">
                    <button
                      onClick={compileContract}
                      disabled={isCompiling}
                      className="flex-1 rounded-full border border-white/10 bg-slate-950 py-3 text-xs font-semibold text-slate-300 hover:bg-slate-900 transition"
                    >
                      {isCompiling ? "Compiling Solidity..." : "Compile Contract"}
                    </button>
                    {compiledResult && (
                      <button
                        onClick={deployBuilderContract}
                        className="flex-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-indigo-600 py-3 text-xs font-semibold text-white shadow hover:opacity-90 transition"
                      >
                        Deploy Contract
                      </button>
                    )}
                  </div>
                </div>

                {/* Compiled payload visualizer */}
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-4">2. Compiled Build Data</h3>
                    {compiledResult ? (
                      <div className="space-y-4">
                        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-emerald-400 flex items-start gap-2.5 text-xs">
                          <CheckCircle2 className="h-5 w-5 mt-0.5" />
                          <div>
                            <p className="font-bold">Solidity Compilation Successful</p>
                            <p className="text-[10px] text-emerald-400/80 mt-0.5">Standard contract template resolved. Targets EVM network.</p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-500 uppercase font-bold">Generated Bytecode</span>
                          <div className="rounded-xl bg-slate-950 p-3.5 font-mono text-[9px] text-fuchsia-300 max-h-32 overflow-y-auto break-all border border-white/5">
                            {compiledResult.bytecode}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-500 uppercase font-bold">Contract ABI Specs</span>
                          <div className="rounded-xl bg-slate-950 p-3.5 font-mono text-[9px] text-indigo-300 max-h-32 overflow-y-auto border border-white/5">
                            {JSON.stringify(compiledResult.abi, null, 2)}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 border border-dashed border-white/10 rounded-2xl text-slate-500 text-center">
                        <Code2 className="h-8 w-8 mb-2" />
                        <p className="text-xs">Compile your contract details to see the bytecode, metadata, and deployment params.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Floating AI Assistant Integration */}
      <ChatAssistant
        onNavigateToModule={(moduleId) => {
          setActiveModule(moduleId);
          addTerminalLog(`AI Assistant navigation triggered: switched to ${moduleId}`);
        }}
        onAutoConfigureParams={(moduleId, params) => {
          setAutoConfigParams(prev => ({ ...prev, [moduleId]: params }));
        }}
      />
      
    </div>
  );
}
