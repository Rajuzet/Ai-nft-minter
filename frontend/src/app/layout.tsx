import type { Metadata } from "next";
import "./globals.css";
import Providers from "./Providers";

export const metadata: Metadata = {
  title: "WCOS — Web3 Creator Operating System",
  description: "AI-powered NFT minting, collections, marketplace, DeFi, and DAO governance on Base Network.",
  keywords: ["NFT", "Web3", "AI", "Base", "Creator", "DeFi", "DAO", "WCOS"],
  authors: [{ name: "WCOS Team" }],
  openGraph: {
    title: "WCOS — Web3 Creator Operating System",
    description: "AI-powered NFT minting and creator monetization on Base Network.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
