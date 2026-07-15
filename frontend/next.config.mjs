/** @type {import('next').NextConfig} */

// Build-time environment validation for production
if (process.env.NODE_ENV === 'production') {
  const requiredEnvVars = [
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID',
  ];
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missing.length > 0) {
    console.error('\n❌ ──────────────────────────────────────────────────────────────');
    console.error('❌ FRONTEND BUILD FAILED due to missing environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    console.error('❌ Please define these environment variables in your deployment.');
    console.error('❌ ──────────────────────────────────────────────────────────────\n');
    process.exit(1);
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl && (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) && process.env.ALLOW_LOCALHOST_BUILD !== 'true') {
    console.error('\n❌ ──────────────────────────────────────────────────────────────');
    console.error('❌ FRONTEND BUILD FAILED: NEXT_PUBLIC_API_URL cannot be localhost in production.');
    console.error('❌ ──────────────────────────────────────────────────────────────\n');
    process.exit(1);
  }
}

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "gateway.pinata.cloud" },
      { protocol: "https", hostname: "*.ipfs.io" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

export default nextConfig;
