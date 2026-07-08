import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty, ApiHeader } from '@nestjs/swagger';
import { DaoService, DaoRecord, ProposalRecord } from './dao.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsNotEmpty, IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

class CreateDaoDto {
  @ApiProperty({ description: 'DAO Community Name', example: 'Core DAO' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'DAO Purpose description', example: 'Managing treasury assets.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'DAO Governance Type', example: 'Token-weighted' })
  @IsString()
  @IsNotEmpty()
  govType: string;

  @ApiProperty({ description: 'Voting Token name or standard symbol', example: 'WGT' })
  @IsString()
  @IsNotEmpty()
  votingToken: string;

  @ApiProperty({ description: 'Minimum votes threshold required to propose', example: 100 })
  @IsNumber()
  threshold: number;

  @ApiProperty({ description: 'Quorum percentage requirement', example: 10 })
  @IsNumber()
  quorum: number;

  @ApiProperty({ description: 'Voting duration limit in blocks', example: 5760 })
  @IsNumber()
  duration: number;

  @ApiProperty({ description: 'Treasury wallet destination address', example: '0x...' })
  @IsString()
  @IsNotEmpty()
  treasuryAddress: string;

  @ApiProperty({ description: 'Numeric chain ID', required: false, example: 84532 })
  @IsNumber()
  @IsOptional()
  chainId?: number;
}

class CreateProposalDto {
  @ApiProperty({ description: 'Proposal Title', example: 'Adjust Royalty Rate' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Proposal details', example: 'Change royalties to 3%' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Contract execution destination address', example: '0x...' })
  @IsString()
  @IsNotEmpty()
  targetAddress: string;

  @ApiProperty({ description: 'Value to transfer in Wei', example: '0' })
  @IsString()
  @IsNotEmpty()
  valueTransferred: string;

  @ApiProperty({ description: 'Numeric chain ID', required: false, example: 84532 })
  @IsNumber()
  @IsOptional()
  chainId?: number;
}

class CastVoteDto {
  @ApiProperty({ description: 'Voter wallet address', example: '0x...' })
  @IsString()
  @IsNotEmpty()
  voter: string;

  @ApiProperty({ description: 'Support vote option', example: true })
  @IsBoolean()
  support: boolean;

  @ApiProperty({ description: 'Vote weight', example: 100 })
  @IsNumber()
  weight: number;
}

@ApiTags('DAO Builder')
@Controller('api/v1/daos')
export class DaoController {
  constructor(private readonly daoService: DaoService) {}

  @Get()
  @ApiOperation({ summary: 'List all registered creator DAOs' })
  @ApiResponse({ status: 200, description: 'Success' })
  findAll() {
    return this.daoService.findAll();
  }

  @Get('my-activity')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get authenticated user DAO proposals and votes' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  getMyActivity(@Req() req: any) {
    return this.daoService.getUserActivity(req.user.walletAddress);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific DAO governance profile' })
  @ApiResponse({ status: 200, description: 'Success' })
  findOne(@Param('id') id: string) {
    return this.daoService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new DAO governance organization' })
  @ApiResponse({ status: 201, description: 'Success' })
  create(@Body() dto: CreateDaoDto) {
    return this.daoService.create(dto);
  }

  @Get(':id/proposals')
  @ApiOperation({ summary: 'List active and completed proposals for a DAO' })
  @ApiResponse({ status: 200, description: 'Success' })
  findProposals(@Param('id') id: string) {
    return this.daoService.findProposals(id);
  }

  @Post(':id/proposals')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new governance vote proposal' })
  @ApiResponse({ status: 201, description: 'Success' })
  createProposal(@Param('id') id: string, @Body() dto: CreateProposalDto) {
    return this.daoService.createProposal(id, dto);
  }

  @Post('proposals/:propId/vote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cast support/against votes on a proposal' })
  @ApiResponse({ status: 200, description: 'Success' })
  castVote(@Param('propId') propId: string, @Body() dto: CastVoteDto) {
    return this.daoService.castVote(propId, dto.voter, dto.support, dto.weight);
  }
}
