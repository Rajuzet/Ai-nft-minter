"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, usePrepareContractWrite, useContractWrite, useWaitForTransaction } from "wagmi";
import { parseEther } from "viem";

const contractAbi = [
  {
    inputs: [
      { internalType: "address", name: "recipient", type: "address" },
      { internalType: "string", name: "tokenURI", type: "string" }
    ],
    name: "mintAINFT",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "payable",
    type: "function"
  }
];

export default function HomePage() {
  const { address } = useAccount();
  const [prompt, setPrompt] = useState("");
  const [metadataUrl, setMetadataUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [statusMessage, setStatusMessage] = useState("Ready to generate premium AI art.");
  const [isLoading, setIsLoading] = useState(false);

  const contractAddress = process.env.NEXT_PUBLIC_AINFT_MINTER_ADDRESS;

  const { config } = usePrepareContractWrite({
    address: contractAddress ? (contractAddress as `0x${string}`) : undefined,
    abi: contractAbi,
    functionName: "mintAINFT",
    args: [address ?? "", metadataUrl],
    overrides: { value: parseEther("0.005") },
    enabled: Boolean(address && metadataUrl && contractAddress)
  });

  const { data, write, isLoading: isMinting } = useContractWrite(config);
  const { status } = useWaitForTransaction({ hash: data?.hash, enabled: Boolean(data?.hash) });

  const generateArt = async () => {
    if (!prompt.trim()) {
      setStatusMessage("Please enter a detailed prompt before generating art.");
      return;
    }

    setIsLoading(true);
    setStatusMessage("Requesting AI art generation...");

    try {
      const response = await fetch("http://localhost:4000/api/generate-art", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Generation failed");

      setMetadataUrl(payload.metadataUrl);
      setImageUrl(payload.imageUrl);
      setStatusMessage("Art generated successfully. Ready to mint the NFT.");
    } catch (error) {
      console.error(error);
      setStatusMessage("Unable to generate art. Check backend connectivity and prompt input.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl rounded-3xl border border-slate-800/70 bg-slate-950/80 p-8 shadow-soft backdrop-blur-xl">
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">AI NFT Generator SaaS</p>
            <h1 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">AI Studio Collective Dashboard</h1>
            <p className="mt-4 max-w-2xl text-slate-400">Generate on-chain-ready NFT metadata, mint with Base, and manage royalties securely.</p>
          </div>
          <div>
            <ConnectButton showBalance={false} chainStatus="icon" />
          </div>
        </header>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6 rounded-3xl border border-slate-800/90 bg-slate-900/80 p-8 shadow-soft">
            <div className="space-y-4">
              <label htmlFor="prompt" className="block text-sm font-medium text-slate-300">Prompt</label>
              <textarea
                id="prompt"
                rows={6}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                className="w-full rounded-3xl border border-slate-700 bg-slate-950/90 px-5 py-4 text-sm text-slate-100 outline-none ring-1 ring-slate-800 transition focus:border-cyan-400 focus:ring-cyan-400"
                placeholder="Enter the prompt for generative AI art, including style, mood, palette, and composition."
              />
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={generateArt}
                disabled={isLoading}
                className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Generating Art..." : "Generate Art"}
              </button>
              <div className="rounded-3xl bg-slate-950/70 px-5 py-4 text-sm text-slate-400 ring-1 ring-slate-800">
                {statusMessage}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5">
                <p className="text-sm text-slate-400">Metadata URL</p>
                <p className="mt-2 break-all text-sm text-slate-100">{metadataUrl || "Not generated yet."}</p>
              </div>
              <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5">
                <p className="text-sm text-slate-400">Wallet Address</p>
                <p className="mt-2 text-sm text-slate-100">{address || "Connect wallet to enable minting."}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => write?.()}
              disabled={!write || !metadataUrl || !address || isMinting}
              className="mt-6 w-full rounded-full bg-violet-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isMinting ? "Minting NFT..." : "Mint NFT on Base"}
            </button>
            {status === "success" && (
              <p className="mt-3 rounded-3xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">Transaction confirmed successfully.</p>
            )}
          </div>

          <div className="rounded-3xl border border-slate-800/90 bg-slate-900/80 p-8 shadow-soft">
            <h2 className="text-xl font-semibold text-white">Preview</h2>
            <p className="mt-3 text-sm text-slate-400">The generated metadata is fully ERC-721 compliant and includes a public image URL, description, and trait attributes.</p>
            <div className="mt-6 min-h-[320px] rounded-3xl border border-slate-800/90 bg-slate-950/70 p-4">
              {imageUrl ? (
                <img src={imageUrl} alt="Generated AI NFT" className="h-full w-full rounded-3xl object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center rounded-3xl bg-slate-900 text-slate-500">
                  Generated art preview will appear here.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
