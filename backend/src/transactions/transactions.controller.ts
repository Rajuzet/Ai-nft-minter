import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { TransactionsService, CreateTxDto } from './transactions.service';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

class RecordTxDto implements CreateTxDto {
  @ApiProperty({ description: 'On-chain transaction hash', example: '0x123...' })
  @IsString()
  @IsNotEmpty()
  txHash: string;

  @ApiProperty({ description: 'Network identifier', example: 'base-sepolia' })
  @IsString()
  @IsNotEmpty()
  network: string;

  @ApiProperty({ description: 'Transaction type', example: 'MINT' })
  @IsString()
  @IsNotEmpty()
  type: 'MINT' | 'LIST' | 'BUY' | 'SWAP' | 'DEPLOY' | 'STAKE';

  @ApiProperty({ description: 'Wallet address', required: false, example: '0x...' })
  @IsString()
  @IsOptional()
  walletAddress?: string;

  @ApiProperty({ description: 'Additional details', required: false })
  @IsOptional()
  details?: Record<string, any>;
}

@ApiTags('Transactions Indexer')
@Controller('api/v1/transactions')
export class TransactionsController {
  constructor(private readonly service: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'List recent confirmed transactions' })
  @ApiResponse({ status: 200, description: 'Success' })
  findAll(@Query('wallet') wallet?: string) {
    if (wallet) {
      return this.service.findByWallet(wallet);
    }
    return this.service.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a confirmed on-chain transaction hash' })
  @ApiResponse({ status: 201, description: 'Transaction recorded successfully' })
  create(@Body() dto: RecordTxDto) {
    return this.service.create(dto);
  }
}
