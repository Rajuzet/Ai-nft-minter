import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { MarketplaceService, ListingRecord } from './marketplace.service';
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

class CreateListingDto {
  @ApiProperty({ description: 'NFT Smart Contract Address' })
  @IsString()
  @IsNotEmpty()
  nftAddress: string;

  @ApiProperty({ description: 'Token ID' })
  @IsNumber()
  tokenId: number;

  @ApiProperty({ description: 'Seller wallet address' })
  @IsString()
  @IsNotEmpty()
  seller: string;

  @ApiProperty({ description: 'Price in Ether' })
  @IsString()
  @IsNotEmpty()
  price: string;

  @ApiProperty({ description: 'Collection Name' })
  @IsString()
  @IsNotEmpty()
  collectionName: string;

  @ApiProperty({ description: 'Chain Name' })
  @IsString()
  @IsNotEmpty()
  chain: string;

  @ApiProperty({ description: 'Numeric Chain ID', required: false })
  @IsNumber()
  @IsOptional()
  chainId?: number;

  @ApiProperty({ description: 'NFT Image URL' })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiProperty({ description: 'NFT Item Name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'NFT Item Description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Transaction Hash for Listing creation' })
  @IsString()
  @IsNotEmpty()
  txHash: string;
}

class BuyListingDto {
  @ApiProperty({ description: 'Listing ID (UUID from DB)' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'Buyer wallet address' })
  @IsString()
  @IsNotEmpty()
  buyer: string;

  @ApiProperty({ description: 'Transaction Hash for Purchase' })
  @IsString()
  @IsNotEmpty()
  txHash: string;
}

class CancelListingDto {
  @ApiProperty({ description: 'Listing ID' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'Transaction Hash for Cancellation' })
  @IsString()
  @IsNotEmpty()
  txHash: string;
}

@ApiTags('Marketplace')
@Controller('api/v1/marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('listings')
  @ApiOperation({ summary: 'List all active marketplace listings' })
  findAll() {
    return this.marketplaceService.findAll();
  }

  @Post('list')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a pending listing and verify on-chain' })
  create(@Body() dto: CreateListingDto) {
    return this.marketplaceService.create(dto);
  }

  @Post('buy')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark an NFT as bought and verify on-chain' })
  buy(@Body() dto: BuyListingDto) {
    return this.marketplaceService.buy(dto.id, dto.buyer, dto.txHash);
  }

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a listing as cancelled and verify on-chain' })
  cancel(@Body() dto: CancelListingDto) {
    return this.marketplaceService.cancel(dto.id, dto.txHash);
  }
}
