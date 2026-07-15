import { Controller, Get, Post, Body, HttpCode, HttpStatus, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty, ApiHeader } from '@nestjs/swagger';
import { MarketplaceService, ListingRecord } from './marketplace.service';
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a pending listing and verify on-chain' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  create(@Body() dto: CreateListingDto, @Req() req: any) {
    if (dto.seller.toLowerCase() !== req.user.walletAddress.toLowerCase()) {
      throw new ForbiddenException('Seller wallet address mismatch with authenticated session.');
    }
    return this.marketplaceService.create(dto);
  }

  @Post('buy')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark an NFT as bought and verify on-chain' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  buy(@Body() dto: BuyListingDto, @Req() req: any) {
    if (dto.buyer.toLowerCase() !== req.user.walletAddress.toLowerCase()) {
      throw new ForbiddenException('Buyer wallet address mismatch with authenticated session.');
    }
    return this.marketplaceService.buy(dto.id, dto.buyer, dto.txHash);
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a listing as cancelled and verify on-chain' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  cancel(@Body() dto: CancelListingDto, @Req() req: any) {
    return this.marketplaceService.cancel(dto.id, dto.txHash, req.user.walletAddress);
  }
}
