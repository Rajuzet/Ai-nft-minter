import { baseSepolia } from "wagmi/chains";

export interface StakingPoolConfig {
  id: string;
  name: string;
  stakingTokenSymbol: string;
  rewardTokenSymbol: string;
  apySource: string;
  minStake: string;
  lockOptions: {
    duration: number; // in days
    apy: number; // APY percentage
  }[];
}

export const STAKING_POOLS: Record<number, StakingPoolConfig[]> = {
  [baseSepolia.id]: [
    {
      id: "wgt-pool",
      name: "WGT Governance Power Staking",
      stakingTokenSymbol: "WGT",
      rewardTokenSymbol: "WGT",
      apySource: "Time-locked tiers",
      minStake: "10",
      lockOptions: [
        { duration: 30, apy: 8 },
        { duration: 90, apy: 12 },
        { duration: 365, apy: 18 },
      ],
    },
  ],
};

export const getStakingPoolsForChain = (chainId: number): StakingPoolConfig[] => {
  return STAKING_POOLS[chainId] || [];
};
