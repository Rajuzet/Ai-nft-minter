export interface WalletConfigStatus {
  isValid: boolean;
  projectId: string | null;
  isFallback: boolean;
  reason?: string;
  suggestedAction?: string;
}

export const validateWalletConfig = (): WalletConfigStatus => {
  const envProjectId =
    process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
    process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;

  const defaultFallback = "627e2bcf40428d0954b87e2213e4b77f";

  if (!envProjectId) {
    return {
      isValid: false,
      projectId: null,
      isFallback: false,
      reason: "Reown/WalletConnect Project ID is completely missing from environment variables.",
      suggestedAction: "Go to https://cloud.reown.com, create a project, and add NEXT_PUBLIC_REOWN_PROJECT_ID to your frontend/.env.local.",
    };
  }

  // If it's the known restricted fallback ID, mark it as invalid/fallback for localhost
  if (envProjectId === defaultFallback) {
    return {
      isValid: false,
      projectId: envProjectId,
      isFallback: true,
      reason: "Using the default fallback Project ID which does not allowlist http://localhost:3000.",
      suggestedAction: "Log in to Reown Cloud, ensure http://localhost:3000 is added to your project's allowed origins, or supply your own project ID via NEXT_PUBLIC_REOWN_PROJECT_ID.",
    };
  }

  // Basic check for placeholder text
  if (envProjectId.toLowerCase().includes("your") || envProjectId.length < 20) {
    return {
      isValid: false,
      projectId: envProjectId,
      isFallback: false,
      reason: "The configured Project ID appears to be a placeholder or is too short.",
      suggestedAction: "Replace the placeholder with a valid 32-character hexadecimal Project ID from Reown Cloud.",
    };
  }

  return {
    isValid: true,
    projectId: envProjectId,
    isFallback: false,
  };
};
export default validateWalletConfig;
