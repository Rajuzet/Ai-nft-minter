import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('Creator Analytics')
@Controller('api/v1/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('creator')
  @ApiOperation({ summary: 'Get full creator analytics for a wallet address' })
  @ApiResponse({ status: 200, description: 'Success' })
  getCreatorAnalytics(@Query('address') address: string) {
    return this.analyticsService.getCreatorAnalytics(
      address || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    );
  }

  @Get('global')
  @ApiOperation({ summary: 'Get platform-wide global metrics' })
  @ApiResponse({ status: 200, description: 'Success' })
  getGlobalMetrics() {
    return this.analyticsService.getGlobalMetrics();
  }
}
