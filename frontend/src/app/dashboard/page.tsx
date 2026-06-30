"use client";

import React, { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import {
  Terminal, ShieldAlert, Cpu, Layers, Coins, Compass, Users, Rocket, Code2, 
  Wallet, RefreshCw, Send, CheckCircle2, ChevronRight, Activity, Sparkles, 
  Sliders, Play, Trash2, Image as ImageIcon, Video, Music, Box, Settings, 
  Database, Plus, Eye, ListFilter, Percent
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

export default function DashboardPage() {
  const { address, isConnected, chain } = useAccount();
  const [activeModule, setActiveModule] = useState<string>("home");
  
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
    if (isMintSuccess) {
      addTerminalLog(`Successfully minted AI NFT on-chain. Tx: ${mintHash}`);
      setAiStatus("NFT Minted successfully!");
    }
  }, [isMintSuccess]);

  useEffect(() => {
    if (mintError) {
      addTerminalLog(`Minting transaction rejected or failed: ${mintError.message}`);
      setAiStatus("Minting failed.");
    }
  }, [mintError]);

  const generateArt = async () => {
    if (!prompt.trim()) {
      setAiStatus("Enter a prompt first.");
      return;
    }
    setIsGenerating(true);
    setAiStatus(`Generating ${aiStudioSubTab}...`);
    addTerminalLog(`Requesting multi-modal (${aiStudioSubTab}) generation via driver: ${storageDriver.toUpperCase()}`);

    // If generating image, invoke backend Titan image model
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
          body: JSON.stringify({ prompt: fullPrompt, storage: storageDriver })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Generation request failed");

        setMetadataUrl(data.metadataUrl);
        setImageUrl(data.imageUrl);
        setAiStatus(`Art generated & saved on ${storageDriver.toUpperCase()}! Ready to mint.`);
        addTerminalLog(`Art saved on ${storageDriver.toUpperCase()}: ${data.imageUrl}`);
      } catch (err: any) {
        console.error(err);
        setAiStatus("Generation failed. Check server connectivity.");
        addTerminalLog(`AI Service Error: ${err.message || err}`);
      } finally {
        setIsGenerating(false);
      }
    } else {
      // Mock other multi-modal generators for high-fidelity interactive experience
      setTimeout(() => {
        setIsGenerating(false);
        setAiStatus(`${aiStudioSubTab.toUpperCase()} generated and saved on ${storageDriver.toUpperCase()}!`);
        addTerminalLog(`Mock ${aiStudioSubTab.toUpperCase()} generation success. File stored on ${storageDriver.toUpperCase()}`);
        if (aiStudioSubTab === 'video') {
          setImageUrl("https://wcos-nft-assets.s3.amazonaws.com/mock-assets/cyberpunk-animation.gif");
          setMetadataUrl(`https://ipfs.io/ipfs/QmMockVideoMetadata-${Date.now()}`);
        } else if (aiStudioSubTab === 'audio') {
          setImageUrl("https://wcos-nft-assets.s3.amazonaws.com/mock-assets/audio-visualizer.png");
          setMetadataUrl(`https://ipfs.io/ipfs/QmMockAudioMetadata-${Date.now()}`);
        } else if (aiStudioSubTab === '3d') {
          setImageUrl("https://wcos-nft-assets.s3.amazonaws.com/mock-assets/mesh-cube.png");
          setMetadataUrl(`https://ipfs.io/ipfs/QmMockMeshMetadata-${Date.now()}`);
        }
      }, 2000);
    }
  };

  const handleMint = () => {
    if (!isConnected || !address) {
      addTerminalLog("Wallet not connected.");
      return;
    }
    if (!metadataUrl) {
      addTerminalLog("No metadata found. Generate art first.");
      return;
    }
    if (!contractAddress || contractAddress.startsWith("0xYour")) {
      addTerminalLog("Contract address not set in environment.");
      return;
    }

    addTerminalLog("Initiating on-chain minting on Base...");
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: contractAbi,
      functionName: "mintAINFT",
      args: [address, metadataUrl],
      value: parseEther("0.005")
    });
  };

  // ----------------------------------------------------
  // Module 2: Contract Builder State & Handlers
  // ----------------------------------------------------
  const [contractType, setContractType] = useState<"ERC-20" | "ERC-721" | "ERC-1155">("ERC-20");
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

  // ----------------------------------------------------
  // Module 3: NFT Studio (Collection & Traits)
  // ----------------------------------------------------
  const [collectionName, setCollectionName] = useState("Base Wanderers");
  const [collectionSymbol, setCollectionSymbol] = useState("WAND");
  const [collectionDesc, setCollectionDesc] = useState("A custom premium visual collection generated on WCOS.");
  const [collectionRoyalty, setCollectionRoyalty] = useState(5);
  const [collectionCategory, setCollectionCategory] = useState("art");
  
  // Custom traits list
  const [traitsList, setTraitsList] = useState<CustomTrait[]>([
    { traitType: "Background", value: "Cyberpunk City Grid", rarity: "10%" },
    { traitType: "Eyewear", value: "Neon Visor", rarity: "5%" }
  ]);
  const [newTraitType, setNewTraitType] = useState("");
  const [newTraitValue, setNewTraitValue] = useState("");
  const [newTraitRarity, setNewTraitRarity] = useState("10%");

  const [packagedMetadataUrl, setPackagedMetadataUrl] = useState("");
  const [isBuildingMetadata, setIsBuildingMetadata] = useState(false);

  const addCustomTrait = () => {
    if (!newTraitType.trim() || !newTraitValue.trim()) return;
    setTraitsList(prev => [...prev, {
      traitType: newTraitType.trim(),
      value: newTraitValue.trim(),
      rarity: newTraitRarity.trim()
    }]);
    setNewTraitType("");
    setNewTraitValue("");
    addTerminalLog(`Added collection trait attribute: ${newTraitType} = ${newTraitValue}`);
  };

  const removeCustomTrait = (index: number) => {
    setTraitsList(prev => prev.filter((_, i) => i !== index));
    addTerminalLog("Removed collection trait attribute.");
  };

  // Generate live JSON Schema for NFT Metadata
  const compileLiveMetadata = () => {
    return JSON.stringify({
      name: `${collectionName} #001`,
      symbol: collectionSymbol,
      description: collectionDesc,
      image: imageUrl || "ipfs://QmPlaceholderImageHash",
      external_url: "https://wcos.io/studio",
      seller_fee_basis_points: collectionRoyalty * 100,
      fee_recipient: address || "0x0000000000000000000000000000000000000000",
      attributes: traitsList.map(t => ({
        trait_type: t.traitType,
        value: t.value,
        rarity: t.rarity
      })),
      properties: {
        category: collectionCategory,
        creator: address || "0x000"
      }
    }, null, 2);
  };

  const packageCollectionMetadata = () => {
    setIsBuildingMetadata(true);
    addTerminalLog("Packaging collection schema and traits...");
    setTimeout(() => {
      setIsBuildingMetadata(false);
      const mockCid = "Qm" + Array.from({ length: 44 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      setPackagedMetadataUrl(`https://ipfs.io/ipfs/${mockCid}`);
      addTerminalLog(`Successfully packaged & uploaded collection metadata to IPFS: ipfs://${mockCid}`);
    }, 1500);
  };

  // Apply AI configured parameters for AI NFT Studio (ERC721)
  useEffect(() => {
    const params = autoConfigParams["ai-studio"];
    if (params) {
      setPrompt(params.prompt || "");
      setSelectedStyle(params.style || "cyberpunk");
      setCollectionName(params.name || "Cyberpunk Wanderers");
      setCollectionSymbol(params.symbol || "CYBER");
      addTerminalLog(`AI Assistant pre-configured Studio params: prompt: "${params.prompt}"`);
    }
  }, [autoConfigParams]);

  // ----------------------------------------------------
  // Module 4: DeFi Swap Simulator
  // ----------------------------------------------------
  const [swapFromAmount, setSwapFromAmount] = useState("1.0");
  const [swapToAmount, setSwapToAmount] = useState("200.0");
  const [isSwapping, setIsSwapping] = useState(false);

  const calculateSwap = (val: string) => {
    setSwapFromAmount(val);
    const numeric = parseFloat(val) || 0;
    setSwapToAmount((numeric * 200).toFixed(2));
  };

  const executeSwap = () => {
    if (!isConnected) {
      addTerminalLog("Swap failed: Please connect wallet.");
      return;
    }
    setIsSwapping(true);
    addTerminalLog(`Swapping ${swapFromAmount} ETH to WCOS Token...`);
    setTimeout(() => {
      setIsSwapping(false);
      addTerminalLog(`Swap executed successfully! Added ${swapToAmount} WCOS to wallet balance.`);
    }, 1500);
  };

  // ----------------------------------------------------
  // Module 5: DAO Builder
  // ----------------------------------------------------
  const [proposals, setProposals] = useState([
    { id: 1, title: "WIP-01: Establish Creator Royalty Pool", votesFor: 1250, votesAgainst: 120, status: "Active" },
    { id: 2, title: "WIP-02: Integrate Arweave Permanent Storage Service", votesFor: 3400, votesAgainst: 50, status: "Passed" },
    { id: 3, title: "WIP-03: Distribute 100,000 WCOS Community Airdrop", votesFor: 890, votesAgainst: 910, status: "Defeated" }
  ]);

  const handleVote = (proposalId: number, voteType: "for" | "against") => {
    setProposals(prev =>
      prev.map(p => {
        if (p.id === proposalId) {
          return {
            ...p,
            votesFor: voteType === "for" ? p.votesFor + 100 : p.votesFor,
            votesAgainst: voteType === "against" ? p.votesAgainst + 100 : p.votesAgainst
          };
        }
        return p;
      })
    );
    addTerminalLog(`Vote recorded for Proposal #${proposalId}`);
  };

  // ----------------------------------------------------
  // Module 6: Token Launchpad & Tokenomics
  // ----------------------------------------------------
  const [launchpadTotalSupply, setLaunchpadTotalSupply] = useState(1000000);
  const [pubSalePct, setPubSalePct] = useState(50);
  const [teamPct, setTeamPct] = useState(20);
  const [liquidityPct, setLiquidityPct] = useState(15);
  const [stakingPct, setStakingPct] = useState(15);

  const adjustTokenomics = (type: "pub" | "team" | "liq" | "stake", val: number) => {
    if (type === "pub") setPubSalePct(val);
    else if (type === "team") setTeamPct(val);
    else if (type === "liq") setLiquidityPct(val);
    else if (type === "stake") setStakingPct(val);
  };

  // ----------------------------------------------------
  // Module 7: Developer Portal
  // ----------------------------------------------------
  const [apiKeys, setApiKeys] = useState<string[]>([]);
  const generateApiKey = () => {
    const key = "wcos_live_" + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    setApiKeys(prev => [key, ...prev]);
    addTerminalLog("Created new developer API key.");
  };

  const isMintProcessActive = isMinting || isWaitingForTx;

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

        {/* System metrics & Wallet status */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4 text-xs text-slate-400 font-mono border-r border-white/5 pr-4">
            <div className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-cyan-400" />
              <span>Gas: 0.1 Gwei (Base)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-emerald-400" />
              <span>Shield: Active</span>
            </div>
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
                <Cpu className="h-4 w-4" /> Core OS Dashboard
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
              onClick={() => setActiveModule("nft-studio")}
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                activeModule === "nft-studio"
                  ? "bg-violet-600/10 text-violet-400 border border-violet-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <ImageIcon className="h-4 w-4" /> NFT Studio Creator
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

            <button
              onClick={() => setActiveModule("defi-center")}
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                activeModule === "defi-center"
                  ? "bg-amber-600/10 text-amber-400 border border-amber-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Coins className="h-4 w-4" /> DeFi & Asset Swap
              </span>
              <ChevronRight className="h-3 w-3 opacity-60" />
            </button>

            <button
              onClick={() => setActiveModule("dao-builder")}
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                activeModule === "dao-builder"
                  ? "bg-teal-600/10 text-teal-400 border border-teal-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Users className="h-4 w-4" /> DAO Governance
              </span>
              <ChevronRight className="h-3 w-3 opacity-60" />
            </button>

            <button
              onClick={() => setActiveModule("token-launchpad")}
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                activeModule === "token-launchpad"
                  ? "bg-rose-600/10 text-rose-400 border border-rose-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Rocket className="h-4 w-4" /> Token Launchpad
              </span>
              <ChevronRight className="h-3 w-3 opacity-60" />
            </button>

            <button
              onClick={() => setActiveModule("developer-portal")}
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                activeModule === "developer-portal"
                  ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Code2 className="h-4 w-4" /> Developer Portal
              </span>
              <ChevronRight className="h-3 w-3 opacity-60" />
            </button>
          </div>

          {/* Quick Stats Widget */}
          <div className="rounded-2xl border border-white/5 bg-slate-900/20 p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              <Wallet className="h-3 w-3" /> Connected Wallet
            </div>
            <p className="text-[10px] font-mono text-indigo-300 truncate">
              {address ? address : "No wallet session"}
            </p>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400 rounded-full" style={{ width: isConnected ? "100%" : "0%" }} />
            </div>
          </div>
        </aside>

        {/* Central Workspace Window */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6">
          
          {/* Module 1: Home Dashboard Panel */}
          {activeModule === "home" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">System Console</h2>
                  <p className="text-slate-400 text-xs mt-1">Real-time resource diagnostics and network deployments monitors.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs text-slate-400 font-mono">Kernel state: READY</span>
                </div>
              </div>

              {/* Top Row Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-white/5 bg-slate-900/20 p-4">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Creator TVL</span>
                  <span className="text-2xl font-bold text-white block mt-1">$432,950.00</span>
                  <span className="text-[9px] text-emerald-400 font-semibold block mt-1">+12.4% vs last week</span>
                </div>
                <div className="rounded-2xl border border-white/5 bg-slate-900/20 p-4">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Mock Yield Earned</span>
                  <span className="text-2xl font-bold text-cyan-400 block mt-1">45.25 ETH</span>
                  <span className="text-[9px] text-slate-500 block mt-1">Staking & Creator royalties</span>
                </div>
                <div className="rounded-2xl border border-white/5 bg-slate-900/20 p-4">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Active Collections</span>
                  <span className="text-2xl font-bold text-white block mt-1">8</span>
                  <span className="text-[9px] text-indigo-400 font-semibold block mt-1">Base Network</span>
                </div>
                <div className="rounded-2xl border border-white/5 bg-slate-900/20 p-4">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Wallet Approvals</span>
                  <span className="text-2xl font-bold text-emerald-400 block mt-1">Secured</span>
                  <span className="text-[9px] text-emerald-400 font-semibold block mt-1">Approval Manager Active</span>
                </div>
              </div>

              {/* Bottom Row grid */}
              <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                {/* Deployed Contract Records */}
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-4">Workspace Smart Contracts</h3>
                    {deployedContracts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-8 border border-dashed border-white/10 rounded-2xl text-slate-500">
                        <Code2 className="h-8 w-8 mb-2" />
                        <p className="text-xs">No user-deployed contracts registered in this workspace yet.</p>
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
                              <p className="text-[10px] text-cyan-400 hover:underline cursor-pointer block mt-0.5">Verify</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
                  <p className="text-slate-400 text-xs mt-1">Generate multi-modal digital assets directly from text prompts.</p>
                </div>
                
                {/* Storage Target Toggle */}
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

              <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                {/* Configuration Panel */}
                <div className="space-y-5 rounded-3xl border border-white/5 bg-slate-900/20 p-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">1. Configuration Settings</h3>
                  
                  {/* Prompt Textarea */}
                  <div className="space-y-2">
                    <label htmlFor="aiPrompt" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Text prompt</label>
                    <textarea
                      id="aiPrompt"
                      rows={4}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition focus:border-cyan-400 focus:bg-slate-950"
                      placeholder={`Enter prompts to synthesize your ${aiStudioSubTab}...`}
                    />
                  </div>

                  {/* Render conditional inputs depending on active generator subtab */}
                  {aiStudioSubTab === 'image' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Style presets</label>
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
                          <option value="5s">5 Seconds (Short clip)</option>
                          <option value="10s">10 Seconds (Standard loop)</option>
                          <option value="30s">30 Seconds (Extended teaser)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-bold uppercase block">Resolution Quality</label>
                        <select
                          value={videoResolution}
                          onChange={(e) => setVideoResolution(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                        >
                          <option value="720p">720p (Fast render)</option>
                          <option value="1080p">1080p (Standard HD)</option>
                          <option value="4k">4K UHD (Premium quality)</option>
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
                          placeholder="120"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-bold uppercase block">Genre Loop Preset</label>
                        <select
                          value={audioGenre}
                          onChange={(e) => setAudioGenre(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                        >
                          <option value="synthwave">Synthwave (80s vibe)</option>
                          <option value="cyber">Cyberpunk Industrial</option>
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
                      className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 px-6 py-3 text-xs font-semibold text-white shadow-lg hover:opacity-90 active:scale-95 disabled:opacity-50"
                    >
                      {isGenerating ? `Synthesizing ${aiStudioSubTab}...` : `Generate ${aiStudioSubTab}`}
                    </button>
                    <div className="flex-1 rounded-2xl bg-slate-950/80 px-4 py-3 text-[10px] text-slate-400 border border-white/5">
                      <span className="font-bold text-cyan-400">Status:</span> {aiStatus}
                    </div>
                  </div>

                  {/* Metadata link output */}
                  {metadataUrl && (
                    <div className="rounded-xl border border-white/5 bg-slate-950/40 p-3.5 space-y-1">
                      <span className="text-[9px] text-slate-500 uppercase font-bold">Metadata hosted url</span>
                      <p className="text-[10px] font-mono text-cyan-300 break-all select-all">{metadataUrl}</p>
                    </div>
                  )}
                </div>

                {/* Live Preview Panel */}
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-4">2. Canvas Preview</h3>
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

                  {/* Mint Execution */}
                  {imageUrl && (
                    <div className="space-y-3 pt-6 border-t border-white/5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Mint Fee</span>
                        <span className="font-bold text-white">0.005 ETH</span>
                      </div>
                      <button
                        onClick={handleMint}
                        disabled={isMintProcessActive || !metadataUrl || !isConnected}
                        className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 text-xs font-semibold text-white shadow-xl hover:opacity-90 active:scale-95 disabled:opacity-40"
                      >
                        {isMintProcessActive ? "Broadcasting Tx..." : "Mint AI NFT Collection (0.005 ETH)"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Module 2.5: NFT Studio Collection Creator */}
          {activeModule === "nft-studio" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <ImageIcon className="h-6 w-6 text-violet-400" /> NFT Studio Creator
                </h2>
                <p className="text-slate-400 text-xs mt-1">Design ERC-721 smart contract collection metadata, configure royalties, and add trait values.</p>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.3fr_1.1fr]">
                {/* Wizard Panel */}
                <div className="space-y-6 rounded-3xl border border-white/5 bg-slate-900/20 p-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Collection Variables</h3>

                  {/* Collection Details Inputs */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Collection Name</label>
                      <input
                        type="text"
                        value={collectionName}
                        onChange={(e) => setCollectionName(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-violet-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Collection Symbol</label>
                      <input
                        type="text"
                        value={collectionSymbol}
                        onChange={(e) => setCollectionSymbol(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-violet-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Description</label>
                    <textarea
                      rows={2}
                      value={collectionDesc}
                      onChange={(e) => setCollectionDesc(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-violet-400"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-white/5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Royalty Fee (%)</label>
                      <input
                        type="number"
                        value={collectionRoyalty}
                        onChange={(e) => setCollectionRoyalty(parseFloat(e.target.value) || 0)}
                        className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-violet-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Category</label>
                      <select
                        value={collectionCategory}
                        onChange={(e) => setCollectionCategory(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-violet-400"
                      >
                        <option value="art">Artwork Presets</option>
                        <option value="gaming">Gaming Assets</option>
                        <option value="membership">DAO Memberships</option>
                      </select>
                    </div>
                  </div>

                  {/* Traits Manager Section */}
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Custom Traits & Attributes</span>
                    
                    {/* Add Trait Form */}
                    <div className="grid gap-3 sm:grid-cols-3 items-end">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-slate-400 uppercase">Trait Type</label>
                        <input
                          type="text"
                          value={newTraitType}
                          onChange={(e) => setNewTraitType(e.target.value)}
                          placeholder="e.g. Helmet"
                          className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-violet-400"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-slate-400 uppercase">Value</label>
                        <input
                          type="text"
                          value={newTraitValue}
                          onChange={(e) => setNewTraitValue(e.target.value)}
                          placeholder="e.g. Obsidian Visor"
                          className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-violet-400"
                        />
                      </div>
                      <button
                        onClick={addCustomTrait}
                        className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-violet-500 transition flex items-center justify-center gap-1.5"
                      >
                        <Plus className="h-4 w-4" /> Add Trait
                      </button>
                    </div>

                    {/* Traits List */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {traitsList.map((t, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 rounded-xl bg-slate-950/60 border border-white/10 px-3 py-1.5 text-xs"
                        >
                          <span className="text-[9px] text-slate-500 font-semibold">{t.traitType}:</span>
                          <span className="font-bold text-white">{t.value}</span>
                          <span className="rounded bg-violet-500/10 px-1 py-0.5 text-[8px] text-violet-400 font-mono">
                            {t.rarity}
                          </span>
                          <button
                            onClick={() => removeCustomTrait(idx)}
                            className="text-slate-400 hover:text-rose-400 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={packageCollectionMetadata}
                    disabled={isBuildingMetadata}
                    className="w-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 text-xs font-semibold text-white shadow-xl hover:opacity-90 active:scale-95 disabled:opacity-50"
                  >
                    {isBuildingMetadata ? "Packaging..." : "Build & Upload Collection Metadata"}
                  </button>

                  {packagedMetadataUrl && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-emerald-300 flex items-start gap-2.5 text-xs">
                      <CheckCircle2 className="h-5 w-5 mt-0.5" />
                      <div>
                        <p className="font-bold">Collection Metadata Uploaded Successfully</p>
                        <p className="text-[10px] mt-1 break-all text-emerald-300/80 font-mono select-all">
                          {packagedMetadataUrl}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Metadata JSON Preview Screen */}
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-4">
                      <Eye className="h-4 w-4 text-violet-400" /> Live Metadata Schema (ERC-721 JSON)
                    </h3>
                    <div className="rounded-2xl bg-slate-950 p-4 font-mono text-[9px] text-violet-300 h-96 overflow-y-auto border border-white/5 whitespace-pre leading-relaxed select-all">
                      {compileLiveMetadata()}
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
                  <h3 className="text-sm font-bold text-white">1. Select Standard type</h3>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {["ERC-20", "ERC-721", "ERC-1155"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setContractType(type as any)}
                        className={`rounded-xl border py-2.5 px-3 text-xs font-semibold transition ${
                          contractType === type
                            ? "border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-300"
                            : "border-white/5 bg-slate-950 text-slate-400 hover:border-white/10"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
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

          {/* Module 4: DeFi Center */}
          {activeModule === "defi-center" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Coins className="h-6 w-6 text-amber-400" /> DeFi Center & Swaps
                </h2>
                <p className="text-slate-400 text-xs mt-1">Swap digital assets and monitor mock yield returns on liquid staking pools.</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* DEX Swapper Panel */}
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white">Cross-Chain Dex Swap</h3>
                  
                  {/* Swap From */}
                  <div className="rounded-2xl bg-slate-950/80 p-4 border border-white/5 space-y-2">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>From (Source)</span>
                      <span>Balance: 12.5 ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <input
                        type="text"
                        value={swapFromAmount}
                        onChange={(e) => calculateSwap(e.target.value)}
                        className="w-full bg-transparent text-xl font-bold text-white outline-none"
                      />
                      <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-semibold text-white">
                        ETH
                      </span>
                    </div>
                  </div>

                  {/* Swap Arrow */}
                  <div className="flex justify-center -my-2.5">
                    <div className="h-8 w-8 rounded-full bg-slate-950 border border-white/10 flex items-center justify-center hover:scale-105 transition cursor-pointer">
                      <RefreshCw className="h-4 w-4 text-cyan-400" />
                    </div>
                  </div>

                  {/* Swap To */}
                  <div className="rounded-2xl bg-slate-950/80 p-4 border border-white/5 space-y-2">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>To (Destination)</span>
                      <span>Balance: 0.0 WCOS</span>
                    </div>
                    <div className="flex justify-between">
                      <input
                        type="text"
                        value={swapToAmount}
                        readOnly
                        className="w-full bg-transparent text-xl font-bold text-white outline-none cursor-default"
                      />
                      <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-400">
                        WCOS
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={executeSwap}
                    disabled={isSwapping}
                    className="w-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 text-xs font-semibold text-white shadow-lg hover:opacity-90 active:scale-95"
                  >
                    {isSwapping ? "Executing Swap..." : "Execute Swapping"}
                  </button>
                </div>

                {/* Staking Widget */}
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-2">Liquid Staking Yield</h3>
                    <p className="text-slate-400 text-xs">Lock your community assets to generate network governance power.</p>
                    
                    <div className="grid gap-3 grid-cols-2 mt-6">
                      <div className="rounded-2xl bg-slate-950 p-4 border border-white/5 text-center">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Estimated APY</span>
                        <span className="text-2xl font-bold text-amber-400 block mt-1">12.5%</span>
                      </div>
                      <div className="rounded-2xl bg-slate-950 p-4 border border-white/5 text-center">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Total Staked</span>
                        <span className="text-2xl font-bold text-white block mt-1">0.0 ETH</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => addTerminalLog("Staking portal initialized.")}
                    className="w-full rounded-full border border-white/10 bg-slate-950 py-3.5 text-xs font-semibold text-slate-300 hover:bg-slate-900 transition"
                  >
                    Manage Yield Staking Pool
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Module 5: DAO Governance */}
          {activeModule === "dao-builder" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Users className="h-6 w-6 text-teal-400" /> DAO Governance
                </h2>
                <p className="text-slate-400 text-xs mt-1">Propose, vote, and direct treasury deployments via smart contract rules.</p>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                {/* Proposals list */}
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white">Active Proposals</h3>
                  
                  <div className="space-y-3">
                    {proposals.map((p) => (
                      <div key={p.id} className="rounded-2xl bg-slate-950/80 border border-white/5 p-4 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white">{p.title}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                            p.status === "Passed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                            p.status === "Active" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" :
                            "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}>
                            {p.status}
                          </span>
                        </div>

                        {/* Votes bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <span>For: {p.votesFor}</span>
                            <span>Against: {p.votesAgainst}</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden flex">
                            <div className="bg-emerald-400 h-full" style={{ width: `${(p.votesFor / (p.votesFor + p.votesAgainst)) * 100}%` }} />
                            <div className="bg-rose-400 h-full" style={{ width: `${(p.votesAgainst / (p.votesFor + p.votesAgainst)) * 100}%` }} />
                          </div>
                        </div>

                        {/* Voting CTA */}
                        {p.status === "Active" && (
                          <div className="flex gap-2 pt-1 text-[10px]">
                            <button
                              onClick={() => handleVote(p.id, "for")}
                              className="rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 font-semibold hover:bg-emerald-500/20 transition"
                            >
                              Vote FOR
                            </button>
                            <button
                              onClick={() => handleVote(p.id, "against")}
                              className="rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3 py-1 font-semibold hover:bg-rose-500/20 transition"
                            >
                              Vote AGAINST
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Configuration rules */}
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-4">Governance Variables</h3>
                    
                    <div className="space-y-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-bold uppercase block">Voting Quorum Threshold</label>
                        <input
                          type="text"
                          defaultValue="4%"
                          className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-white outline-none focus:border-teal-400"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-bold uppercase block">Minimum Proposal Power</label>
                        <input
                          type="text"
                          defaultValue="1,000 WCOS"
                          className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-white outline-none focus:border-teal-400"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => addTerminalLog("Created a new draft proposal for DAO review.")}
                    className="w-full rounded-full bg-gradient-to-r from-teal-500 to-indigo-600 py-3.5 text-xs font-semibold text-white shadow-lg hover:opacity-90 transition"
                  >
                    Submit Proposal Draft
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Module 6: Token Launchpad */}
          {activeModule === "token-launchpad" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Rocket className="h-6 w-6 text-rose-400" /> Token Launchpad
                </h2>
                <p className="text-slate-400 text-xs mt-1">Establish tokenomics, locking rules, airdrops, and launch parameters for tokens.</p>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                {/* Configuration sliders */}
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 space-y-5">
                  <h3 className="text-sm font-bold text-white">Tokenomics Supply Allocation</h3>
                  
                  <div className="space-y-4">
                    {/* Public Sale */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300">Public Sale Allocation</span>
                        <span className="font-bold text-white">{pubSalePct}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={pubSalePct}
                        onChange={(e) => adjustTokenomics("pub", parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-rose-500"
                      />
                    </div>

                    {/* Team allocation */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300">Developer Team Allocation</span>
                        <span className="font-bold text-white">{teamPct}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={teamPct}
                        onChange={(e) => adjustTokenomics("team", parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-rose-500"
                      />
                    </div>

                    {/* Liquidity allocation */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300">Liquidity Locking Allocation</span>
                        <span className="font-bold text-white">{liquidityPct}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={liquidityPct}
                        onChange={(e) => adjustTokenomics("liq", parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-rose-500"
                      />
                    </div>

                    {/* Staking reward */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300">Staking Rewards Allocation</span>
                        <span className="font-bold text-white">{stakingPct}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={stakingPct}
                        onChange={(e) => adjustTokenomics("stake", parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-rose-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Tokenomics Visual breakdown */}
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-4 font-mono">Allocation breakdown</h3>
                    <div className="space-y-3.5 text-xs">
                      <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-white/5">
                        <span className="text-slate-400 font-semibold block">Public Sale Tokens:</span>
                        <span className="font-bold text-rose-300 block font-mono">
                          {((pubSalePct / 100) * launchpadTotalSupply).toLocaleString()} tokens
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-white/5">
                        <span className="text-slate-400 font-semibold block">Team Vesting Tokens:</span>
                        <span className="font-bold text-indigo-300 block font-mono">
                          {((teamPct / 100) * launchpadTotalSupply).toLocaleString()} tokens
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-white/5">
                        <span className="text-slate-400 font-semibold block">Locked Dex Liquidity:</span>
                        <span className="font-bold text-cyan-300 block font-mono">
                          {((liquidityPct / 100) * launchpadTotalSupply).toLocaleString()} tokens
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-white/5">
                        <span className="text-slate-400 font-semibold block">Staking Yield Allocation:</span>
                        <span className="font-bold text-amber-300 block font-mono">
                          {((stakingPct / 100) * launchpadTotalSupply).toLocaleString()} tokens
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => addTerminalLog("Token launch schedule configured and whitelist compiled.")}
                    className="w-full rounded-full bg-gradient-to-r from-rose-500 to-indigo-600 py-3.5 text-xs font-semibold text-white shadow-lg hover:opacity-90 active:scale-95 transition"
                  >
                    Lock Supply & Create Whitelist
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Module 7: Developer Portal */}
          {activeModule === "developer-portal" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Code2 className="h-6 w-6 text-emerald-400" /> Developer Portal
                </h2>
                <p className="text-slate-400 text-xs mt-1">Manage API integrations, generate credential tokens, and configure Webhooks.</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Credentials generator */}
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white">API Authentication Keys</h3>
                  
                  <div className="space-y-3">
                    {apiKeys.map((key, i) => (
                      <div key={i} className="rounded-xl bg-slate-950 p-3 font-mono text-[10px] text-emerald-400 border border-white/5 select-all truncate">
                        {key}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={generateApiKey}
                    className="w-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-xs font-semibold text-white hover:opacity-90 transition"
                  >
                    Create New Live Key
                  </button>
                </div>

                {/* Integration guidelines snippet */}
                <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-4">SDK Integration Code</h3>
                    <div className="rounded-2xl bg-slate-950 p-4 font-mono text-[9px] text-indigo-300 border border-white/5 overflow-x-auto whitespace-pre">
{`import { WcosMinter } from "@wcos/sdk";

const wcos = new WcosMinter({
  apiKey: "wcos_live_..."
});

const tx = await wcos.mintNFT({
  recipient: "0x123...",
  metadataUrl: "https://..."
});`}
                    </div>
                  </div>

                  <button
                    onClick={() => addTerminalLog("API Integration documentation link opened.")}
                    className="w-full rounded-full border border-white/10 bg-slate-950 py-3.5 text-xs font-semibold text-slate-300 hover:bg-slate-900 transition"
                  >
                    Explore GraphQL Schema Endpoint
                  </button>
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
