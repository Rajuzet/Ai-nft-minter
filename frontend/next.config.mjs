/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "*.ipfs.io" },
    ],
  },
  // Turbopack-compatible module resolution aliases
  // (replaces the old webpack fallback/alias approach)
  turbopack: {
    resolveAlias: {
      "pino-pretty": { browser: "./src/lib/empty-module.ts" },
      "@react-native-async-storage/async-storage": { browser: "./src/lib/empty-module.ts" },
    },
  },
};

export default nextConfig;
