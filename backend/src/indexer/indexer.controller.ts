import { Controller, Get, Post, Body, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { IndexerService } from './indexer.service';
import { IsOptional, IsNumber } from 'class-validator';

export class SyncIndexerDto {
  @ApiProperty({ description: 'Start block number for scanning', required: false })
  @IsOptional()
  @IsNumber()
  fromBlock?: number;

  @ApiProperty({ description: 'End block number for scanning', required: false })
  @IsOptional()
  @IsNumber()
  toBlock?: number;
}

@ApiTags('Blockchain Indexer')
@Controller()
export class IndexerController {
  constructor(private readonly indexerService: IndexerService) {}

  @Get('api/indexer/status')
  @ApiOperation({ summary: 'Get current indexer sync status & last processed block' })
  @ApiResponse({ status: 200, description: 'Indexer status details' })
  async getStatusLegacy() {
    return this.indexerService.getStatus();
  }

  @Get('api/v1/indexer/status')
  @ApiOperation({ summary: 'Get current indexer sync status & last processed block (v1)' })
  @ApiResponse({ status: 200, description: 'Indexer status details' })
  async getStatus() {
    return this.indexerService.getStatus();
  }

  @Post('api/indexer/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger manual indexer synchronization' })
  @ApiResponse({ status: 200, description: 'Manual sync completed' })
  async syncLegacy(@Body() dto: SyncIndexerDto) {
    const result = await this.indexerService.syncEvents(dto.fromBlock, dto.toBlock);
    return {
      success: true,
      ...result,
    };
  }

  @Post('api/v1/indexer/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger manual indexer synchronization (v1)' })
  @ApiResponse({ status: 200, description: 'Manual sync completed' })
  async sync(@Body() dto: SyncIndexerDto) {
    const result = await this.indexerService.syncEvents(dto.fromBlock, dto.toBlock);
    return {
      success: true,
      ...result,
    };
  }
}
