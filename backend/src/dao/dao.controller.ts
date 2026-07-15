import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import {
  DaoService,
  RegisterProposalDto,
  ConfirmProposalDto,
  RegisterVoteDto,
  ConfirmVoteDto,
  RegisterDelegationDto,
} from './dao.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Governance DAO')
@Controller('api/v1/governance')
export class DaoController {
  constructor(private readonly daoService: DaoService) {}

  // ─── Governance Config ────────────────────────────────────────────────────

  @Get('config/:chainId')
  getGovernanceConfig(@Param('chainId', ParseIntPipe) chainId: number) {
    return this.daoService.getGovernanceConfig(chainId);
  }

  // ─── Proposals ────────────────────────────────────────────────────────────

  @Get('proposals')
  getProposals(
    @Query('chainId') chainId?: string,
    @Query('status') status?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    if (limit > 100) limit = 100;
    return this.daoService.getProposals(
      chainId ? parseInt(chainId, 10) : undefined,
      status,
      page,
      limit,
    );
  }

  @Get('proposals/:proposalId')
  getProposal(@Param('proposalId') proposalId: string, @Query('chainId') chainId?: string) {
    if (chainId && /^\d+$/.test(proposalId)) {
      return this.daoService.getProposalByOnChainId(proposalId, parseInt(chainId, 10));
    }
    return this.daoService.getProposalByDbId(proposalId);
  }

  @Post('proposals/register')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new DAO proposal' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  registerProposal(@Body() dto: RegisterProposalDto, @Req() req: any) {
    if (!dto.walletAddress || !dto.creationTransactionHash || !dto.onChainProposalId) {
      throw new BadRequestException('walletAddress, creationTransactionHash, and onChainProposalId are required');
    }
    if (dto.walletAddress.toLowerCase() !== req.user.walletAddress.toLowerCase()) {
      throw new ForbiddenException('Wallet address mismatch with authenticated session.');
    }
    return this.daoService.registerProposal(dto);
  }

  @Patch('proposals/confirm')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm DAO proposal' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  confirmProposal(@Body() dto: ConfirmProposalDto) {
    if (!dto.creationTransactionHash) {
      throw new BadRequestException('creationTransactionHash is required');
    }
    return this.daoService.confirmProposal(dto);
  }

  @Patch('proposals/state')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update DAO proposal state' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  updateProposalState(
    @Body() body: {
      onChainProposalId: string;
      chainId: number;
      status: string;
      forVotes?: string;
      againstVotes?: string;
      executionTransactionHash?: string;
      cancellationTransactionHash?: string;
    },
  ) {
    if (!body.onChainProposalId || !body.chainId || !body.status) {
      throw new BadRequestException('onChainProposalId, chainId, and status are required');
    }
    return this.daoService.updateProposalState(
      body.onChainProposalId,
      body.chainId,
      body.status,
      {
        forVotes: body.forVotes,
        againstVotes: body.againstVotes,
        executionTransactionHash: body.executionTransactionHash,
        cancellationTransactionHash: body.cancellationTransactionHash,
      },
    );
  }

  @Post('proposals/sync-state')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync DAO proposal state from chain' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  async syncProposalState(
    @Body() body: { onChainProposalId: string; chainId: number },
  ) {
    if (!body.onChainProposalId || !body.chainId) {
      throw new BadRequestException('onChainProposalId and chainId are required');
    }
    const state = await this.daoService.syncProposalStateFromChain(
      body.onChainProposalId,
      body.chainId,
    );
    return { onChainProposalId: body.onChainProposalId, chainId: body.chainId, currentState: state };
  }

  // ─── Votes ────────────────────────────────────────────────────────────────

  @Post('votes/register')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a vote casting' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  registerVote(@Body() dto: RegisterVoteDto, @Req() req: any) {
    if (!dto.walletAddress || !dto.transactionHash || !dto.onChainProposalId) {
      throw new BadRequestException('walletAddress, transactionHash, and onChainProposalId are required');
    }
    if (dto.support === undefined || dto.support === null) {
      throw new BadRequestException('support (boolean) is required');
    }
    if (dto.walletAddress.toLowerCase() !== req.user.walletAddress.toLowerCase()) {
      throw new ForbiddenException('Wallet address mismatch with authenticated session.');
    }
    return this.daoService.registerVote(dto);
  }

  @Patch('votes/confirm')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm a vote casting' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  confirmVote(@Body() dto: ConfirmVoteDto) {
    if (!dto.transactionHash) {
      throw new BadRequestException('transactionHash is required');
    }
    return this.daoService.confirmVote(dto);
  }

  // ─── Delegations ──────────────────────────────────────────────────────────

  @Post('delegations/register')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a delegation' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  registerDelegation(@Body() dto: RegisterDelegationDto, @Req() req: any) {
    if (!dto.walletAddress || !dto.delegateAddress || !dto.transactionHash) {
      throw new BadRequestException('walletAddress, delegateAddress, and transactionHash are required');
    }
    if (dto.walletAddress.toLowerCase() !== req.user.walletAddress.toLowerCase()) {
      throw new ForbiddenException('Wallet address mismatch with authenticated session.');
    }
    return this.daoService.registerDelegation(dto);
  }

  // ─── User History ─────────────────────────────────────────────────────────

  @Get('wallet/:address/history')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get wallet governance history' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <token>' })
  getWalletHistory(@Param('address') address: string, @Req() req: any) {
    if (!address || !address.startsWith('0x')) {
      throw new BadRequestException('Invalid wallet address');
    }
    if (address.toLowerCase() !== req.user.walletAddress.toLowerCase()) {
      throw new ForbiddenException('Access denied. Wallet mismatch.');
    }
    return this.daoService.getWalletGovernanceHistory(address);
  }

  // ─── Analytics ────────────────────────────────────────────────────────────

  @Get('analytics')
  getAnalytics(@Query('chainId') chainId?: string) {
    return this.daoService.getGovernanceAnalytics(
      chainId ? parseInt(chainId, 10) : undefined,
    );
  }
}
