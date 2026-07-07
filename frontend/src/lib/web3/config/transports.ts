import { http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";

export const getTransports = () => {
  const baseSepoliaRpc =
    process.env.NEXT_PUBLIC_RPC_URL ||
    process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL ||
    "https://sepolia.base.org";

  const baseRpc =
    process.env.NEXT_PUBLIC_BASE_RPC_URL ||
    "https://mainnet.base.org";

  return {
    [baseSepolia.id]: http(baseSepoliaRpc),
    [base.id]: http(baseRpc),
  };
};
