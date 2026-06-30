import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { CollectionsService, CollectionRecord } from './collections.service';
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

class CreateCollectionDto {
  @ApiProperty({ description: 'Collection name', example: 'Neo Wanderers' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Collection symbol', example: 'NEOW' })
  @IsString()
  @IsNotEmpty()
  symbol: string;

  @ApiProperty({ description: 'Collection description', example: 'Obsidian collection' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Logo URL', example: 'https://logo.png' })
  @IsString()
  @IsOptional()
  logoUrl: string;

  @ApiProperty({ description: 'Banner URL', example: 'https://banner.png' })
  @IsString()
  @IsOptional()
  bannerUrl: string;

  @ApiProperty({ description: 'Category', example: 'art' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ description: 'Royalty fee percentage (e.g. 5 for 5%)', example: 5 })
  @IsNumber()
  royaltyPercentage: number;

  @ApiProperty({ description: 'Royalty payout receiver address', example: '0x0...' })
  @IsString()
  @IsNotEmpty()
  royaltyReceiver: string;

  @ApiProperty({ description: 'Max token supply limit', example: 1000 })
  @IsNumber()
  maxSupply: number;

  @ApiProperty({ description: 'Deployment network chain target', example: 'base-sepolia' })
  @IsString()
  @IsNotEmpty()
  chain: string;

  @ApiProperty({ description: 'EVM Token collection standard', example: 'ERC-721' })
  @IsString()
  @IsNotEmpty()
  contractType: 'ERC-721' | 'ERC-1155';

  @ApiProperty({ description: 'Deployment status', example: 'DRAFT' })
  @IsString()
  status: 'DRAFT' | 'DEPLOYED' | 'DEPLOYING';

  @ApiProperty({ description: 'Deployed contract address', required: false })
  @IsString()
  @IsOptional()
  contractAddress?: string;
}

class DeployCollectionDto {
  @ApiProperty({ description: 'Collection record ID', example: 'col-123' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'Deployed contract address on-chain', example: '0x...' })
  @IsString()
  @IsNotEmpty()
  contractAddress: string;
}

@ApiTags('Collections')
@Controller('api/v1/collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all registered creator collections' })
  @ApiResponse({ status: 200, description: 'Success' })
  findAll() {
    return this.collectionsService.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new collection profile or draft' })
  @ApiResponse({ status: 201, description: 'Success' })
  create(@Body() dto: CreateCollectionDto) {
    return this.collectionsService.create(dto);
  }

  @Post('deploy')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update collection status to deployed with contract address' })
  @ApiResponse({ status: 200, description: 'Success' })
  deploy(@Body() dto: DeployCollectionDto) {
    return this.collectionsService.deploy(dto.id, dto.contractAddress);
  }
}
