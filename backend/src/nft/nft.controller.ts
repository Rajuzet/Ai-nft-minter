import { Controller, Post, Get, Body, Param, Query, HttpCode, HttpStatus, ParseIntPipe, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty, ApiHeader } from '@nestjs/swagger';
import { NftService } from './nft.service';
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class CreatePendingMintDto {
  @ApiProperty() @IsString() @IsNotEmpty() contractAddress: string;
  @ApiProperty() @IsNumber() @IsNotEmpty() chainId: number;
  @ApiProperty() @IsString() @IsNotEmpty() ownerAddress: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() creatorAddress?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() name?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() description?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() tokenUri?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() imageUrl?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() attributes?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() prompt?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() aiModel?: string;
}

class ConfirmMintDto {
  @ApiProperty() @IsString() @IsNotEmpty() id: string;
  @ApiProperty() @IsNumber() @IsNotEmpty() tokenId: number;
  @ApiProperty() @IsString() @IsNotEmpty() txHash: string;
  @ApiProperty() @IsNumber() @IsNotEmpty() blockNumber: number;
}

class FailedMintDto {
  @ApiProperty() @IsString() @IsNotEmpty() id: string;
  @ApiProperty() @IsString() @IsOptional() txHash?: string;
}

@ApiTags('NFT Lifecycle')
@Controller('api/v1/nft')
export class NftController {
  constructor(private readonly nftService: NftService) {}

  @Post('pending')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a pending mint record before user signs transaction' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  createPending(@Body() dto: CreatePendingMintDto, @Req() req: any) {
    if (dto.ownerAddress.toLowerCase() !== req.user.walletAddress.toLowerCase()) {
      throw new ForbiddenException('Owner wallet address mismatch with authenticated session.');
    }
    return this.nftService.createPendingMint(dto);
  }

  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm a mint transaction after blockchain receipt' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  confirmMint(@Body() dto: ConfirmMintDto, @Req() req: any) {
    return this.nftService.confirmMint(dto.id, {
      tokenId: dto.tokenId,
      txHash: dto.txHash,
      blockNumber: dto.blockNumber,
    }, req.user.walletAddress);
  }

  @Post('failed')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a pending mint as failed' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  markFailed(@Body() dto: FailedMintDto, @Req() req: any) {
    return this.nftService.markFailed(dto.id, dto.txHash || '', req.user.walletAddress);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get minting history for a user' })
  getHistory(@Query('wallet') wallet: string) {
    if (!wallet) throw new Error('wallet parameter is required');
    return this.nftService.findHistory(wallet);
  }

  @Get('verify/:id')
  @ApiOperation({ summary: 'Verify NFT ownership by querying the blockchain directly via RPC' })
  verifyOnChain(@Param('id') id: string) {
    return this.nftService.verifyOnChain(id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all valid NFTs by wallet and chain' })
  getByWallet(
    @Query('wallet') wallet: string,
    @Query('chainId') chainId?: string
  ) {
    if (!wallet) throw new Error('wallet parameter is required');
    return this.nftService.findByWallet(wallet, chainId ? parseInt(chainId, 10) : undefined);
  }

  @Get(':contractAddress/:chainId/:tokenId')
  @ApiOperation({ summary: 'Get specific NFT by token ID and contract' })
  getOne(
    @Param('contractAddress') contractAddress: string,
    @Param('chainId', ParseIntPipe) chainId: number,
    @Param('tokenId', ParseIntPipe) tokenId: number
  ) {
    return this.nftService.findOne(contractAddress, chainId, tokenId);
  }
}
