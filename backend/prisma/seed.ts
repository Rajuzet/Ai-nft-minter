import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // ─── 1. SEED PRODUCTION / CORE PROTOCOL CONFIGURATIONS ─────────────────────
  
  // Create the canonical DAO Organization
  console.log('Seeding DAO Organization...');
  const daoOrg = await prisma.daoOrganization.upsert({
    where: { id: 'wcos-canonical-dao' },
    update: {
      name: 'WCOS DAO Governance',
      description: 'On-chain governance for the Web3 Creator Operating System (WCOS) protocol.',
      govType: 'Token-weighted',
      votingToken: 'WGT',
      threshold: 1,
      quorum: 10,
      duration: 100, // blocks duration for voting
      treasuryAddress: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      chainId: 84532,
    },
    create: {
      id: 'wcos-canonical-dao',
      name: 'WCOS DAO Governance',
      description: 'On-chain governance for the Web3 Creator Operating System (WCOS) protocol.',
      govType: 'Token-weighted',
      votingToken: 'WGT',
      threshold: 1,
      quorum: 10,
      duration: 100,
      treasuryAddress: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      chainId: 84532,
    },
  });

  // Seed default token metadatas (WGT, USDC, WETH)
  console.log('Seeding Token Metadatas...');
  const tokens = [
    {
      chainId: 84532,
      address: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // WcosGovernanceToken
      symbol: 'WGT',
      name: 'WCOS Governance Token',
      decimals: 18,
      isVerified: true,
    },
    {
      chainId: 84532,
      address: '0x036cbd53842c5426634e7929541ec2318f3dcf7e', // Base Sepolia USDC
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      isVerified: true,
    },
    {
      chainId: 84532,
      address: '0x4200000000000000000000000000000000000006', // WETH
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      isVerified: true,
    },
  ];

  for (const token of tokens) {
    await prisma.tokenMetadata.upsert({
      where: {
        chainId_address: {
          chainId: token.chainId,
          address: token.address.toLowerCase(),
        },
      },
      update: token,
      create: token,
    });
  }

  // ─── 2. SEED DEVELOPMENT / PLAYGROUND DATA ───────────────────────────────
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    console.log('🔧 NODE_ENV is not production. Seeding mock development data...');

    // Seed mock users / profiles
    console.log('Seeding mock users...');
    const users = [
      {
        id: 'mock-user-1',
        walletAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', // Anvil account #0
        displayName: 'Alice (Creator #1)',
        username: 'alice',
        bio: 'Digital artist and Web3 early adopter. Minting cool items daily.',
        verified: true,
        role: 'CREATOR',
      },
      {
        id: 'mock-user-2',
        walletAddress: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8', // Anvil account #1
        displayName: 'Bob (Collector #1)',
        username: 'bob',
        bio: 'WCOS platform collector and token swap enthusiast.',
        verified: false,
        role: 'USER',
      },
    ];

    for (const u of users) {
      await prisma.user.upsert({
        where: { walletAddress: u.walletAddress.toLowerCase() },
        update: u,
        create: u,
      });

      // Link mock profile
      await prisma.profile.upsert({
        where: { userId: u.id },
        update: {
          displayName: u.displayName,
          bio: u.bio,
          avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${u.walletAddress}`,
        },
        create: {
          userId: u.id,
          displayName: u.displayName,
          bio: u.bio,
          avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${u.walletAddress}`,
        },
      });

      // Link a primary mock wallet record
      await prisma.wallet.upsert({
        where: { normalizedAddress: u.walletAddress.toLowerCase() },
        update: {
          address: u.walletAddress,
          isPrimary: true,
          isVerified: true,
          verifiedAt: new Date(),
        },
        create: {
          userId: u.id,
          address: u.walletAddress,
          normalizedAddress: u.walletAddress.toLowerCase(),
          isPrimary: true,
          isVerified: true,
          verifiedAt: new Date(),
        },
      });
    }

    // Seed a mock active proposal for DAO interaction tests
    console.log('Seeding mock proposal...');
    await prisma.daoProposal.upsert({
      where: { id: 'mock-proposal-1' },
      update: {
        title: 'Launch WCOS AI Studio V2',
        summary: 'Upgrade the text-to-image pipeline to use the enhanced prompt optimizer.',
        description: 'This proposal details the launch specifications for WCOS AI Studio V2. It includes moving the prompt optimization pipeline backend code to NestJS and utilizing Pinata gateway storage.',
        category: 'DEVELOPMENT',
        proposalType: 'INFORMATIONAL',
        targetAddress: '0x0000000000000000000000000000000000000000',
        calldata: '0x',
        valueTransferred: '0',
        status: 'ACTIVE',
        chainId: 84532,
      },
      create: {
        id: 'mock-proposal-1',
        daoId: daoOrg.id,
        proposerId: 'mock-user-1',
        title: 'Launch WCOS AI Studio V2',
        summary: 'Upgrade the text-to-image pipeline to use the enhanced prompt optimizer.',
        description: 'This proposal details the launch specifications for WCOS AI Studio V2. It includes moving the prompt optimization pipeline backend code to NestJS and utilizing Pinata gateway storage.',
        category: 'DEVELOPMENT',
        proposalType: 'INFORMATIONAL',
        targetAddress: '0x0000000000000000000000000000000000000000',
        calldata: '0x',
        valueTransferred: '0',
        status: 'ACTIVE',
        chainId: 84532,
      },
    });
  }

  console.log('🎉 Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Database seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
