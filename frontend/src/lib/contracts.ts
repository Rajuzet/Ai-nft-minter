export const CONTRACT_ADDRESSES = {
  AINFTMinter: (process.env.NEXT_PUBLIC_AINFT_MINTER_ADDRESS || '0x498e82d77C29FAf0605a96E3D4F59E9E0C1BEc3A') as `0x${string}`,
  WcosMarketplace: (process.env.NEXT_PUBLIC_WCOS_MARKETPLACE_ADDRESS || '0x1234567890123456789012345678901234567890') as `0x${string}`,
  WcosStaking: (process.env.NEXT_PUBLIC_WCOS_STAKING_ADDRESS || '0x2345678901234567890123456789012345678901') as `0x${string}`,
  WcosGovernanceToken: (process.env.NEXT_PUBLIC_WCOS_GOVERNANCE_TOKEN_ADDRESS || '0x3456789012345678901234567890123456789012') as `0x${string}`,
};

export const AINFTMinterABI = [
  {
    type: 'function',
    name: 'mintNFT',
    stateMutability: 'payable',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'tokenURI', type: 'string' }
    ],
    outputs: [{ name: 'tokenId', type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'mintFee',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'ownerOf',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }]
  },
  {
    type: 'function',
    name: 'tokenURI',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }]
  }
] as const;

export const WcosMarketplaceABI = [
  {
    type: 'function',
    name: 'listToken',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'nftAddress', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'price', type: 'uint256' }
    ],
    outputs: []
  },
  {
    type: 'function',
    name: 'buyToken',
    stateMutability: 'payable',
    inputs: [
      { name: 'nftAddress', type: 'address' },
      { name: 'tokenId', type: 'uint256' }
    ],
    outputs: []
  },
  {
    type: 'function',
    name: 'cancelListing',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'nftAddress', type: 'address' },
      { name: 'tokenId', type: 'uint256' }
    ],
    outputs: []
  }
] as const;

export const WcosStakingABI = [
  {
    type: 'function',
    name: 'stake',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: []
  },
  {
    type: 'function',
    name: 'withdraw',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: []
  },
  {
    type: 'function',
    name: 'claimRewards',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: []
  }
] as const;
