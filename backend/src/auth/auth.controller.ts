import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty, ApiHeader } from '@nestjs/swagger';
import { AuthService, VerifyDto } from './auth.service';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

class VerifySignatureDto implements VerifyDto {
  @ApiProperty({ description: 'Wallet Address', example: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' })
  @IsString()
  @IsNotEmpty()
  walletAddress: string;

  @ApiProperty({ description: 'SIWE Signature string', example: '0x...' })
  @IsString()
  @IsNotEmpty()
  signature: string;

  @ApiProperty({ description: 'Full SIWE message string', required: false })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiProperty({ description: 'Nonce used in signature', required: false })
  @IsString()
  @IsOptional()
  nonce?: string;
}

@ApiTags('SIWE Authentication')
@Controller(['api/auth', 'api/v1/auth'])
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('nonce')
  @ApiOperation({ summary: 'Generate a SIWE nonce for a wallet address' })
  @ApiResponse({ status: 200, description: 'Nonce generated successfully' })
  getNonce(@Query('address') address?: string) {
    return this.authService.getNonce(address);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify SIWE signature and generate JWT authentication token' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  verify(@Body() dto: VerifySignatureDto) {
    return this.authService.verifySignature(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user and invalidate SIWE session' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  logout(@Body('walletAddress') address?: string) {
    return this.authService.logout(address);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get currently authenticated user profile from JWT session' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <jwt_token>' })
  @ApiResponse({ status: 200, description: 'Authenticated user profile' })
  getMe(@Headers('authorization') authHeader?: string) {
    return this.authService.getMe(authHeader);
  }
}
