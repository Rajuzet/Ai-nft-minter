import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { MarketplaceService, ListingRecord } from './marketplace.service';
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

class CreateListingDto {
  @ApiProperty({ description: 'NFT Smart Contract Address', example: '0x...' })
  @IsString()
  @IsNotEmpty()
  nftAddress: string;

  @ApiProperty({ description: 'Token ID of listed NFT', example: 1 })
  @IsNumber()
  tokenId: number;

  @ApiProperty({ description: 'Seller wallet address', example: '0x...' })
  @IsString()
  @IsNotEmpty()
  seller: string;

  @ApiProperty({ description: 'Price in Ether', example: '0.1' })
  @IsString()
  @IsNotEmpty()
  price: string;

  @ApiProperty({ description: 'Collection Name', example: 'Neo Wanderers' })
  @IsString()
  @IsNotEmpty()
  collectionName: string;

  @ApiProperty({ description: 'Chain Name', example: 'base-sepolia' })
  @IsString()
  @IsNotEmpty()
  chain: string;

  @ApiProperty({ description: 'Numeric Chain ID', required: false, example: 84532 })
  @IsNumber()
  @IsOptional()
  chainId?: number;

  @ApiProperty({ description: 'NFT Image URL', example: 'https://image.png' })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiProperty({ description: 'NFT Item Name', example: 'Cyberpunk Visor #04' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'NFT Item Description', example: 'A futuristic visor.' })
  @IsString()
  @IsNotEmpty()
  description: string;
}

class BuyListingDto {
  @ApiProperty({ description: 'Listing identifier ID', example: 'list-123' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'Buyer wallet address', example: '0x...' })
  @IsString()
  @IsNotEmpty()
  buyer: string;

  @ApiProperty({ description: 'On-chain transaction hash', example: '0x...' })
  @IsString()
  @IsNotEmpty()
  txHash: string;
}

class CancelListingDto {
  @ApiProperty({ description: 'Listing identifier ID', example: 'list-123' })
  @IsString()
  @IsNotEmpty()
  id: string;
}

@ApiTags('Marketplace')
@Controller('api/v1/marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('listings')
  @ApiOperation({ summary: 'List all active marketplace listings' })
  @ApiResponse({ status: 200, description: 'Success' })
  findAll() {
    return this.marketplaceService.findAll();
  }

  @Post('list')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'List an NFT for fixed price' })
  @ApiResponse({ status: 201, description: 'Success' })
  create(@Body() dto: CreateListingDto) {
    return this.marketplaceService.create(dto);
  }

  @Post('buy')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Purchase a listed NFT' })
  @ApiResponse({ status: 200, description: 'Success' })
  buy(@Body() dto: BuyListingDto) {
    return this.marketplaceService.buy(dto.id, dto.buyer, dto.txHash);
  }

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an active NFT listing' })
  @ApiResponse({ status: 200, description: 'Success' })
  cancel(@Body() dto: CancelListingDto) {
    return this.marketplaceService.cancel(dto.id);
  }
}
