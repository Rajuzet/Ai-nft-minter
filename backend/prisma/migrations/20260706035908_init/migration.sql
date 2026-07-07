-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletAddress" TEXT NOT NULL,
    "displayName" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "bannerUrl" TEXT,
    "website" TEXT,
    "twitter" TEXT,
    "discord" TEXT,
    "instagram" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "nonce" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CREATOR',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "bannerUrl" TEXT,
    "website" TEXT,
    "twitter" TEXT,
    "discord" TEXT,
    "instagram" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "billingPlan" TEXT NOT NULL DEFAULT 'FREE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeployedContract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "organizationId" TEXT,
    "contractAddress" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "contractType" TEXT NOT NULL,
    "name" TEXT,
    "symbol" TEXT,
    "abi" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeployedContract_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DeployedContract_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NftCollection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "network" TEXT NOT NULL DEFAULT 'base-sepolia',
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "maxSupply" INTEGER NOT NULL DEFAULT 1000,
    "mintedCount" INTEGER NOT NULL DEFAULT 0,
    "royaltyBps" INTEGER NOT NULL DEFAULT 500,
    "coverImage" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DEPLOYED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NftCollection_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Nft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractAddress" TEXT NOT NULL,
    "tokenId" INTEGER NOT NULL,
    "ownerAddress" TEXT NOT NULL,
    "minterAddress" TEXT,
    "tokenUri" TEXT,
    "name" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "chainId" INTEGER NOT NULL DEFAULT 84532,
    "blockNumber" INTEGER NOT NULL DEFAULT 0,
    "txHash" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ownerId" TEXT,
    "collectionId" TEXT,
    CONSTRAINT "Nft_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Nft_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "NftCollection" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IndexedNft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractAddress" TEXT NOT NULL,
    "tokenId" INTEGER NOT NULL,
    "ownerAddress" TEXT NOT NULL,
    "minterAddress" TEXT,
    "tokenUri" TEXT,
    "name" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "blockNumber" INTEGER NOT NULL,
    "txHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MarketplaceListing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "collectionId" TEXT,
    "nftId" TEXT,
    "nftAddress" TEXT NOT NULL,
    "tokenId" INTEGER NOT NULL,
    "sellerId" TEXT NOT NULL,
    "buyerId" TEXT,
    "price" TEXT NOT NULL,
    "collectionName" TEXT NOT NULL,
    "chain" TEXT NOT NULL DEFAULT 'base-sepolia',
    "imageUrl" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "txHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MarketplaceListing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MarketplaceListing_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MarketplaceListing_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "NftCollection" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MarketplaceListing_nftId_fkey" FOREIGN KEY ("nftId") REFERENCES "Nft" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NftSale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT,
    "nftAddress" TEXT NOT NULL,
    "tokenId" INTEGER NOT NULL,
    "sellerAddress" TEXT NOT NULL,
    "buyerAddress" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "royaltyPaid" TEXT NOT NULL DEFAULT '0',
    "txHash" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NftSale_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DaoOrganization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "govType" TEXT NOT NULL DEFAULT 'Token-weighted',
    "votingToken" TEXT NOT NULL DEFAULT 'WGT',
    "threshold" INTEGER NOT NULL DEFAULT 100,
    "quorum" INTEGER NOT NULL DEFAULT 10,
    "duration" INTEGER NOT NULL DEFAULT 5760,
    "treasuryAddress" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "DaoProposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "daoId" TEXT NOT NULL,
    "proposerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetAddress" TEXT NOT NULL,
    "valueTransferred" TEXT NOT NULL DEFAULT '0',
    "forVotes" INTEGER NOT NULL DEFAULT 0,
    "againstVotes" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DaoProposal_daoId_fkey" FOREIGN KEY ("daoId") REFERENCES "DaoOrganization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DaoProposal_proposerId_fkey" FOREIGN KEY ("proposerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DaoVote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proposalId" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "support" BOOLEAN NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DaoVote_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "DaoProposal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DaoVote_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "enhancedPrompt" TEXT,
    "stylePreset" TEXT,
    "category" TEXT,
    "imageUrl" TEXT NOT NULL,
    "metadataUrl" TEXT,
    "storageProvider" TEXT NOT NULL DEFAULT 'local',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TransactionRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "txHash" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TransactionRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChainEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL DEFAULT 84532,
    "network" TEXT NOT NULL DEFAULT 'base-sepolia',
    "contractAddress" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "txHash" TEXT NOT NULL,
    "dataJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "IndexerState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "network" TEXT NOT NULL,
    "lastProcessedBlock" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NewsCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "NewsSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "feedUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Web3',
    "isTrusted" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "NewsArticle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "content" TEXT,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "url" TEXT,
    "imageUrl" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Web3',
    "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "readTime" TEXT NOT NULL DEFAULT '3 min',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sourceId" TEXT,
    "categoryId" TEXT,
    CONSTRAINT "NewsArticle_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "NewsSource" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "NewsArticle_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "NewsCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MagazineArticle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorRole" TEXT,
    "authorAvatar" TEXT,
    "category" TEXT NOT NULL DEFAULT 'founder-notes',
    "imageUrl" TEXT,
    "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isEditorPick" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "readTime" TEXT NOT NULL DEFAULT '5 min',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "categoryId" TEXT,
    CONSTRAINT "MagazineArticle_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "NewsCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_organizationId_userId_key" ON "OrganizationMember"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "DeployedContract_contractAddress_network_key" ON "DeployedContract"("contractAddress", "network");

-- CreateIndex
CREATE UNIQUE INDEX "Nft_chainId_contractAddress_tokenId_key" ON "Nft"("chainId", "contractAddress", "tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "IndexedNft_contractAddress_tokenId_key" ON "IndexedNft"("contractAddress", "tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "DaoVote_proposalId_voterId_key" ON "DaoVote"("proposalId", "voterId");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionRecord_txHash_key" ON "TransactionRecord"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "ChainEvent_eventId_key" ON "ChainEvent"("eventId");

-- CreateIndex
CREATE INDEX "ChainEvent_contractAddress_eventName_idx" ON "ChainEvent"("contractAddress", "eventName");

-- CreateIndex
CREATE INDEX "ChainEvent_blockNumber_idx" ON "ChainEvent"("blockNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ChainEvent_chainId_txHash_logIndex_key" ON "ChainEvent"("chainId", "txHash", "logIndex");

-- CreateIndex
CREATE UNIQUE INDEX "IndexerState_network_key" ON "IndexerState"("network");

-- CreateIndex
CREATE UNIQUE INDEX "NewsCategory_name_key" ON "NewsCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "NewsCategory_slug_key" ON "NewsCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "NewsSource_feedUrl_key" ON "NewsSource"("feedUrl");

-- CreateIndex
CREATE UNIQUE INDEX "NewsArticle_slug_key" ON "NewsArticle"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "NewsArticle_sourceUrl_key" ON "NewsArticle"("sourceUrl");

-- CreateIndex
CREATE UNIQUE INDEX "NewsArticle_url_key" ON "NewsArticle"("url");

-- CreateIndex
CREATE INDEX "NewsArticle_category_idx" ON "NewsArticle"("category");

-- CreateIndex
CREATE INDEX "NewsArticle_status_idx" ON "NewsArticle"("status");

-- CreateIndex
CREATE INDEX "NewsArticle_publishedAt_idx" ON "NewsArticle"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MagazineArticle_slug_key" ON "MagazineArticle"("slug");

-- CreateIndex
CREATE INDEX "MagazineArticle_category_idx" ON "MagazineArticle"("category");

-- CreateIndex
CREATE INDEX "MagazineArticle_isFeatured_idx" ON "MagazineArticle"("isFeatured");
