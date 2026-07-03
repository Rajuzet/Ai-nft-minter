import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { IsNotEmpty, IsString } from 'class-validator';

class VerifySignatureDto {
  @ApiProperty({ description: 'Wallet Address', example: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' })
  @IsString()
  @IsNotEmpty()
  walletAddress: string;

  @ApiProperty({ description: 'SIWE Signature string', example: '0x...' })
  @IsString()
  @IsNotEmpty()
  signature: string;
}

@ApiTags('SIWE Authentication')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('nonce')
  @ApiOperation({ summary: 'Generate a SIWE nonce for a wallet address' })
  @ApiResponse({ status: 200, description: 'Nonce generated' })
  getNonce(@Query('address') address: string) {
    return this.authService.getNonce(address);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify SIWE signature and generate JWT authentication token' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  verify(@Body() dto: VerifySignatureDto) {
    return this.authService.verifySignature(dto.walletAddress, dto.signature);
  }
}
