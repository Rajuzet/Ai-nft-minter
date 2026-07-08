import { Controller, Get, Put, Post, Param, Body, Query, Headers, UseGuards, Req, ForbiddenException } from '@nestjs/common';
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
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update creator profile fields' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  updateProfile(@Param('address') address: string, @Body() update: any, @Req() req: any) {
    if (req.user.walletAddress.toLowerCase() !== address.toLowerCase()) {
      throw new ForbiddenException('You can only update your own creator profile');
    }
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
