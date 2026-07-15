import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus, ParseIntPipe, DefaultValuePipe, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { TransactionsService, CreateTxDto } from './transactions.service';
import { IsNotEmpty, IsString, IsOptional, IsIn, IsInt, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class RecordTxDto implements CreateTxDto {
  @ApiProperty({ description: 'On-chain transaction hash', example: '0x123abc...' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^0x[a-fA-F0-9]{64}$/, { message: 'txHash must be a valid 0x-prefixed 64-character hex string' })
  txHash: string;

  @ApiProperty({ description: 'Network identifier', example: 'base-sepolia' })
  @IsString()
  @IsNotEmpty()
  network: string;

  @ApiProperty({ description: 'Numeric chain ID', required: false, example: 84532 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  chainId?: number;

  @ApiProperty({ description: 'Transaction type', example: 'MINT', enum: ['MINT', 'LIST', 'BUY', 'SWAP', 'DEPLOY', 'STAKE'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['MINT', 'LIST', 'BUY', 'SWAP', 'DEPLOY', 'STAKE'])
  type: 'MINT' | 'LIST' | 'BUY' | 'SWAP' | 'DEPLOY' | 'STAKE';

  @ApiProperty({ description: 'Wallet address', required: false, example: '0xf39Fd...' })
  @IsString()
  @IsOptional()
  walletAddress?: string;

  @ApiProperty({ description: 'Additional details JSON', required: false })
  @IsOptional()
  details?: Record<string, any>;

  @ApiProperty({ description: 'Override status (defaults to on-chain verification)', required: false })
  @IsString()
  @IsOptional()
  status?: string;
}

@ApiTags('Transactions Indexer')
@Controller('api/v1/transactions')
export class TransactionsController {
  constructor(private readonly service: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'List recent confirmed transactions' })
  @ApiQuery({ name: 'wallet', required: false, description: 'Filter by wallet address' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 50, max: 100)' })
  @ApiResponse({ status: 200, description: 'Success' })
  findAll(
    @Query('wallet') wallet?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
  ) {
    if (wallet) {
      return this.service.findByWallet(wallet);
    }
    return this.service.findAll(page, limit);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record and verify an on-chain transaction hash' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  @ApiResponse({ status: 201, description: 'Transaction recorded and verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid transaction hash or missing fields' })
  create(@Body() dto: RecordTxDto, @Req() req: any) {
    if (dto.walletAddress && dto.walletAddress.toLowerCase() !== req.user.walletAddress.toLowerCase()) {
      throw new ForbiddenException('Wallet address context mismatch with authenticated session.');
    }
    // Automatically force the wallet address to be the session address for safety
    dto.walletAddress = req.user.walletAddress;
    return this.service.create(dto);
  }
}
