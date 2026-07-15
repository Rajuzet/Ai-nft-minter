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
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty, ApiHeader } from '@nestjs/swagger';
import { AuthService, VerifyDto } from './auth.service';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SiweMessage } from 'siwe';

class VerifySignatureDto implements VerifyDto {
  @ApiProperty({ description: 'Wallet Address', example: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' })
  @IsString()
  @IsNotEmpty()
  walletAddress: string;

  @ApiProperty({ description: 'SIWE Signature string', example: '0x...' })
  @IsString()
  @IsNotEmpty()
  signature: string;

  @ApiProperty({ description: 'Full SIWE message string', required: true })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ description: 'Nonce used in signature', required: false })
  @IsString()
  @IsOptional()
  nonce?: string;
}

class SiweNonceDto {
  @ApiProperty({ description: 'Wallet Address', example: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' })
  @IsString()
  @IsNotEmpty()
  walletAddress: string;
}

class SiweVerifyDto {
  @ApiProperty({ description: 'Full SIWE message string' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ description: 'SIWE Signature string' })
  @IsString()
  @IsNotEmpty()
  signature: string;

  @ApiProperty({ description: 'Wallet Address of signer', required: false })
  @IsString()
  @IsOptional()
  walletAddress?: string;
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

  @Post('siwe/nonce')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate a SIWE nonce for a wallet address via POST' })
  @ApiResponse({ status: 200, description: 'Nonce generated successfully' })
  postNonce(@Body() dto: SiweNonceDto) {
    return this.authService.getNonce(dto.walletAddress);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify SIWE signature and generate JWT authentication token' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  verify(@Body() dto: VerifySignatureDto) {
    return this.authService.verifySignature(dto);
  }

  @Post('siwe/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify SIWE signature via POST and generate session token' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  verifySiwe(@Body() dto: SiweVerifyDto) {
    let walletAddress = dto.walletAddress;
    if (!walletAddress) {
      try {
        const parsed = new SiweMessage(dto.message);
        walletAddress = parsed.address;
      } catch (err) {
        throw new BadRequestException('Invalid SIWE message format.');
      }
    }
    return this.authService.verifySignature({
      walletAddress,
      signature: dto.signature,
      message: dto.message,
    });
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user and invalidate SIWE session' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  logout(
    @Body('walletAddress') address?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
    return this.authService.logout(token);
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke all active sessions for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Logout all successful' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  logoutAll(@Req() req: any) {
    return this.authService.logoutAll(req.user.sub);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get currently authenticated user profile from JWT session' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <jwt_token>' })
  @ApiResponse({ status: 200, description: 'Authenticated user profile' })
  getMe(@Headers('authorization') authHeader?: string) {
    return this.authService.getMe(authHeader);
  }
}
