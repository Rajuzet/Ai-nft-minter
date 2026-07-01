import { Controller, Get, Put, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProfileService } from './profile.service';

@ApiTags('Creator Profile')
@Controller('api/v1/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

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
