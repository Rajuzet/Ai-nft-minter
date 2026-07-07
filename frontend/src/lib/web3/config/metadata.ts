export const getAppMetadata = () => {
  const defaultUrl = "http://localhost:3000";
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : defaultUrl);

  return {
    name: "WCOS Creator Console",
    description: "AI-powered NFT minting, collections, marketplace, DeFi, and DAO governance on Base Network.",
    url: appUrl,
    icons: [`${appUrl}/favicon.ico`],
  };
};
