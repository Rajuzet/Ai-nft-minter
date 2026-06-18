"use client";

import { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";

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

const ART_STYLES = [
  { id: "none", name: "None (Raw Prompt)", suffix: "" },
  { id: "cyberpunk", name: "Cyberpunk", suffix: ", cyberpunk aesthetic, neon lights, high tech, low life, highly detailed, futuristic city, 8k resolution, blade runner style" },
  { id: "cinematic", name: "Cinematic", suffix: ", cinematic lighting, dramatic shadows, photorealistic, 35mm lens, depth of field, detailed textures, masterpiece" },
  { id: "anime", name: "Anime", suffix: ", gorgeous modern anime style, makoto shinkai aesthetic, vibrant colors, detailed sky, highly polished, digital art" },
  { id: "retro", name: "Retro Futurism", suffix: ", synthwave style, retro-futuristic, vaporwave, 1980s sci-fi art, sunset grid background, chrome reflections" },
  { id: "abstract", name: "Abstract Expressionism", suffix: ", abstract painting style, thick brush strokes, rich oil textures, complex geometry, emotional color palette, modern art gallery piece" }
];

export default function HomePage() {
  const { address, isConnected } = useAccount();
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("cyberpunk");
  const [metadataUrl, setMetadataUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [statusMessage, setStatusMessage] = useState("Ready to generate premium AI art.");
  const [isLoading, setIsLoading] = useState(false);

  const contractAddress = process.env.NEXT_PUBLIC_AINFT_MINTER_ADDRESS;
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

  // Wagmi v2 contract write hooks
  const { data: hash, writeContract, error: writeError, isPending: isMinting } = useWriteContract();
  const { isLoading: isWaitingForTx, isSuccess: isMintSuccess } = useWaitForTransactionReceipt({ hash });

  const isMintProcessActive = isMinting || isWaitingForTx;

  useEffect(() => {
    if (isMintSuccess) {
      setStatusMessage("Success! Your AI NFT has been minted and secured on-chain.");
    }
  }, [isMintSuccess]);

  useEffect(() => {
    if (writeError) {
      setStatusMessage(`Mint failed: ${writeError.message || "User rejected or insufficient gas"}`);
      console.error(writeError);
    }
  }, [writeError]);

  const generateArt = async () => {
    if (!prompt.trim()) {
      setStatusMessage("Please enter a detailed prompt before generating art.");
      return;
    }

    setIsLoading(true);
    setStatusMessage("Requesting AI art generation from Amazon Bedrock...");

    // Append style suffix to the user's prompt
    const styleObj = ART_STYLES.find((s) => s.id === selectedStyle);
    const fullPrompt = prompt.trim() + (styleObj ? styleObj.suffix : "");

    try {
      const response = await fetch(`${backendUrl}/api/generate-art`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: fullPrompt })
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Generation failed");

      setMetadataUrl(payload.metadataUrl);
      setImageUrl(payload.imageUrl);
      setStatusMessage("Art generated and uploaded to IPFS/S3. Ready to mint!");
    } catch (error: any) {
      console.error(error);
      setStatusMessage(error.message ? `Error: ${error.message}` : "Unable to generate art. Check backend connectivity.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMint = () => {
    if (!isConnected || !address) {
      setStatusMessage("Please connect your wallet first.");
      return;
    }
    if (!metadataUrl) {
      setStatusMessage("No metadata URL found. Please generate art first.");
      return;
    }
    if (!contractAddress || contractAddress.startsWith("0xYour")) {
      setStatusMessage("Smart contract address is not configured. Update NEXT_PUBLIC_AINFT_MINTER_ADDRESS in .env.local");
      return;
    }

    setStatusMessage("Confirm transaction in your wallet...");

    writeContract({
      address: contractAddress as `0x${string}`,
      abi: contractAbi,
      functionName: "mintAINFT",
      args: [address, metadataUrl],
      value: parseEther("0.005")
    });
  };

  const isContractConfigured = contractAddress && !contractAddress.startsWith("0xYour");

  return (
    <main className="min-h-screen px-4 py-10 md:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Top Navbar */}
        <header className="mb-12 flex flex-col gap-6 rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl md:flex-row md:items-center md:justify-between shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-cyan-400 to-fuchsia-500 p-[2px] shadow-lg shadow-cyan-500/20">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950 text-xl font-black text-cyan-400">
                A
              </div>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.3em] bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
                Next-Gen AI Minting
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">AI Studio Collective</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <ConnectButton showBalance={false} chainStatus="icon" />
          </div>
        </header>

        {/* Configuration Alert */}
        {!isContractConfigured && (
          <div className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-200 shadow-lg backdrop-blur-md flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 font-bold flex-shrink-0">
              !
            </div>
            <div>
              <p className="font-semibold">Smart Contract Address Pending</p>
              <p className="text-sm text-amber-200/80 mt-1">
                The minter contract address is not configured yet. Complete the smart contract deployment step and update your env variables to enable minting.
              </p>
            </div>
          </div>
        )}

        {/* Dashboard Grid */}
        <section className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          
          {/* Left Panel: Creator Tools */}
          <div className="space-y-6 rounded-3xl border border-white/5 bg-slate-900/30 p-6 backdrop-blur-xl shadow-2xl">
            <h2 className="text-xl font-semibold text-white flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 text-sm">1</span>
              Configure Artwork Parameters
            </h2>

            {/* Prompt Textarea */}
            <div className="space-y-2">
              <label htmlFor="prompt" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Creative prompt description
              </label>
              <textarea
                id="prompt"
                rows={5}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-5 py-4 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-cyan-400/70 focus:ring-1 focus:ring-cyan-400/50 focus:bg-slate-950"
                placeholder="Describe the masterpiece you want the AI to create (e.g. 'A futuristic robot painter in an overgrown garden, cosmic dust, photorealistic')..."
              />
            </div>

            {/* Art Style Selector */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Choose Art Style Preset
              </label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {ART_STYLES.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setSelectedStyle(style.id)}
                    className={`flex flex-col items-start rounded-2xl border p-4 text-left transition ${
                      selectedStyle === style.id
                        ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300 shadow-md shadow-cyan-500/5"
                        : "border-white/5 bg-slate-950/30 text-slate-400 hover:border-white/10 hover:bg-slate-900/20"
                    }`}
                  >
                    <span className="text-sm font-semibold">{style.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Generation CTA */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4">
              <button
                type="button"
                onClick={generateArt}
                disabled={isLoading}
                className="relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 p-[2px] font-semibold text-white shadow-lg transition hover:shadow-cyan-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex items-center justify-center rounded-full bg-slate-950 px-8 py-3.5 text-sm transition hover:bg-transparent">
                  {isLoading ? (
                    <>
                      <svg className="mr-3 h-4 w-4 animate-spin text-cyan-400" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating...
                    </>
                  ) : (
                    "Generate AI Masterpiece"
                  )}
                </span>
              </button>

              <div className="flex-1 rounded-2xl bg-slate-950/80 px-5 py-4 text-xs leading-relaxed text-slate-400 border border-white/5 shadow-inner">
                <span className="font-bold text-cyan-400">System Status:</span> {statusMessage}
              </div>
            </div>

            {/* Meta Data Outputs */}
            <div className="grid gap-4 pt-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Metadata Asset URL</p>
                <p className="mt-2 break-all text-xs font-mono text-cyan-300">
                  {metadataUrl ? (
                    <a href={metadataUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {metadataUrl}
                    </a>
                  ) : (
                    "Waiting for generation..."
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recipient Wallet</p>
                <p className="mt-2 text-xs font-mono text-slate-300">
                  {address ? `${address.slice(0, 10)}...${address.slice(-8)}` : "Connect Wallet"}
                </p>
              </div>
            </div>

            {/* Mint Action */}
            <button
              type="button"
              onClick={handleMint}
              disabled={isMintProcessActive || !metadataUrl || !address || !isContractConfigured}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4 text-sm font-semibold text-white shadow-xl transition hover:from-violet-500 hover:to-indigo-500 hover:shadow-indigo-500/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isMintProcessActive ? (
                <>
                  <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {isMinting ? "Awaiting Wallet Signature..." : "Minting NFT on Base..."}
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Mint Premium NFT (0.005 ETH)
                </>
              )}
            </button>
          </div>

          {/* Right Panel: Live NFT Canvas Preview */}
          <div className="rounded-3xl border border-white/5 bg-slate-900/30 p-6 backdrop-blur-xl shadow-2xl flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center gap-3 mb-6">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-fuchsia-500/20 text-fuchsia-400 text-sm">2</span>
                Marketplace NFT Preview
              </h2>

              {/* The Art Piece Box */}
              <div className="relative group overflow-hidden rounded-2xl border border-white/10 bg-slate-950 aspect-square flex items-center justify-center shadow-inner">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Generated NFT"
                    className="h-full w-full object-cover rounded-2xl transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-6">
                    <div className="relative mb-4">
                      <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-xl animate-pulse" />
                      <div className="relative h-16 w-16 rounded-full border border-white/20 flex items-center justify-center bg-slate-900">
                        <svg className="h-8 w-8 text-slate-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375 0 11-.75 0 .375 0 01.75 0z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-slate-300">Awaiting AI Art Canvas</p>
                    <p className="text-xs text-slate-500 mt-2 max-w-xs">Your generated art preview, token traits, and on-chain details will assemble here automatically.</p>
                  </div>
                )}

                {/* Status Badge overlay */}
                {imageUrl && (
                  <div className="absolute top-4 right-4">
                    {isMintSuccess ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20 backdrop-blur-md shadow-lg shadow-emerald-500/10">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                        On-Chain Minted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400 border border-cyan-500/20 backdrop-blur-md shadow-lg">
                        Unminted Draft
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* NFT Traits Card */}
            {imageUrl && (
              <div className="mt-6 space-y-4 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Token Collection</p>
                    <h3 className="text-lg font-bold text-white mt-1">AI Studio Collective Art</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Mint Price</p>
                    <p className="text-lg font-bold text-cyan-400 mt-1">0.005 ETH</p>
                  </div>
                </div>

                {/* Traits list grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/5 bg-slate-950/40 p-3">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Generation Engine</span>
                    <span className="text-xs font-semibold text-slate-300 block mt-1">Amazon Titan V2</span>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-slate-950/40 p-3">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Royalties Recipient</span>
                    <span className="text-xs font-semibold text-slate-300 block mt-1">5% (Creator Default)</span>
                  </div>
                </div>

                <div className="rounded-xl border border-white/5 bg-slate-950/40 p-3">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Creative Seed Prompt</span>
                  <span className="text-xs text-slate-300 block mt-1 italic font-serif line-clamp-2">
                    "{prompt}"
                  </span>
                </div>
              </div>
            )}
          </div>

        </section>
      </div>
    </main>
  );
}
