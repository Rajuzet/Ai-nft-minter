import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus, UseGuards, Req, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty, ApiHeader } from '@nestjs/swagger';
import { DefiService } from './defi.service';
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class QuerySwapQuoteDto {
  @ApiProperty({ example: 84532 })
  @IsNumber()
  chainId: number;

  @ApiProperty({ example: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' })
  @IsString()
  walletAddress: string;

  @ApiProperty({ example: 'NATIVE' })
  @IsString()
  sellToken: string;

  @ApiProperty({ example: '0x036cbd53842c5426634e7929541ec2318f3dcf7e' })
  @IsString()
  buyToken: string;

  @ApiProperty({ example: '100000000000000000' })
  @IsString()
  sellAmount: string;

  @ApiProperty({ example: 50 })
  @IsNumber()
  slippageBps: number;
}

class CreatePendingSwapDto {
  @IsString()
  walletAddress: string;

  @IsNumber()
  chainId: number;

  @IsString()
  provider: string;

  @IsString()
  sellTokenAddress: string;

  @IsString()
  sellTokenSymbol: string;

  @IsNumber()
  sellTokenDecimals: number;

  @IsString()
  sellAmount: string;

  @IsString()
  buyTokenAddress: string;

  @IsString()
  buyTokenSymbol: string;

  @IsNumber()
  buyTokenDecimals: number;

  @IsString()
  quotedBuyAmount: string;

  @IsString()
  minimumBuyAmount: string;

  @IsNumber()
  slippageBps: number;

  @IsString()
  swapTransactionHash: string;

  @IsOptional()
  @IsString()
  allowanceTarget?: string;

  @IsOptional()
  @IsString()
  routerAddress?: string;
}

class ConfirmSwapDto {
  @IsNumber()
  chainId: number;

  @IsString()
  txHash: string;
}

class CreatePendingStakingDto {
  @IsString()
  walletAddress: string;

  @IsNumber()
  chainId: number;

  @IsString()
  stakingContract: string;

  @IsString()
  transactionType: string;

  @IsString()
  tokenAddress: string;

  @IsString()
  amount: string;

  @IsOptional()
  @IsString()
  rewardAmount?: string;

  @IsString()
  transactionHash: string;
}

class ConfirmStakingDto {
  @IsNumber()
  chainId: number;

  @IsString()
  txHash: string;
}

@ApiTags('DeFi Center')
@Controller('api/v1/defi')
export class DefiController {
  constructor(private readonly defiService: DefiService) {}

  @Get('portfolio')
  @ApiOperation({ summary: 'Get current wallet portfolio balances and token holdings' })
  @ApiResponse({ status: 200, description: 'Success' })
  getPortfolio(
    @Query('address') address: string,
    @Query('currency') currency?: string,
  ) {
    return this.defiService.getPortfolio(
      address || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      currency || 'USD',
    );
  }

  @Get('performance')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get historical valuation performance from snapshots' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  @ApiResponse({ status: 200, description: 'Success' })
  getPerformance(@Query('address') address: string, @Req() req: any) {
    if (!address) throw new BadRequestException('address parameter is required');
    if (address.toLowerCase() !== req.user.walletAddress.toLowerCase()) {
      throw new ForbiddenException('Access denied. You can only view your own performance snapshots.');
    }
    return this.defiService.getPerformance(address);
  }

  @Post('hide-asset')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hide a suspicious token asset from the portfolio UI' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  @ApiResponse({ status: 200, description: 'Success' })
  hideAsset(
    @Body('address') address: string,
    @Body('chainId') chainId: number,
    @Body('tokenAddress') tokenAddress: string,
    @Req() req: any,
  ) {
    if (address.toLowerCase() !== req.user.walletAddress.toLowerCase()) {
      throw new ForbiddenException('Access denied. Wallet mismatch.');
    }
    return this.defiService.hideAsset(address, chainId, tokenAddress);
  }

  @Post('unhide-asset')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unhide a token asset' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  @ApiResponse({ status: 200, description: 'Success' })
  unhideAsset(
    @Body('address') address: string,
    @Body('chainId') chainId: number,
    @Body('tokenAddress') tokenAddress: string,
    @Req() req: any,
  ) {
    if (address.toLowerCase() !== req.user.walletAddress.toLowerCase()) {
      throw new ForbiddenException('Access denied. Wallet mismatch.');
    }
    return this.defiService.unhideAsset(address, chainId, tokenAddress);
  }

  @Post('swap-quote')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get live exchange quotes and calldata from routing provider' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  @ApiResponse({ status: 200, description: 'Success' })
  getQuote(@Body() body: QuerySwapQuoteDto, @Req() req: any) {
    if (body.walletAddress.toLowerCase() !== req.user.walletAddress.toLowerCase()) {
      throw new ForbiddenException('Access denied. Wallet mismatch.');
    }
    return this.defiService.getSwapQuote({
      chainId: body.chainId,
      walletAddress: body.walletAddress as `0x${string}`,
      sellToken: body.sellToken,
      buyToken: body.buyToken,
      sellAmount: body.sellAmount,
      slippageBps: body.slippageBps,
    });
  }

  @Post('swap/pending')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register a pending swap transaction' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  @ApiResponse({ status: 200, description: 'Success' })
  createPendingSwap(@Body() body: CreatePendingSwapDto, @Req() req: any) {
    if (body.walletAddress.toLowerCase() !== req.user.walletAddress.toLowerCase()) {
      throw new ForbiddenException('Access denied. Wallet mismatch.');
    }
    return this.defiService.createPendingSwap(body);
  }

  @Post('swap/confirm')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm swap execution using on-chain transaction receipt' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  @ApiResponse({ status: 200, description: 'Success' })
  confirmSwap(@Body() body: ConfirmSwapDto) {
    return this.defiService.confirmSwap(body.chainId, body.txHash);
  }

  @Get('swap/history')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get swap transaction history' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  @ApiResponse({ status: 200, description: 'Success' })
  getSwapHistory(@Query('address') address: string, @Req() req: any) {
    if (!address) throw new BadRequestException('address parameter is required');
    if (address.toLowerCase() !== req.user.walletAddress.toLowerCase()) {
      throw new ForbiddenException('Access denied. Wallet mismatch.');
    }
    return this.defiService.getSwapHistory(address);
  }

  @Get('staking/pools')
  @ApiOperation({ summary: 'Get active staking pools' })
  @ApiResponse({ status: 200, description: 'Success' })
  getStakingPools(@Query('chainId') chainId: string) {
    return this.defiService.getStakingPools(Number(chainId || '84532'));
  }

  @Get('staking/positions')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get active staking positions' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  @ApiResponse({ status: 200, description: 'Success' })
  getStakingPositions(
    @Query('address') address: string,
    @Query('chainId') chainId: string,
    @Req() req: any,
  ) {
    if (!address) throw new BadRequestException('address parameter is required');
    if (address.toLowerCase() !== req.user.walletAddress.toLowerCase()) {
      throw new ForbiddenException('Access denied. Wallet mismatch.');
    }
    return this.defiService.getStakingPositions(address, Number(chainId || '84532'));
  }

  @Post('staking/pending')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register a pending staking transaction' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  @ApiResponse({ status: 200, description: 'Success' })
  createPendingStakingTransaction(@Body() body: CreatePendingStakingDto, @Req() req: any) {
    if (body.walletAddress.toLowerCase() !== req.user.walletAddress.toLowerCase()) {
      throw new ForbiddenException('Access denied. Wallet mismatch.');
    }
    return this.defiService.createPendingStakingTransaction(body);
  }

  @Post('staking/confirm')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm a staking transaction on-chain' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  @ApiResponse({ status: 200, description: 'Success' })
  confirmStakingTransaction(@Body() body: ConfirmStakingDto) {
    return this.defiService.confirmStakingTransaction(body.chainId, body.txHash);
  }

  @Get('staking/history')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get staking transaction history' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  @ApiResponse({ status: 200, description: 'Success' })
  getStakingHistory(@Query('address') address: string, @Req() req: any) {
    if (!address) throw new BadRequestException('address parameter is required');
    if (address.toLowerCase() !== req.user.walletAddress.toLowerCase()) {
      throw new ForbiddenException('Access denied. Wallet mismatch.');
    }
    return this.defiService.getStakingHistory(address);
  }
}
