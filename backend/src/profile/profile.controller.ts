import { Controller, Get, Put, Post, Param, Body, Query, Headers, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Creator Profile')
@Controller('api/v1/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get authenticated user profile' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  getAuthenticatedProfile(@Req() req: any) {
    return this.profileService.getProfile(req.user.walletAddress);
  }

  @Get('nfts')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get authenticated user NFTs' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  getAuthenticatedNfts(@Req() req: any) {
    return this.profileService.getUserNfts(req.user.walletAddress);
  }

  @Get(':address')
  @ApiOperation({ summary: 'Get public creator profile for a wallet address' })
  getProfile(@Param('address') address: string) {
    return this.profileService.getProfile(address);
  }

  @Put(':address')
  @ApiOperation({ summary: 'Update creator profile fields' })
  updateProfile(@Param('address') address: string, @Body() update: any) {
    return this.profileService.updateProfile(address, update);
  }

  @Post('token-gate/verify')
  @ApiOperation({ summary: 'Verify that a wallet meets a token gate requirement' })
  verifyTokenGate(
    @Body() body: { address: string; contractAddress: string; minBalance: number },
  ) {
    return this.profileService.verifyTokenGate(
      body.address,
      body.contractAddress,
      body.minBalance ?? 1,
    );
  }
}
