import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { DefiService, SwapQuoteDto } from './defi.service';
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

class RequestSwapQuoteDto implements SwapQuoteDto {
  @ApiProperty({ description: 'Swap provider key (uniswap, 1inch, 0x)', example: 'uniswap' })
  @IsString()
  @IsNotEmpty()
  adapter: string;

  @ApiProperty({ description: 'Token to sell', example: 'ETH' })
  @IsString()
  @IsNotEmpty()
  fromToken: string;

  @ApiProperty({ description: 'Token to buy', example: 'WGT' })
  @IsString()
  @IsNotEmpty()
  toToken: string;

  @ApiProperty({ description: 'Amount to trade', example: '0.1' })
  @IsString()
  @IsNotEmpty()
  amount: string;

  @ApiProperty({ description: 'Allowed slippage percentage (e.g. 0.5 for 0.5%)', example: 0.5 })
  @IsNumber()
  slippage: number;
}

@ApiTags('DeFi Center')
@Controller('api/v1/defi')
export class DefiController {
  constructor(private readonly defiService: DefiService) {}

  @Get('portfolio')
  @ApiOperation({ summary: 'Get current wallet portfolio balances and token holdings' })
  @ApiResponse({ status: 200, description: 'Success' })
  getPortfolio(@Query('address') address: string) {
    return this.defiService.getPortfolio(address || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
  }

  @Post('swap-quote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get exchange quotes and gas estimations from a swap adapter' })
  @ApiResponse({ status: 200, description: 'Success' })
  getQuote(@Body() body: RequestSwapQuoteDto) {
    return this.defiService.getQuote(body.adapter, {
      fromToken: body.fromToken,
      toToken: body.toToken,
      amount: body.amount,
      slippage: body.slippage
    });
  }
}
