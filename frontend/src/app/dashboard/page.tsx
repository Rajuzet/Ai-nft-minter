"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SafeWalletButton } from "../../components/ui/SafeWalletButton";
import { WalletGuard } from "../../components/ui/WalletGuard";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { parseEther, parseUnits, decodeEventLog } from "viem";
import {
  Terminal, ShieldAlert, Cpu, Layers, Coins, Compass, Users, Rocket, Code2, 
  Wallet, RefreshCw, Send, CheckCircle2, ChevronRight, Activity, Sparkles, 
  Sliders, Play, Trash2, Image as ImageIcon, Video, Music, Box, Settings, 
  Database, Plus, Eye, ListFilter, Percent, Globe, AlertTriangle, FileText,
  Tag, ShoppingBag, X, Info, BarChart2, Zap, Key, LogOut, Check
} from "lucide-react";
import ChatAssistant from "../../components/assistant/ChatAssistant";
import { ChainSelector } from "../../components/ui/ChainSelector";
import {
  CONTRACT_ADDRESSES,
  AINFTMinterABI,
  WcosMarketplaceABI,
  isPlaceholderAddress,
  useContractAddresses,
  getExplorerTxUrl,
} from "../../lib/contracts";
import { useChainGuard, SUPPORTED_CHAINS } from "../../lib/useChainGuard";
import { useSiweAuth } from "../../lib/useSiweAuth";
import {
  useWeb3Transaction,
  useWeb3Deploy,
  getTxStatusLabel,
  parseContractError,
  type TxStatus,
} from "../../lib/useWeb3Transaction";
import { baseSepolia } from "wagmi/chains";
import { enhancePrompt as apiEnhancePrompt, startGeneration, getGenerationStatus } from "../../lib/api";

// ─── Interfaces ───────────────────────────────────────────────────────────────

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
  status: "DRAFT" | "MINTED" | "MINTING" | "LISTED";
  txHash?: string;
  timestamp: string;
  collectionAddress?: string;
  tokenId?: number;
}

interface CollectionRecord {
  id: string;
  name: string;
  symbol: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  category: string;
  royaltyPercentage: number;
  royaltyReceiver: string;
  maxSupply: number;
  chain: string;
  contractType: "ERC-721" | "ERC-1155";
  contractAddress?: string;
  status: "DRAFT" | "DEPLOYED" | "DEPLOYING";
  timestamp: string;
}

interface ListingRecord {
  id: string;
  onChainListingId?: number;
  nftAddress: string;
  tokenId: number;
  seller: string;
  price: string;
  collectionName: string;
  chain: string;
  imageUrl: string;
  name: string;
  description: string;
  status: "LISTED" | "BOUGHT" | "CANCELLED";
  buyer?: string;
  txHash?: string;
  timestamp: string;
}

// ─── Small shared UI atoms ────────────────────────────────────────────────────

function ChainGuardBanner({
  isConnected,
  isCorrectChain,
  isSwitching,
  switchToRequired,
  requiredChainName,
}: ReturnType<typeof useChainGuard>) {
  if (!isConnected) {
    return (
      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 flex items-center gap-2 text-xs text-amber-400">
        <Wallet className="h-4 w-4 flex-shrink-0" />
        Connect your wallet to proceed.
      </div>
    );
  }
  if (!isCorrectChain) {
    return (
      <div className="rounded-2xl border border-rose-500/25 bg-rose-500/5 px-4 py-3 flex items-center justify-between gap-3 text-xs text-rose-400">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          Wrong network — switch to {requiredChainName} to continue.
        </div>
        <button
          onClick={switchToRequired}
          disabled={isSwitching}
          className="flex-shrink-0 rounded-full bg-rose-600 hover:bg-rose-500 px-3 py-1 text-[10px] font-bold text-white transition disabled:opacity-50"
        >
          {isSwitching ? "Switching…" : `Switch to ${requiredChainName}`}
        </button>
      </div>
    );
  }
  return null;
}

function TxLifecycleBanner({ status, txHash, error }: { status: TxStatus; txHash?: `0x${string}`; error?: string | null }) {
  const chainId = useChainId();
  if (status === "idle") return null;

  const txUrl = txHash ? getExplorerTxUrl(chainId, txHash) : "";

  if (status === "pending_wallet") {
    return (
      <div className="rounded-2xl border border-cyan-500/25 bg-cyan-500/5 px-4 py-3 flex items-center gap-2 text-xs text-cyan-400 animate-pulse">
        <Wallet className="h-4 w-4 flex-shrink-0" />
        Waiting for wallet signature — check your wallet…
      </div>
    );
  }
  if (status === "submitted" || status === "preparing") {
    return (
      <div className="rounded-2xl border border-indigo-500/25 bg-indigo-500/5 px-4 py-3 flex items-center gap-2 text-xs text-indigo-400">
        <RefreshCw className="h-4 w-4 flex-shrink-0 animate-spin" />
        Transaction submitted — waiting for blockchain confirmation…
        {txHash && (
          <a
            href={txUrl}
            target="_blank"
            rel="noreferrer"
            className="underline ml-1 text-indigo-300"
          >
            View
          </a>
        )}
      </div>
    );
  }
  if (status === "confirmed") {
    return (
      <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3 flex items-center gap-2 text-xs text-emerald-400">
        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
        Transaction confirmed!
        {txHash && (
          <a
            href={txUrl}
            target="_blank"
            rel="noreferrer"
            className="underline ml-1 text-emerald-300"
          >
            View on Explorer
          </a>
        )}
      </div>
    );
  }
  if (status === "failed") {
    return (
      <div className="rounded-2xl border border-rose-500/25 bg-rose-500/5 px-4 py-3 flex items-start gap-2 text-xs text-rose-400">
        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <span>{error || "Transaction failed."}</span>
      </div>
    );
  }
  return null;
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { address, isConnected, chain } = useAccount();
  const contractAddresses = useContractAddresses();
  const [activeModule, setActiveModule] = useState<string>("home");
  const [selectedChain, setSelectedChain] = useState<string>("base-sepolia");

  // Chain mapping helpers
  const chainMap = React.useMemo(() => ({
    "base-sepolia": 84532,
    "base-mainnet": 8453,
    "ethereum": 1,
    "polygon": 137,
    "arbitrum": 42161,
    "optimism": 10,
  } as Record<string, number>), []);

  const chainIdToKey = useCallback((id: number): string => {
    return Object.keys(chainMap).find((key) => chainMap[key] === id) || "base-sepolia";
  }, [chainMap]);

  const activeChainId = chainMap[selectedChain] || 84532;
  const chainGuard = useChainGuard(activeChainId);
  const walletChainId = useChainId();
  const { switchChain } = useSwitchChain();

  // Sync dropdown with active wallet chain
  useEffect(() => {
    if (isConnected && walletChainId) {
      const isSupported = Object.values(chainMap).includes(walletChainId);
      if (isSupported) {
        const key = chainIdToKey(walletChainId);
        if (selectedChain !== key) {
          setSelectedChain(key);
          addTerminalLog(`Wallet chain detected: ${key.toUpperCase()}`);
        }
      }
    }
  }, [walletChainId, isConnected, chainMap, chainIdToKey, selectedChain]);

  // Handle dropdown change and switch wallet network
  const handleChainChange = (val: string) => {
    setSelectedChain(val);
    addTerminalLog(`Chain UI switched to: ${val.toUpperCase()}`);
    const targetId = chainMap[val];
    if (isConnected && targetId && switchChain) {
      addTerminalLog(`Requesting wallet switch to chain ID ${targetId}…`);
      switchChain({ chainId: targetId });
    }
  };

  const siweAuth = useSiweAuth();

  // Terminal activity logs
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "WCOS Kernel v1.0.0 initialized.",
    "System security scan completed. Status: Secure.",
    "Awaiting blockchain network wallet connection…",
  ]);

  const addTerminalLog = (log: string) => {
    setTerminalLogs((prev) => [...prev.slice(-15), `[${new Date().toLocaleTimeString()}] ${log}`]);
  };

  const [autoConfigParams, setAutoConfigParams] = useState<Record<string, any>>({});
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

  // ── Collections ─────────────────────────────────────────────────────────────
  const [collections, setCollections] = useState<CollectionRecord[]>([]);
  const [colName, setColName] = useState("");
  const [colSymbol, setColSymbol] = useState("");
  const [colDesc, setColDesc] = useState("");
  const [colLogo, setColLogo] = useState("");
  const [colBanner, setColBanner] = useState("");
  const [colCategory, setColCategory] = useState("art");
  const [colRoyalty, setColRoyalty] = useState(5);
  const [colRoyaltyReceiver, setColRoyaltyReceiver] = useState("");
  const [colMaxSupply, setColMaxSupply] = useState(1000);
  const [colChain, setColChain] = useState("base-sepolia");
  const [colContractType, setColContractType] = useState<"ERC-721" | "ERC-1155">("ERC-721");
  const [selectedCollection, setSelectedCollection] = useState<string>("");

  const fetchCollections = useCallback(async () => {
    try {
      const res = await fetch(`${backendUrl}/api/v1/collections`);
      if (res.ok) {
        const data = await res.json();
        setCollections(data);
        if (data.length > 0 && !selectedCollection) {
          setSelectedCollection(data[0].contractAddress || data[0].id);
        }
      }
    } catch (err) {
      console.error("fetchCollections error:", err);
    }
  }, [backendUrl, selectedCollection]);

  useEffect(() => { fetchCollections(); }, []);
  useEffect(() => { if (address && !colRoyaltyReceiver) setColRoyaltyReceiver(address); }, [address]);

  const saveCollectionDraft = async () => {
    if (!colName || !colSymbol) { addTerminalLog("Collection Name and Symbol are required."); return; }
    try {
      const response = await fetch(`${backendUrl}/api/v1/collections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: colName, symbol: colSymbol, description: colDesc,
          logoUrl: colLogo || "https://wcos-nft-assets.s3.amazonaws.com/mock-assets/default-logo.png",
          bannerUrl: colBanner || "https://wcos-nft-assets.s3.amazonaws.com/mock-assets/default-banner.png",
          category: colCategory, royaltyPercentage: colRoyalty,
          royaltyReceiver: colRoyaltyReceiver || address || "0x0000000000000000000000000000000000000000",
          maxSupply: colMaxSupply, chain: colChain, contractType: colContractType, status: "DRAFT",
        }),
      });
      if (response.ok) {
        addTerminalLog(`Saved collection draft: ${colName} (${colSymbol})`);
        fetchCollections();
        setColName(""); setColSymbol(""); setColDesc("");
      }
    } catch (err: any) { addTerminalLog(`Save draft error: ${err.message}`); }
  };

  // ── AI & IPFS Creator Studio State ──────────────────────────────────────────
  const [creationMode, setCreationMode] = useState<"ai" | "upload">("ai");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [ipfsUploadStep, setIpfsUploadStep] = useState<"idle" | "uploading_image" | "uploading_metadata" | "ready" | "error">("idle");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploadedIpfsImageUri, setUploadedIpfsImageUri] = useState<string>("");
  const [uploadedIpfsImageGateway, setUploadedIpfsImageGateway] = useState<string>("");
  const [uploadedIpfsMetadataUri, setUploadedIpfsMetadataUri] = useState<string>("");
  const [uploadedIpfsMetadataGateway, setUploadedIpfsMetadataGateway] = useState<string>("");

  const [aiStudioSubTab, setAiStudioSubTab] = useState<"image" | "video" | "audio" | "3d">("image");
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("cyberpunk");
  const [storageDriver, setStorageDriver] = useState<"s3" | "ipfs">("ipfs");
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
  const [traitsList, setTraitsList] = useState<CustomTrait[]>([
    { traitType: "Background", value: "Cyberpunk City Grid", rarity: "10%" },
    { traitType: "Eyewear", value: "Neon Visor", rarity: "5%" },
  ]);
  const [newTraitType, setNewTraitType] = useState("");
  const [newTraitValue, setNewTraitValue] = useState("");
  const [newTraitRarity, setNewTraitRarity] = useState("10%");
  const [draftAssets, setDraftAssets] = useState<DraftAsset[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        setValidationError(`Invalid file type "${file.type}". Supported formats: PNG, JPG, JPEG, GIF, WEBP, SVG.`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setValidationError(`File size exceeds 10MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB).`);
        return;
      }
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setImagePreviewUrl(objectUrl);
      setImageUrl(objectUrl);
      if (!nftName) setNftName(file.name.replace(/\.[^/.]+$/, ""));
      addTerminalLog(`Selected image file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    }
  };

  const uploadAndPrepareIpfsMetadata = async () => {
    setValidationError(null);

    if (!nftName.trim()) {
      setValidationError("NFT Title / Name is required.");
      return;
    }
    if (!nftDescription.trim()) {
      setValidationError("NFT Description is required.");
      return;
    }

    if (creationMode === "upload" && !selectedFile && !imageUrl) {
      setValidationError("Please select an image file to upload or generate an AI artwork.");
      return;
    }

    try {
      setIpfsUploadStep("uploading_image");
      setAiStatus("Uploading image to IPFS via Pinata...");
      addTerminalLog("Step 1: Uploading image to IPFS via Pinata provider...");

      let imageUri = uploadedIpfsImageUri;
      let gatewayImgUrl = uploadedIpfsImageGateway;

      if (creationMode === "upload" && selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const imgRes = await fetch(`${backendUrl}/api/v1/ipfs/upload-image`, {
          method: "POST",
          body: formData,
        });

        const imgData = await imgRes.json();
        if (!imgRes.ok) throw new Error(imgData.message || "Failed to upload image to IPFS");

        imageUri = imgData.ipfsUrl;
        gatewayImgUrl = imgData.gatewayUrl;
        setUploadedIpfsImageUri(imageUri);
        setUploadedIpfsImageGateway(gatewayImgUrl);
        setImageUrl(gatewayImgUrl);
        addTerminalLog(`Image pinned to IPFS: ${imageUri}`);
      } else if (!imageUri && imageUrl) {
        imageUri = imageUrl.startsWith("ipfs://") ? imageUrl : imageUrl;
      }

      setIpfsUploadStep("uploading_metadata");
      setAiStatus("Creating & pinning standard NFT metadata JSON to IPFS...");
      addTerminalLog("Step 2: Pinning standard NFT metadata JSON to IPFS...");

      const formattedAttributes = traitsList.map((t) => ({ trait_type: t.traitType, value: t.value }));

      const metaRes = await fetch(`${backendUrl}/api/v1/ipfs/upload-metadata`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nftName.trim(),
          description: nftDescription.trim(),
          image: imageUri || gatewayImgUrl || imageUrl,
          attributes: formattedAttributes,
          external_url: nftExternalUrl.trim() || undefined,
          walletAddress: address || undefined,
        }),
      });

      const metaData = await metaRes.json();
      if (!metaRes.ok) throw new Error(metaData.message || "Failed to upload metadata to IPFS");

      setUploadedIpfsMetadataUri(metaData.ipfsUrl);
      setUploadedIpfsMetadataGateway(metaData.gatewayUrl);
      setMetadataUrl(metaData.ipfsUrl);
      setIpfsUploadStep("ready");
      setAiStatus("Metadata pinned to IPFS! Ready for contract minting.");
      addTerminalLog(`Metadata pinned to IPFS: ${metaData.ipfsUrl}`);

      const newDraft: DraftAsset = {
        id: crypto.randomUUID(),
        imageUrl: gatewayImgUrl || imageUrl || "https://gateway.pinata.cloud/ipfs/QmSimulatedHash",
        metadataUrl: metaData.ipfsUrl,
        prompt: prompt || `IPFS Upload: ${nftName}`,
        name: nftName,
        description: nftDescription,
        category: nftCategory,
        royalty: nftRoyalty,
        externalUrl: nftExternalUrl,
        unlockableContent: nftUnlockable,
        traits: [...traitsList],
        status: "DRAFT",
        timestamp: new Date().toLocaleTimeString(),
        collectionAddress: selectedCollection,
      };

      setDraftAssets((prev) => [newDraft, ...prev]);
    } catch (err: any) {
      setIpfsUploadStep("error");
      setValidationError(err.message || "IPFS upload failed.");
      setAiStatus("IPFS upload failed.");
      addTerminalLog(`IPFS Upload Error: ${err.message || err}`);
    }
  };


  // ── Mint NFT — real wagmi write ──────────────────────────────────────────────
  const [pendingMintId, setPendingMintId] = useState<string | null>(null);

  const mintTx = useWeb3Transaction({
    onSuccess: async (txHash, receipt) => {
      addTerminalLog(`✓ NFT minted on-chain. Tx: ${txHash}`);
      
      let extractedTokenId = -1;
      try {
        if (receipt && receipt.logs) {
          for (const log of receipt.logs) {
            try {
              const decoded = decodeEventLog({
                abi: AINFTMinterABI,
                data: log.data,
                topics: log.topics,
              });
              if (decoded.eventName === 'Transfer') {
                extractedTokenId = Number((decoded.args as any).tokenId);
                addTerminalLog(`Extracted Token ID: ${extractedTokenId}`);
                break;
              }
            } catch (e) {
              // ignore logs that don't decode
            }
          }
        }
      } catch (err) {
        addTerminalLog("Warning: Could not parse token ID from logs.");
      }

      if (pendingMintId && extractedTokenId !== -1 && receipt) {
        try {
          await fetch(`${backendUrl}/api/v1/nft/confirm`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: pendingMintId,
              tokenId: extractedTokenId,
              txHash,
              blockNumber: Number(receipt.blockNumber)
            })
          });
          addTerminalLog(`✓ Mint confirmed in database for Token ID ${extractedTokenId}`);
        } catch (err: any) {
          addTerminalLog(`Database sync failed: ${err.message}`);
        }
      }

      setAiStatus("NFT Minted successfully!");
      setDraftAssets((prev) =>
        prev.map((asset) =>
          asset.id === selectedDraftId ? { ...asset, status: "MINTED", txHash } : asset
        )
      );
      setPendingMintId(null);
    },
    onError: async (err) => {
      addTerminalLog(`✗ Mint failed: ${err}`);
      if (pendingMintId) {
        try {
          await fetch(`${backendUrl}/api/v1/nft/failed`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: pendingMintId, txHash: "" })
          });
        } catch (e) {}
      }
      setAiStatus("Minting failed.");
      setDraftAssets((prev) =>
        prev.map((asset) => (asset.id === selectedDraftId ? { ...asset, status: "DRAFT" } : asset))
      );
      setPendingMintId(null);
    },
  });

  const addCustomTrait = () => {
    if (!newTraitType.trim() || !newTraitValue.trim()) return;
    setTraitsList((prev) => [...prev, { traitType: newTraitType.trim(), value: newTraitValue.trim(), rarity: newTraitRarity.trim() }]);
    setNewTraitType(""); setNewTraitValue("");
    addTerminalLog(`Added trait: ${newTraitType} = ${newTraitValue}`);
  };

  const removeCustomTrait = (index: number) => {
    setTraitsList((prev) => prev.filter((_, i) => i !== index));
    addTerminalLog("Removed trait attribute.");
  };

  const [negativePrompt, setNegativePrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16" | "3:2" | "2:3">("1:1");
  const [imageSize, setImageSize] = useState<"256x256" | "512x512" | "1024x1024" | string>("1024x1024");
  const [quality, setQuality] = useState<"standard" | "hd">("standard");

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) { setAiStatus("Enter a prompt first."); return; }
    try {
      setAiStatus("Enhancing prompt with AI...");
      const res = await apiEnhancePrompt(prompt, selectedStyle);
      setPrompt(res.enhancedPrompt);
      setAiStatus("Prompt enhanced!");
      addTerminalLog("Prompt enhanced via AI.");
    } catch (err: any) {
      setAiStatus("Failed to enhance prompt.");
      addTerminalLog(`Enhance error: ${err.message}`);
    }
  };

  const generateArt = async () => {
    if (!prompt.trim()) { setAiStatus("Enter a prompt first."); return; }
    if (!address) { setAiStatus("Connect wallet first."); return; }
    
    setIsGenerating(true);
    setAiStatus(`Generating ${aiStudioSubTab}…`);
    addTerminalLog(`Requesting multi-modal (${aiStudioSubTab}) generation`);

    if (aiStudioSubTab === "image") {
      try {
        const data = await startGeneration({
          prompt: prompt.trim(),
          negativePrompt: negativePrompt.trim() || undefined,
          style: selectedStyle,
          category: nftCategory,
          aspectRatio,
          imageSize,
          quality,
          walletAddress: address,
          customMetadata: {
            name: nftName || undefined,
            description: nftDescription || undefined,
            category: nftCategory,
            traits: traitsList.map((t) => ({ traitType: t.traitType, value: t.value })),
            royaltyPercentage: Number(nftRoyalty),
            externalUrl: nftExternalUrl || undefined,
            unlockableContent: nftUnlockable || undefined,
          }
        });

        if (!data.success) throw new Error(data.message || "Generation request failed");
        
        setAiStatus("Generation queued. Waiting for completion...");
        addTerminalLog(`Generation queued. Asset ID: ${data.assetId}`);

        // Poll for completion
        const pollInterval = setInterval(async () => {
          try {
            const statusData = await getGenerationStatus(data.assetId);
            if (statusData.status === 'READY') {
              clearInterval(pollInterval);
              setMetadataUrl(statusData.metadataUri);
              setImageUrl(statusData.imageUrl || statusData.imageUri);
              setAiStatus(`Art generated & saved on IPFS! Ready to mint.`);
              addTerminalLog(`Art saved on IPFS: ${statusData.imageUrl}`);

              const newDraft: DraftAsset = {
                id: statusData.id,
                imageUrl: statusData.imageUrl || statusData.imageUri,
                metadataUrl: statusData.metadataUri,
                prompt: statusData.finalPrompt || prompt,
                name: statusData.name || `AI Artwork #${Date.now()}`,
                description: nftDescription || "WCOS Custom AI Asset",
                category: statusData.category || nftCategory,
                royalty: nftRoyalty,
                externalUrl: nftExternalUrl,
                unlockableContent: nftUnlockable,
                traits: [...traitsList],
                status: "DRAFT",
                timestamp: new Date().toLocaleTimeString(),
                collectionAddress: selectedCollection,
              };
              setDraftAssets((prev) => [newDraft, ...prev]);
              setIsGenerating(false);
            } else if (statusData.status === 'FAILED') {
              clearInterval(pollInterval);
              setAiStatus("Generation failed.");
              addTerminalLog(`AI Service Error: ${statusData.errorMessage}`);
              setIsGenerating(false);
            } else {
              setAiStatus(`Status: ${statusData.status}...`);
            }
          } catch (err: any) {
             clearInterval(pollInterval);
             setAiStatus("Error checking status.");
             addTerminalLog(`Polling Error: ${err.message}`);
             setIsGenerating(false);
          }
        }, 3000);

      } catch (err: any) {
        setAiStatus("Generation request failed. Check server connectivity.");
        addTerminalLog(`AI Request Error: ${err.message || err}`);
        setIsGenerating(false);
      }
    } else {
      // [DEV_MODE] Non-image generation — mock only until multi-modal backend ready
      setTimeout(() => {
        setIsGenerating(false);
        setAiStatus(`[DEV_MODE] ${aiStudioSubTab.toUpperCase()} generation simulated.`);
        addTerminalLog(`[DEV_MODE] Mock ${aiStudioSubTab.toUpperCase()} generation — not yet connected to real model.`);

        let mockImageUrl = "";
        if (aiStudioSubTab === "video") mockImageUrl = "https://wcos-nft-assets.s3.amazonaws.com/mock-assets/cyberpunk-animation.gif";
        else if (aiStudioSubTab === "audio") mockImageUrl = "https://wcos-nft-assets.s3.amazonaws.com/mock-assets/audio-visualizer.png";
        else if (aiStudioSubTab === "3d") mockImageUrl = "https://wcos-nft-assets.s3.amazonaws.com/mock-assets/mesh-cube.png";

        const mockMetaUrl = `https://ipfs.io/ipfs/QmMockMetadata-${Date.now()}`;
        setImageUrl(mockImageUrl); setMetadataUrl(mockMetaUrl);

        const newDraft: DraftAsset = {
          id: crypto.randomUUID(), imageUrl: mockImageUrl, metadataUrl: mockMetaUrl,
          prompt, name: nftName || `AI ${aiStudioSubTab.toUpperCase()} #${Date.now()}`,
          description: nftDescription || "WCOS Multi-modal Asset", category: nftCategory,
          royalty: nftRoyalty, externalUrl: nftExternalUrl, unlockableContent: nftUnlockable,
          traits: [...traitsList], status: "DRAFT", timestamp: new Date().toLocaleTimeString(),
          collectionAddress: selectedCollection,
        };
        setDraftAssets((prev) => [newDraft, ...prev]);
      }, 1500);
    }
  };

  const handleMintDraft = async (draft: DraftAsset) => {
    if (!isConnected || !address) { addTerminalLog("Wallet not connected."); return; }
    if (!chainGuard.isCorrectChain) { addTerminalLog(`Wrong chain — please switch your wallet to ${chainGuard.requiredChainName}.`); return; }

    const mintTargetContract = (draft.collectionAddress && !isPlaceholderAddress(draft.collectionAddress))
      ? draft.collectionAddress
      : contractAddresses.AINFTMinter;

    if (!mintTargetContract || isPlaceholderAddress(mintTargetContract)) {
      addTerminalLog("Contract address not set — configure NEXT_PUBLIC_AINFT_MINTER_ADDRESS.");
      return;
    }

    setSelectedDraftId(draft.id);
    addTerminalLog(`Initiating mint for "${draft.name}" on ${mintTargetContract}…`);
    setDraftAssets((prev) =>
      prev.map((asset) => (asset.id === draft.id ? { ...asset, status: "MINTING" } : asset))
    );

    try {
      const res = await fetch(`${backendUrl}/api/v1/nft/pending`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractAddress: mintTargetContract,
          chainId: Number(walletChainId || 84532),
          ownerAddress: address,
          name: draft.name,
          description: draft.description,
          tokenUri: draft.metadataUrl,
          imageUrl: draft.imageUrl,
          prompt: draft.prompt,
          aiModel: draft.category
        })
      });
      const data = await res.json();
      if (data.id) {
        setPendingMintId(data.id);
      }
    } catch (err: any) {
      addTerminalLog(`Warning: Failed to create pending record: ${err.message}`);
    }

    mintTx.execute({
      address: mintTargetContract as `0x${string}`,
      abi: AINFTMinterABI,
      functionName: "mintAINFT",
      args: [address, draft.metadataUrl],
      value: parseEther("0.005"),
    });
  };

  // ── Marketplace ──────────────────────────────────────────────────────────────
  const [listings, setListings] = useState<ListingRecord[]>([]);
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [listingPrice, setListingPrice] = useState("0.05");
  const [selectedAssetForListing, setSelectedAssetForListing] = useState<DraftAsset | null>(null);
  const [marketplaceActionId, setMarketplaceActionId] = useState<string | null>(null);

  const buyTx = useWeb3Transaction({
    onSuccess: async (txHash) => {
      const listing = listings.find((l) => l.id === marketplaceActionId);
      if (listing) {
        addTerminalLog(`✓ Purchased "${listing.name}"! Tx: ${txHash}`);
        try {
          await fetch(`${backendUrl}/api/v1/marketplace/buy`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: listing.id, buyer: address, txHash }),
          });
        } catch { /* non-critical — blockchain is source of truth */ }
        fetchListings();
      }
    },
    onError: (err) => addTerminalLog(`✗ Purchase failed: ${err}`),
  });

  const cancelTx = useWeb3Transaction({
    onSuccess: async (txHash) => {
      const listing = listings.find((l) => l.id === marketplaceActionId);
      if (listing) {
        addTerminalLog(`✓ Listing cancelled. Tx: ${txHash}`);
        try {
          await fetch(`${backendUrl}/api/v1/marketplace/cancel`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: listing.id, txHash }),
          });
        } catch { /* non-critical */ }
        fetchListings();
      }
    },
    onError: (err) => addTerminalLog(`✗ Cancel failed: ${err}`),
  });

  const listTx = useWeb3Transaction({
    onSuccess: async (txHash, receipt) => {
      addTerminalLog(`✓ NFT Listed on Marketplace! Tx: ${txHash}`);
      try {
        const response = await fetch(`${backendUrl}/api/v1/marketplace/list`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nftAddress: selectedAssetForListing?.collectionAddress || contractAddresses.AINFTMinter,
            tokenId: selectedAssetForListing?.tokenId ?? 0,
            seller: address || "0x0000000000000000000000000000000000000000",
            price: listingPrice, collectionName: "AI Studio Collective", chain: selectedChain,
            imageUrl: selectedAssetForListing?.imageUrl, name: selectedAssetForListing?.name,
            description: selectedAssetForListing?.description,
            txHash: txHash
          }),
        });
        if (response.ok) {
          addTerminalLog("Successfully recorded listing in database!");
          setDraftAssets((prev) =>
            prev.map((asset) =>
              asset.id === selectedAssetForListing?.id ? { ...asset, status: "LISTED" } : asset
            )
          );
          fetchListings();
          setIsListingModalOpen(false);
        }
      } catch (err: any) { addTerminalLog(`Listing DB sync error: ${err.message}`); }
    },
    onError: (err) => addTerminalLog(`✗ Listing failed: ${err}`),
  });

  const approveTx = useWeb3Transaction({
    onSuccess: (txHash) => {
      addTerminalLog(`✓ NFT Approved for marketplace. Tx: ${txHash}`);
      if (selectedAssetForListing) {
        addTerminalLog(`Initiating on-chain listing...`);
        listTx.execute({
          address: contractAddresses.WcosMarketplace,
          abi: WcosMarketplaceABI,
          functionName: "listToken",
          args: [
            (selectedAssetForListing.collectionAddress || contractAddresses.AINFTMinter) as `0x${string}`, 
            BigInt(selectedAssetForListing.tokenId ?? 0), 
            parseEther(listingPrice)
          ],
        });
      }
    },
    onError: (err) => addTerminalLog(`✗ Approval failed: ${err}`),
  });

  const fetchListings = useCallback(async () => {
    try {
      const res = await fetch(`${backendUrl}/api/v1/marketplace/listings`);
      if (res.ok) setListings(await res.json());
    } catch (err) { console.error("fetchListings error:", err); }
  }, [backendUrl]);

  useEffect(() => { fetchListings(); }, []);

  const initiateListing = (asset: DraftAsset) => {
    setSelectedAssetForListing(asset);
    setIsListingModalOpen(true);
  };

  const submitListing = async () => {
    if (!selectedAssetForListing) return;
    if (isPlaceholderAddress(contractAddresses.WcosMarketplace)) {
      addTerminalLog(`Error: Marketplace contract is not configured.`);
      return;
    }
    
    if (selectedAssetForListing.tokenId === undefined || selectedAssetForListing.tokenId === null || selectedAssetForListing.tokenId === -1) {
        addTerminalLog("Error: NFT must be minted first to have a Token ID before listing.");
        return;
    }

    const nftAddress = selectedAssetForListing.collectionAddress || contractAddresses.AINFTMinter;
    addTerminalLog(`Approving marketplace to transfer "${selectedAssetForListing.name}" (Token ID: ${selectedAssetForListing.tokenId})...`);
    
    approveTx.execute({
      address: nftAddress as `0x${string}`,
      abi: AINFTMinterABI,
      functionName: "approve",
      args: [contractAddresses.WcosMarketplace, BigInt(selectedAssetForListing.tokenId)],
    });
  };

  const handleBuyNFT = (listing: ListingRecord) => {
    if (!isConnected || !address) { addTerminalLog("Connect wallet to purchase."); return; }
    if (!chainGuard.isCorrectChain) { addTerminalLog(`Wrong chain — switch wallet to ${chainGuard.requiredChainName}.`); return; }

    if (isPlaceholderAddress(contractAddresses.WcosMarketplace)) {
      addTerminalLog(`Error: Marketplace contract is not configured on ${chainGuard.requiredChainName}.`);
      return;
    }

    if (!listing.onChainListingId) {
      addTerminalLog(`Error: Listing does not have a valid on-chain listing ID.`);
      return;
    }

    setMarketplaceActionId(listing.id);
    addTerminalLog(`Initiating on-chain purchase of "${listing.name}" for ${listing.price} ETH…`);
    buyTx.execute({
      address: contractAddresses.WcosMarketplace,
      abi: WcosMarketplaceABI,
      functionName: "buyToken",
      args: [BigInt(listing.onChainListingId)],
      value: parseEther(listing.price),
    });
  };

  const handleCancelListing = (listing: ListingRecord) => {
    if (!chainGuard.isCorrectChain) { addTerminalLog(`Wrong chain — switch wallet to ${chainGuard.requiredChainName}.`); return; }

    if (isPlaceholderAddress(contractAddresses.WcosMarketplace)) {
      addTerminalLog(`Error: Marketplace contract is not configured on ${chainGuard.requiredChainName}.`);
      return;
    }

    if (!listing.onChainListingId) {
      addTerminalLog(`Error: Listing does not have a valid on-chain listing ID.`);
      return;
    }

    setMarketplaceActionId(listing.id);
    addTerminalLog(`Cancelling on-chain listing for "${listing.name}"…`);
    cancelTx.execute({
      address: contractAddresses.WcosMarketplace,
      abi: WcosMarketplaceABI,
      functionName: "cancelListing",
      args: [BigInt(listing.onChainListingId)],
    });
  };

  // ── Contract Builder ──────────────────────────────────────────────────────────
  const [contractType, setContractType] = useState<"ERC-20" | "ERC-721" | "ERC-1155">("ERC-721");
  const [contractName, setContractName] = useState("");
  const [contractSymbol, setContractSymbol] = useState("");
  const [tokenDecimals, setTokenDecimals] = useState(18);
  const [tokenSupply, setTokenSupply] = useState("1000000");
  const [contractRoyalty, setContractRoyalty] = useState(5);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compiledResult, setCompiledResult] = useState<any>(null);
  const [deployedContracts, setDeployedContracts] = useState<DeployedContractRecord[]>([]);

  // Real deploy using wagmi's useDeployContract
  const deployWeb3 = useWeb3Deploy({
    onSuccess: (contractAddress, txHash) => {
      addTerminalLog(`✓ Contract deployed at ${contractAddress}`);
      setDeployedContracts((prev) => [
        {
          name: contractName, symbol: contractSymbol,
          address: contractAddress, type: contractType,
          chain: chain?.name || "Base Sepolia", txHash,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    },
    onError: (err) => addTerminalLog(`✗ Deploy failed: ${err}`),
  });

  // ── Blockchain Event Indexer state ──────────────────────────────────────────
  const [indexerStatus, setIndexerStatus] = useState<{
    lastProcessedBlock: number;
    latestBlock: number;
    indexedEventsCount: number;
    isSyncing: boolean;
  }>({ lastProcessedBlock: 0, latestBlock: 0, indexedEventsCount: 0, isSyncing: false });

  const fetchIndexerStatus = useCallback(async () => {
    try {
      const res = await fetch(`${backendUrl}/api/v1/indexer/status`);
      if (res.ok) {
        const data = await res.json();
        setIndexerStatus(data);
      }
    } catch {
      // non-critical
    }
  }, [backendUrl]);

  const triggerManualSync = async () => {
    addTerminalLog("Triggering manual blockchain event indexer sync...");
    try {
      const res = await fetch(`${backendUrl}/api/v1/indexer/sync`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        addTerminalLog(`✓ Indexer sync finished! Scanned blocks ${data.scannedFromBlock} -> ${data.scannedToBlock}. Indexed ${data.newEventsCount} new event(s).`);
        fetchIndexerStatus();
        fetchListings();
      }
    } catch (err: any) {
      addTerminalLog(`✗ Indexer sync failed: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchIndexerStatus();
    const interval = setInterval(fetchIndexerStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchIndexerStatus]);

  useEffect(() => {
    const params = autoConfigParams["contract-builder"];

    if (params) {
      setContractName(params.name || ""); setContractSymbol(params.symbol || "");
      setTokenSupply(params.totalSupply || "1000000");
      if (params.royalty) setContractRoyalty(parseInt(params.royalty) || 5);
      setContractType("ERC-20");
      addTerminalLog(`AI pre-configured Contract Builder: ${params.name} (${params.symbol})`);
    }
  }, [autoConfigParams]);

  const compileContract = async () => {
    if (!contractName || !contractSymbol) { addTerminalLog("Name and Symbol are required."); return; }
    setIsCompiling(true);
    addTerminalLog(`Requesting compilation for ${contractType}: ${contractName} (${contractSymbol})…`);
    try {
      const response = await fetch(`${backendUrl}/api/v1/contracts/compile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: contractType,
          config: { name: contractName, symbol: contractSymbol, decimals: tokenDecimals, totalSupply: tokenSupply, royaltyPercentage: contractRoyalty, features: ["Mintable", "Burnable"] },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Compilation failed");
      setCompiledResult(data);
      addTerminalLog("Solidity compilation successful. Bytecode & ABI generated.");
    } catch (err: any) {
      addTerminalLog(`Compilation error: ${err.message || err}`);
    } finally { setIsCompiling(false); }
  };

  const deployBuilderContract = () => {
    if (!isConnected) { addTerminalLog("Wallet not connected."); return; }
    if (!chainGuard.isCorrectChain) { addTerminalLog("Wrong chain — switch to Base Sepolia."); return; }
    if (!compiledResult?.bytecode) { addTerminalLog("No compiled bytecode — compile first."); return; }

    addTerminalLog(`Deploying ${contractType} contract on ${chain?.name || "Base Sepolia"}…`);
    deployWeb3.execute({
      abi: compiledResult.abi,
      bytecode: compiledResult.bytecode,
    });
  };

  const compileLiveMetadata = () =>
    JSON.stringify({
      name: nftName || "Artwork #001",
      description: nftDescription || "WCOS Asset Description",
      image: imageUrl || "ipfs://QmPlaceholderImageHash",
      external_url: nftExternalUrl || "https://wcos.io",
      seller_fee_basis_points: nftRoyalty * 100,
      fee_recipient: address || "0x0000000000000000000000000000000000000000",
      attributes: traitsList.map((t) => ({ trait_type: t.traitType, value: t.value })),
      properties: { category: nftCategory, unlockable_content: nftUnlockable },
    }, null, 2);

  useEffect(() => {
    const params = autoConfigParams["ai-studio"];
    if (params) {
      setPrompt(params.prompt || ""); setSelectedStyle(params.style || "cyberpunk");
      setNftName(params.name || "Cyberpunk Wanderers");
      addTerminalLog(`AI pre-configured Studio: prompt: "${params.prompt}"`);
    }
  }, [autoConfigParams]);

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top OS Header */}
      <header className="h-16 border-b border-white/10 bg-slate-900/40 backdrop-blur-md px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 p-[2px] shadow-lg shadow-cyan-500/10">
            <div className="flex h-full w-full items-center justify-center rounded-[8px] bg-slate-950 text-sm font-black text-cyan-400">W</div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] bg-gradient-to-r from-cyan-400 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent">
                Web3 Creator Operating System
              </span>
              <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-[9px] text-cyan-400 font-mono">v1.0-alpha</span>
            </div>
            <h1 className="text-sm font-bold text-white tracking-tight">WCOS workspace console</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Indexer Sync Widget */}
          <div className="hidden md:flex items-center gap-2 bg-slate-900/80 border border-white/10 rounded-full px-3 py-1 text-xs">
            <RefreshCw className={`h-3 w-3 text-cyan-400 ${indexerStatus.isSyncing ? "animate-spin" : ""}`} />
            <span className="text-[10px] text-slate-400 font-mono">Block:</span>
            <span className="text-[10px] font-bold text-white font-mono">#{indexerStatus.lastProcessedBlock || "18000000"}</span>
            <button
              onClick={triggerManualSync}
              className="text-[9px] bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-bold px-2 py-0.5 rounded-full transition ml-1"
            >
              Sync
            </button>
          </div>

          <ChainSelector />

          {/* SIWE Wallet Authentication Widget */}
          {isConnected && !siweAuth.isAuthenticated ? (
            <button
              onClick={siweAuth.loginWithSiwe}
              disabled={siweAuth.isSigning}
              className="rounded-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-md transition disabled:opacity-50"
            >
              <Key className="h-3.5 w-3.5" />
              {siweAuth.isSigning ? "Signing In…" : "SIWE Sign-In"}
            </button>
          ) : isConnected && siweAuth.isAuthenticated ? (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-3 py-1 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-bold text-[10px]">SIWE:</span>
              <span className="font-mono text-white text-[10px]">
                {siweAuth.user?.walletAddress
                  ? `${siweAuth.user.walletAddress.slice(0, 6)}…${siweAuth.user.walletAddress.slice(-4)}`
                  : "Authenticated"}
              </span>
              <button
                onClick={siweAuth.logout}
                className="text-slate-400 hover:text-rose-400 ml-1 text-[10px] font-bold transition"
                title="Sign Out SIWE Session"
              >
                Sign Out
              </button>
            </div>
          ) : null}

          <SafeWalletButton showBalance={false} />
        </div>
      </header>

      {/* SIWE Auth error banner */}
      {siweAuth.authError && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 px-6 py-2 flex items-center justify-between text-xs text-rose-400">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{siweAuth.authError}</span>
          </div>
          <button onClick={siweAuth.loginWithSiwe} className="underline font-bold text-rose-300 hover:text-white">
            Retry SIWE Login
          </button>
        </div>
      )}

      {/* Main workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Module Sidebar */}
        <aside className="w-64 border-r border-white/5 bg-slate-950 flex flex-col justify-between p-4 space-y-2 flex-shrink-0">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-2 block mb-3">System Modules</span>
            
            {[
              { id: "home", label: "Creator Dashboard", icon: Cpu, color: "indigo" },
              { id: "collections", label: "My Collections", icon: FileText, color: "emerald" },
              { id: "ai-studio", label: "AI Creator Studio", icon: Sparkles, color: "cyan" },
              { id: "marketplace", label: "NFT Marketplace", icon: ShoppingBag, color: "fuchsia" },
              { id: "contract-builder", label: "Contract Builder", icon: Layers, color: "slate" },
            ].map(({ id, label, icon: Icon, color }) => (
              <button
                key={id}
                onClick={() => setActiveModule(id)}
                className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                  activeModule === id
                    ? `bg-${color}-600/10 text-${color}-400 border border-${color}-500/20`
                    : "text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent"
                }`}
              >
                <span className="flex items-center gap-2.5"><Icon className="h-4 w-4" /> {label}</span>
                <ChevronRight className="h-3 w-3 opacity-60" />
              </button>
            ))}

            <button onClick={() => window.location.href = "/defi"} className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent transition-all">
              <span className="flex items-center gap-2.5 text-amber-400"><Coins className="h-4 w-4" /> DeFi Center</span>
              <ChevronRight className="h-3 w-3 opacity-60" />
            </button>
            <button onClick={() => window.location.href = "/dao"} className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent transition-all">
              <span className="flex items-center gap-2.5 text-teal-400"><Users className="h-4 w-4" /> DAO Governance</span>
              <ChevronRight className="h-3 w-3 opacity-60" />
            </button>
            <button onClick={() => window.location.href = "/analytics"} className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent transition-all">
              <span className="flex items-center gap-2.5 text-indigo-400"><BarChart2 className="h-4 w-4" /> Creator Analytics</span>
              <ChevronRight className="h-3 w-3 opacity-60" />
            </button>
            <button onClick={() => window.location.href = `/profile/${address || "0x0000000000000000000000000000000000000000"}`} className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent transition-all" id="profile-nav-btn">
              <span className="flex items-center gap-2.5 text-fuchsia-400"><Users className="h-4 w-4" /> My Profile</span>
              <ChevronRight className="h-3 w-3 opacity-60" />
            </button>
            <button onClick={() => window.location.href = "/settings"} className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent transition-all">
              <span className="flex items-center gap-2.5 text-slate-300"><Settings className="h-4 w-4" /> Settings</span>
              <ChevronRight className="h-3 w-3 opacity-60" />
            </button>

            <div className="pt-3">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-2 block mb-2">Knowledge & Guidance</span>
              <button onClick={() => window.location.href = "/learn"} className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-transparent transition-all">
                <span className="flex items-center gap-2 text-cyan-400"><span>📚</span> Learn Concepts</span>
                <ChevronRight className="h-3 w-3 opacity-60" />
              </button>
              <button onClick={() => window.location.href = "/manual"} className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-transparent transition-all">
                <span className="flex items-center gap-2 text-indigo-400"><span>📖</span> User Manual</span>
                <ChevronRight className="h-3 w-3 opacity-60" />
              </button>
              <button onClick={() => window.location.href = "/news"} className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-transparent transition-all">
                <span className="flex items-center gap-2 text-cyan-400"><span>📰</span> Daily News</span>
                <ChevronRight className="h-3 w-3 opacity-60" />
              </button>
              <button onClick={() => window.location.href = "/magazine"} className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 hover:text-fuchsia-300 hover:bg-fuchsia-500/10 border border-transparent transition-all">
                <span className="flex items-center gap-2 text-fuchsia-400"><span>🎨</span> Magazine</span>
                <ChevronRight className="h-3 w-3 opacity-60" />
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-slate-900/20 p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              <Wallet className="h-3 w-3" /> Network
            </div>
            <p className="text-[10px] font-mono text-indigo-300 truncate uppercase">{chain?.name || selectedChain}</p>
            {!chainGuard.isCorrectChain && isConnected && (
              <button onClick={chainGuard.switchToRequired} className="w-full text-[9px] text-rose-400 border border-rose-500/20 rounded-lg py-1 hover:bg-rose-500/5 transition">
                Switch to Base Sepolia
              </button>
            )}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6">
          <WalletGuard requiredFeature="Creator Dashboard">

          {/* ── Module: Creator Dashboard ─────────────────────────────────── */}
          {activeModule === "home" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">Creator Dashboard</h2>
                  <p className="text-slate-400 text-xs mt-1">Review active token deployments, transaction logs, and generated NFT assets.</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-900/60 border border-white/5 rounded-full px-3 py-1 text-xs font-mono text-slate-400">
                  <Activity className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Chain: {(chain?.name || selectedChain).toUpperCase()}</span>
                </div>
              </div>

              {/* Asset Creator Gallery */}
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
                          <div className="relative aspect-square bg-slate-950">
                            <img src={asset.imageUrl} alt={asset.name} className="h-full w-full object-cover" />
                            <span className={`absolute top-3 right-3 rounded-full border px-2.5 py-0.5 text-[9px] font-bold ${
                              asset.status === "MINTED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                              asset.status === "LISTED" ? "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20" :
                              asset.status === "MINTING" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" :
                              "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            }`}>{asset.status}</span>
                          </div>
                          <div className="p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold text-white truncate max-w-[150px]">{asset.name}</h4>
                              <span className="rounded bg-white/5 px-2 py-0.5 text-[8px] text-slate-400 uppercase font-mono">{asset.category}</span>
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{asset.description}</p>
                          </div>
                        </div>
                        <div className="p-4 border-t border-white/5 bg-slate-900/10 flex flex-col gap-2">
                          {asset.status === "DRAFT" ? (
                            <>
                              <ChainGuardBanner {...chainGuard} />
                              {chainGuard.isConnected && chainGuard.isCorrectChain && (
                                <button
                                  onClick={() => handleMintDraft(asset)}
                                  disabled={mintTx.state.isLoading && selectedDraftId === asset.id}
                                  className="w-full rounded-full bg-indigo-600 hover:bg-indigo-500 py-2 text-xs font-semibold text-white transition-all duration-200 disabled:opacity-50"
                                >
                                  {mintTx.state.isLoading && selectedDraftId === asset.id
                                    ? getTxStatusLabel(mintTx.state.status, { pending_wallet: "Check wallet…", submitted: "Confirming…" })
                                    : "Mint NFT"}
                                </button>
                              )}
                              {mintTx.state.status !== "idle" && selectedDraftId === asset.id && (
                                <TxLifecycleBanner status={mintTx.state.status} txHash={mintTx.state.txHash} error={mintTx.state.error} />
                              )}
                            </>
                          ) : asset.status === "MINTING" ? (
                            <div className="w-full flex items-center justify-center gap-1.5 text-xs text-cyan-400 py-2 font-semibold">
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Publishing on-chain…
                            </div>
                          ) : asset.status === "MINTED" ? (
                            <button
                              onClick={() => initiateListing(asset)}
                              className="w-full rounded-full bg-fuchsia-600 hover:bg-fuchsia-500 py-2 text-xs font-semibold text-white transition-all"
                            >
                              List on Marketplace
                            </button>
                          ) : (
                            <div className="w-full flex items-center justify-center gap-1 text-xs text-fuchsia-400 py-2 font-semibold border border-fuchsia-500/20 rounded-full bg-fuchsia-500/5">
                              <Tag className="h-3.5 w-3.5" /> Listed on Marketplace
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom row */}
              <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
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
                              <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[9px] text-indigo-400">{c.type}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 font-mono">{c.address}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500">{c.timestamp}</span>
                            <a href={`https://sepolia.basescan.org/address/${c.address}`} target="_blank" rel="noreferrer" className="text-[10px] text-cyan-400 block mt-0.5 hover:underline">Verify</a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

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

          {/* ── Module: Collections Manager ───────────────────────────────── */}
          {activeModule === "collections" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <FileText className="h-6 w-6 text-emerald-400" /> Collection Creator
                </h2>
                <p className="text-slate-400 text-xs mt-1">Configure and save NFT collection metadata to the backend. On-chain factory deployment coming soon.</p>
              </div>

              {/* DEV_MODE notice — factory contract not yet deployed */}
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 flex items-start gap-3 text-xs text-amber-400">
                <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Collection Factory — Coming Soon</p>
                  <p className="text-amber-400/80 mt-0.5">
                    On-chain collection contract deployment via factory is not yet available on Base Sepolia. 
                    Save collections as drafts now — deploy buttons will activate once the WCOS Factory contract is deployed.
                    Set <code className="bg-amber-500/10 px-1 rounded">NEXT_PUBLIC_WCOS_FACTORY_ADDRESS</code> to enable.
                  </p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
                <div className="space-y-5 rounded-3xl border border-white/5 bg-slate-900/20 p-6">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Configure Collection Details</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase block">Collection Name</label>
                      <input type="text" value={colName} onChange={(e) => setColName(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-400"
                        placeholder="e.g. Cyberpunk Wanderers" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase block">Symbol</label>
                      <input type="text" value={colSymbol} onChange={(e) => setColSymbol(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-400"
                        placeholder="e.g. CPW" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 font-bold uppercase block">Description</label>
                    <textarea rows={2} value={colDesc} onChange={(e) => setColDesc(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-400"
                      placeholder="About this collection…" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase block">Logo Image URL</label>
                      <input type="text" value={colLogo} onChange={(e) => setColLogo(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-400"
                        placeholder="https://image.png" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase block">Banner Image URL</label>
                      <input type="text" value={colBanner} onChange={(e) => setColBanner(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-400"
                        placeholder="https://banner.png" />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase block">Max Supply</label>
                      <input type="number" value={colMaxSupply} onChange={(e) => setColMaxSupply(parseInt(e.target.value) || 0)}
                        className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-400" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase block">Royalty %</label>
                      <input type="number" value={colRoyalty} onChange={(e) => setColRoyalty(parseInt(e.target.value) || 0)}
                        className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-400" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase block">Token Standard</label>
                      <select value={colContractType} onChange={(e) => setColContractType(e.target.value as any)}
                        className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-400">
                        <option value="ERC-721">ERC-721</option>
                        <option value="ERC-1155">ERC-1155</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 font-bold uppercase block">Royalty Receiver Address</label>
                    <input type="text" value={colRoyaltyReceiver} onChange={(e) => setColRoyaltyReceiver(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-400"
                      placeholder="0x…" />
                  </div>
                  <div className="flex gap-3 pt-4 border-t border-white/5">
                    <button onClick={saveCollectionDraft}
                      className="flex-1 rounded-full border border-white/10 bg-slate-950 py-3.5 text-xs font-semibold text-slate-300 hover:bg-slate-900 transition">
                      Save as Draft
                    </button>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6">
                  <h3 className="text-sm font-bold text-white mb-4">My Collection Repositories</h3>
                  {collections.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 border border-dashed border-white/10 rounded-2xl text-slate-500 text-center">
                      <FileText className="h-8 w-8 mb-2" />
                      <p className="text-xs">No active collections found.</p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {collections.map((col) => (
                        <div key={col.id} className="p-4 bg-slate-950/65 rounded-2xl border border-white/5 flex items-start gap-3.5">
                          <img src={col.logoUrl} alt={col.name} className="h-12 w-12 rounded-xl object-cover" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white truncate text-xs">{col.name}</span>
                              <span className="rounded bg-white/5 px-2 py-0.5 text-[8px] text-slate-400 font-mono">{col.symbol}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{col.description}</p>
                            {col.status === "DEPLOYED" ? (
                              <p className="text-[9px] font-mono text-emerald-400 mt-2 truncate bg-emerald-500/5 px-2.5 py-1 border border-emerald-500/20 rounded-lg">
                                Deployed: {col.contractAddress}
                              </p>
                            ) : (
                              <div className="mt-2 flex items-center gap-2">
                                <span className="rounded-full bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 text-[8px] text-amber-400 font-bold uppercase">DRAFT</span>
                                <span className="text-[9px] text-slate-500">Factory deploy coming soon</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Module: AI Creator Studio & IPFS Minting ─────────────────────── */}
          {activeModule === "ai-studio" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-cyan-400" /> AI & IPFS Creator Studio
                  </h2>
                  <p className="text-slate-400 text-xs mt-1">Generate AI artwork or upload image files, pin standard NFT metadata to IPFS via Pinata, and mint on-chain.</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-900 border border-white/10 p-1.5 rounded-full">
                  <button onClick={() => setCreationMode("ai")} className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition ${creationMode === "ai" ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"}`}>
                    <Sparkles className="h-3 w-3" /> AI Art Generator
                  </button>
                  <button onClick={() => setCreationMode("upload")} className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition ${creationMode === "upload" ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"}`}>
                    <ImageIcon className="h-3 w-3" /> Upload Image File
                  </button>
                </div>
              </div>

              {/* Validation alert banner */}
              {validationError && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-center justify-between text-xs text-rose-300">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 text-rose-400" />
                    <span>{validationError}</span>
                  </div>
                  <button onClick={() => setValidationError(null)} className="text-slate-400 hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-[1.3fr_1.1fr]">
                <div className="space-y-5 rounded-3xl border border-white/5 bg-slate-900/20 p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">1. Configure Metadata</h3>
                      <div className="flex items-center gap-1.5 bg-slate-950 border border-white/10 p-1.5 rounded-xl text-xs">
                        <span className="text-[9px] text-slate-500 font-bold uppercase ml-1">Target Contract:</span>
                        <select value={selectedCollection} onChange={(e) => setSelectedCollection(e.target.value)}
                          className="bg-transparent text-white text-[10px] font-bold outline-none pr-1 cursor-pointer">
                          {collections.map((col) => (
                            <option key={col.id} value={col.contractAddress || col.id} className="bg-slate-950">
                              {col.name} ({col.status})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-bold uppercase block">Asset Name *</label>
                        <input type="text" value={nftName} onChange={(e) => setNftName(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                          placeholder="e.g. Cyberpunk Warrior #001" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-bold uppercase block">Category</label>
                        <select value={nftCategory} onChange={(e) => setNftCategory(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400">
                          <option value="art">Digital Artwork</option>
                          <option value="gaming">Gaming Collectibles</option>
                          <option value="music">Audio Tracks</option>
                          <option value="utility">Utility passes</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase block">Description *</label>
                      <textarea rows={2} value={nftDescription} onChange={(e) => setNftDescription(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                        placeholder="Provide details about the artwork or token utility…" />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-bold uppercase block">Royalty %</label>
                        <div className="relative">
                          <input type="number" value={nftRoyalty} onChange={(e) => setNftRoyalty(parseFloat(e.target.value) || 0)}
                            className="w-full rounded-xl border border-white/10 bg-slate-950 pl-3.5 pr-8 py-2.5 text-xs text-white outline-none focus:border-cyan-400" />
                          <Percent className="absolute right-3 top-3 h-4 w-4 text-slate-500" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-bold uppercase block">External URL</label>
                        <input type="text" value={nftExternalUrl} onChange={(e) => setNftExternalUrl(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                          placeholder="https://myproject.io" />
                      </div>
                    </div>

                    {/* Traits Manager */}
                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Attributes Traits Manager</span>
                      <div className="grid gap-3 sm:grid-cols-3 items-end">
                        <div className="space-y-1.5">
                          <label className="text-[9px] text-slate-400 uppercase">Trait Type</label>
                          <input type="text" value={newTraitType} onChange={(e) => setNewTraitType(e.target.value)} placeholder="e.g. Background"
                            className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] text-slate-400 uppercase">Value</label>
                          <input type="text" value={newTraitValue} onChange={(e) => setNewTraitValue(e.target.value)} placeholder="e.g. Obsidian Matrix"
                            className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400" />
                        </div>
                        <button type="button" onClick={addCustomTrait}
                          className="rounded-xl bg-cyan-600/10 border border-cyan-500/20 text-cyan-400 px-4 py-2 text-xs font-bold hover:bg-cyan-500/10 transition flex items-center justify-center gap-1.5">
                          <Plus className="h-4 w-4" /> Add Trait
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {traitsList.map((t, idx) => (
                          <div key={idx} className="flex items-center gap-2 rounded-xl bg-slate-950/60 border border-white/10 px-3 py-1.5 text-xs">
                            <span className="text-[9px] text-slate-500 font-semibold">{t.traitType}:</span>
                            <span className="font-bold text-white">{t.value}</span>
                            <button type="button" onClick={() => removeCustomTrait(idx)} className="text-slate-400 hover:text-rose-400 transition">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Mode 1: Custom File Upload */}
                  {creationMode === "upload" ? (
                    <div className="space-y-3 pt-4 border-t border-white/5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">2. Select NFT Image File</label>
                      <div className="border-2 border-dashed border-white/10 hover:border-cyan-500/50 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-950/50 transition text-center">
                        <ImageIcon className="h-8 w-8 text-cyan-400 mb-2" />
                        <p className="text-xs text-slate-300 font-semibold">Drag & drop or browse image file</p>
                        <p className="text-[10px] text-slate-500 mt-1">PNG, JPG, GIF, WEBP, SVG up to 10MB</p>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml"
                          onChange={handleFileChange}
                          className="mt-3 text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20 cursor-pointer"
                        />
                        {selectedFile && (
                          <div className="mt-3 text-xs text-emerald-400 font-mono font-bold">
                            ✓ Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Mode 2: AI Prompt Input */
                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label htmlFor="aiPrompt" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">2. AI Art Text Prompt</label>
                          <button onClick={handleEnhancePrompt} className="flex items-center gap-1 text-[10px] text-cyan-400 font-bold uppercase hover:text-cyan-300 transition-colors">
                            <Sparkles className="h-3 w-3" /> Enhance Prompt
                          </button>
                        </div>
                        <textarea id="aiPrompt" rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-xs text-slate-100 placeholder-slate-500 outline-none transition focus:border-cyan-400"
                          placeholder="Describe your prompt, e.g. A cybernetic owl sitting on a neon skyscraper..." />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Style Preset</label>
                        <div className="grid grid-cols-3 gap-2">
                          {["cyberpunk", "cinematic", "anime", "retro", "abstract"].map((style) => (
                            <button key={style} onClick={() => setSelectedStyle(style)}
                              className={`rounded-xl border py-2 px-3 text-xs font-semibold capitalize transition ${
                                selectedStyle === style ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300" : "border-white/5 bg-slate-950 text-slate-400 hover:border-white/10"
                              }`}>
                              {style}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button onClick={generateArt} disabled={isGenerating}
                        className="w-full inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 px-6 py-3 text-xs font-semibold text-white shadow-lg hover:opacity-90 active:scale-95 disabled:opacity-50">
                        {isGenerating ? "Synthesizing AI Artwork..." : "Generate AI Artwork"}
                      </button>
                    </div>
                  )}

                  {/* Actions & IPFS Upload Trigger */}
                  <div className="space-y-3 pt-4 border-t border-white/5">
                    <button
                      onClick={uploadAndPrepareIpfsMetadata}
                      disabled={ipfsUploadStep === "uploading_image" || ipfsUploadStep === "uploading_metadata"}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-600 px-6 py-3.5 text-xs font-bold text-white shadow-lg hover:opacity-90 active:scale-95 disabled:opacity-50"
                    >
                      {ipfsUploadStep === "uploading_image" ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" /> Step 1/2: Pinning Image to IPFS...
                        </>
                      ) : ipfsUploadStep === "uploading_metadata" ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" /> Step 2/2: Pinning Metadata JSON to IPFS...
                        </>
                      ) : (
                        <>
                          <Compass className="h-4 w-4" /> Upload Image & Metadata to IPFS (Pinata)
                        </>
                      )}
                    </button>

                    <div className="rounded-xl bg-slate-950/80 px-4 py-2.5 text-[10px] text-slate-400 border border-white/5 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-cyan-400">Status:</span> {aiStatus}
                      </div>
                      {uploadedIpfsMetadataGateway && (
                        <a
                          href={uploadedIpfsMetadataGateway}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-400 underline font-mono font-bold hover:text-emerald-300"
                        >
                          IPFS Preview
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Previews & Mint Action */}
                <div className="space-y-6 flex flex-col justify-between">
                  <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white">Image Preview</h3>
                      {uploadedIpfsImageGateway && (
                        <a
                          href={uploadedIpfsImageGateway}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-cyan-400 underline font-mono flex items-center gap-1"
                        >
                          <Globe className="h-3 w-3" /> Pinata Gateway Link
                        </a>
                      )}
                    </div>
                    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950 aspect-square flex items-center justify-center shadow-inner">
                      {imageUrl || imagePreviewUrl ? (
                        <img src={imageUrl || imagePreviewUrl} alt="NFT Preview" className="h-full w-full object-cover rounded-2xl" />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-6 text-slate-500">
                          <ImageIcon className="h-10 w-10 mb-2 animate-pulse text-slate-600" />
                          <p className="text-xs font-semibold text-slate-300">No Image Uploaded Yet</p>
                          <p className="text-[10px] mt-1 max-w-[200px]">Select a local file or click Generate AI Artwork to view preview.</p>
                        </div>
                      )}
                      {uploadedIpfsImageUri && (
                        <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[9px] font-bold text-emerald-400 border border-emerald-500/20 backdrop-blur-md">
                          Pinned on IPFS
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Eye className="h-4 w-4 text-cyan-400" /> Live Standard Metadata JSON
                      </h3>
                      {uploadedIpfsMetadataUri && (
                        <span className="text-[9px] text-emerald-400 font-mono font-bold">
                          {uploadedIpfsMetadataUri.slice(0, 16)}...
                        </span>
                      )}
                    </div>
                    <div className="rounded-2xl bg-slate-950 p-4 font-mono text-[9px] text-cyan-300 h-44 overflow-y-auto border border-white/5 whitespace-pre leading-relaxed select-all">
                      {compileLiveMetadata()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* ── Module: NFT Marketplace ───────────────────────────────────── */}
          {activeModule === "marketplace" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    <ShoppingBag className="h-6 w-6 text-fuchsia-400" /> NFT Marketplace
                  </h2>
                  <p className="text-slate-400 text-xs mt-1">Acquire and sell premium creator assets trustlessly on WCOS.</p>
                </div>
                <div className="flex items-center gap-1 bg-slate-900 border border-white/10 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase">
                  <Info className="h-3.5 w-3.5 text-fuchsia-400" />
                  <span>Auctions: Coming soon</span>
                </div>
              </div>

              {/* Marketplace contract status */}
              {isPlaceholderAddress(contractAddresses.WcosMarketplace) && (
                <div className="rounded-2xl border border-rose-500/25 bg-rose-500/5 p-3.5 flex items-center gap-2 text-[11px] text-rose-400 animate-pulse">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>
                    Marketplace contract is not configured on the selected network ({chainGuard.requiredChainName}). 
                    Smart contract interactions are disabled.
                  </span>
                </div>
              )}

              {/* Active marketplace tx lifecycle */}
              {(buyTx.state.status !== "idle" || cancelTx.state.status !== "idle") && (
                <TxLifecycleBanner
                  status={buyTx.state.status !== "idle" ? buyTx.state.status : cancelTx.state.status}
                  txHash={buyTx.state.txHash || cancelTx.state.txHash}
                  error={buyTx.state.error || cancelTx.state.error}
                />
              )}

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Active Fixed Price Listings</h3>
                {listings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-3xl text-slate-500">
                    <ShoppingBag className="h-12 w-12 mb-3 text-slate-600" />
                    <p className="text-sm font-semibold">No listings found.</p>
                    <p className="text-xs text-slate-500 mt-1">Go to Creator Dashboard and list your minted NFTs here.</p>
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {listings.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-white/5 bg-slate-900/30 overflow-hidden flex flex-col justify-between shadow-lg">
                        <div>
                          <div className="relative aspect-square">
                            <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                            <span className="absolute bottom-3 left-3 rounded-full bg-slate-950/80 px-2.5 py-0.5 text-[10px] font-bold text-fuchsia-400 border border-fuchsia-500/20 backdrop-blur-md">
                              {item.price} ETH
                            </span>
                          </div>
                          <div className="p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold text-white truncate">{item.name}</h4>
                              <span className="text-[8px] bg-white/5 px-2 py-0.5 rounded text-slate-400 font-mono uppercase">{item.chain}</span>
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{item.description}</p>
                            <div className="pt-2 text-[9px] font-mono text-slate-500 space-y-1">
                              <p className="truncate">Seller: {item.seller}</p>
                              <p className="truncate">Contract: {item.nftAddress}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 border-t border-white/5 bg-slate-900/10 flex gap-2">
                          {item.seller === address ? (
                            <button
                              onClick={() => handleCancelListing(item)}
                              disabled={cancelTx.state.isLoading && marketplaceActionId === item.id}
                              className="w-full rounded-full border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 py-2 text-xs font-semibold text-rose-400 transition disabled:opacity-50"
                            >
                              {cancelTx.state.isLoading && marketplaceActionId === item.id
                                ? getTxStatusLabel(cancelTx.state.status, { pending_wallet: "Check wallet…", submitted: "Confirming…" })
                                : "Cancel Listing"}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBuyNFT(item)}
                              disabled={buyTx.state.isLoading && marketplaceActionId === item.id}
                              className="w-full rounded-full bg-fuchsia-600 hover:bg-fuchsia-500 py-2 text-xs font-semibold text-white transition disabled:opacity-50"
                            >
                              {buyTx.state.isLoading && marketplaceActionId === item.id
                                ? getTxStatusLabel(buyTx.state.status, { pending_wallet: "Check wallet…", submitted: "Confirming…" })
                                : "Buy NFT"}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Module: Contract Builder ──────────────────────────────────── */}
          {activeModule === "contract-builder" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Layers className="h-6 w-6 text-fuchsia-400" /> Visual Contract Builder
                </h2>
                <p className="text-slate-400 text-xs mt-1">Configure and deploy custom smart contracts directly to the network. No coding required.</p>
              </div>

              {/* Chain guard */}
              <ChainGuardBanner {...chainGuard} />

              {/* Deploy tx lifecycle */}
              {deployWeb3.status !== "idle" && (
                <TxLifecycleBanner status={deployWeb3.status} txHash={deployWeb3.deployHash} error={deployWeb3.error} />
              )}

              <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
                <div className="space-y-5 rounded-3xl border border-white/5 bg-slate-900/20 p-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Contract Standard</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["ERC-20", "ERC-721", "ERC-1155"] as const).map((type) => (
                        <button key={type} onClick={() => setContractType(type)}
                          className={`rounded-xl border py-2.5 px-3 text-xs font-semibold transition ${
                            contractType === type ? "border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-300 shadow-lg" : "border-white/5 bg-slate-950 text-slate-400 hover:border-white/10"
                          }`}>
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
                        <input type="text" value={contractName} onChange={(e) => setContractName(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-fuchsia-400"
                          placeholder="e.g. My Custom Token" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Token Symbol</label>
                        <input type="text" value={contractSymbol} onChange={(e) => setContractSymbol(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-fuchsia-400"
                          placeholder="e.g. MCT" />
                      </div>
                    </div>
                    {contractType === "ERC-20" ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-500 font-bold uppercase">Total Supply</label>
                          <input type="text" value={tokenSupply} onChange={(e) => setTokenSupply(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-fuchsia-400"
                            placeholder="1000000" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-500 font-bold uppercase">Decimals</label>
                          <input type="number" value={tokenDecimals} onChange={(e) => setTokenDecimals(parseInt(e.target.value) || 18)}
                            className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-fuchsia-400" />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Creator Royalty % (ERC-2981)</label>
                        <input type="number" value={contractRoyalty} onChange={(e) => setContractRoyalty(parseInt(e.target.value) || 0)}
                          className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-fuchsia-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-white/5">
                    <button onClick={compileContract} disabled={isCompiling}
                      className="flex-1 rounded-full border border-white/10 bg-slate-950 py-3 text-xs font-semibold text-slate-300 hover:bg-slate-900 transition">
                      {isCompiling ? "Compiling Solidity…" : "Compile Contract"}
                    </button>
                    {compiledResult && (
                      <button
                        onClick={deployBuilderContract}
                        disabled={deployWeb3.isLoading || !chainGuard.isCorrectChain || !chainGuard.isConnected}
                        className="flex-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-indigo-600 py-3 text-xs font-semibold text-white shadow hover:opacity-90 transition disabled:opacity-50"
                      >
                        {deployWeb3.isLoading
                          ? getTxStatusLabel(deployWeb3.status, { pending_wallet: "Check wallet…", submitted: "Deploying…" })
                          : "Deploy Contract"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6">
                  <h3 className="text-sm font-bold text-white mb-4">Compiled Build Data</h3>
                  {compiledResult ? (
                    <div className="space-y-4">
                      <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-emerald-400 flex items-start gap-2.5 text-xs">
                        <CheckCircle2 className="h-5 w-5 mt-0.5" />
                        <div>
                          <p className="font-bold">Solidity Compilation Successful</p>
                          <p className="text-[10px] text-emerald-400/80 mt-0.5">Standard contract template resolved. Targets EVM.</p>
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
                      {deployWeb3.deployedAddress && (
                        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-emerald-400 text-xs">
                          <p className="font-bold">Deployed at:</p>
                          <a href={`https://sepolia.basescan.org/address/${deployWeb3.deployedAddress}`} target="_blank" rel="noreferrer"
                            className="font-mono text-[10px] underline break-all">{deployWeb3.deployedAddress}</a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 border border-dashed border-white/10 rounded-2xl text-slate-500 text-center">
                      <Code2 className="h-8 w-8 mb-2" />
                      <p className="text-xs">Compile your contract to see the bytecode, ABI, and deployment params.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          </WalletGuard>
        </main>
      </div>

      {/* Listing Price Modal */}
      {isListingModalOpen && selectedAssetForListing && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl relative">
            <button onClick={() => setIsListingModalOpen(false)} className="absolute right-4 top-4 text-slate-400 hover:text-white transition">
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold text-white">List NFT for Sale</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Set your fixed listing price. The NFT will be available for purchase on the WCOS marketplace.
            </p>
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 uppercase font-bold">Listing Price (ETH)</label>
              <input type="text" value={listingPrice} onChange={(e) => setListingPrice(e.target.value)} placeholder="0.05"
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-fuchsia-500 font-mono" />
            </div>
            <button onClick={submitListing}
              className="w-full rounded-full bg-gradient-to-r from-fuchsia-500 to-indigo-600 py-3 text-xs font-semibold text-white transition hover:opacity-95">
              Approve & List NFT
            </button>
          </div>
        </div>
      )}

      {/* AI Assistant */}
      <ChatAssistant
        onNavigateToModule={(moduleId) => {
          setActiveModule(moduleId);
          addTerminalLog(`AI navigation: switched to ${moduleId}`);
        }}
        onAutoConfigureParams={(moduleId, params) => {
          setAutoConfigParams((prev) => ({ ...prev, [moduleId]: params }));
        }}
      />
    </div>
  );
}
