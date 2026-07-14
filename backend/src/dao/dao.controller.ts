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
} from '@nestjs/common';
import {
  DaoService,
  RegisterProposalDto,
  ConfirmProposalDto,
  RegisterVoteDto,
  ConfirmVoteDto,
  RegisterDelegationDto,
} from './dao.service';

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
    // If chainId provided, treat as on-chain lookup; otherwise treat as DB ID
    if (chainId && /^\d+$/.test(proposalId)) {
      return this.daoService.getProposalByOnChainId(proposalId, parseInt(chainId, 10));
    }
    return this.daoService.getProposalByDbId(proposalId);
  }

  @Post('proposals/register')
  @HttpCode(HttpStatus.CREATED)
  registerProposal(@Body() dto: RegisterProposalDto) {
    if (!dto.walletAddress || !dto.creationTransactionHash || !dto.onChainProposalId) {
      throw new BadRequestException('walletAddress, creationTransactionHash, and onChainProposalId are required');
    }
    return this.daoService.registerProposal(dto);
  }

  @Patch('proposals/confirm')
  @HttpCode(HttpStatus.OK)
  confirmProposal(@Body() dto: ConfirmProposalDto) {
    if (!dto.creationTransactionHash) {
      throw new BadRequestException('creationTransactionHash is required');
    }
    return this.daoService.confirmProposal(dto);
  }

  @Patch('proposals/state')
  @HttpCode(HttpStatus.OK)
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

  // ─── Votes ────────────────────────────────────────────────────────────────

  @Post('votes/register')
  @HttpCode(HttpStatus.CREATED)
  registerVote(@Body() dto: RegisterVoteDto) {
    if (!dto.walletAddress || !dto.transactionHash || !dto.onChainProposalId) {
      throw new BadRequestException('walletAddress, transactionHash, and onChainProposalId are required');
    }
    if (dto.support === undefined || dto.support === null) {
      throw new BadRequestException('support (boolean) is required');
    }
    return this.daoService.registerVote(dto);
  }

  @Patch('votes/confirm')
  @HttpCode(HttpStatus.OK)
  confirmVote(@Body() dto: ConfirmVoteDto) {
    if (!dto.transactionHash) {
      throw new BadRequestException('transactionHash is required');
    }
    return this.daoService.confirmVote(dto);
  }

  // ─── Delegations ──────────────────────────────────────────────────────────

  @Post('delegations/register')
  @HttpCode(HttpStatus.CREATED)
  registerDelegation(@Body() dto: RegisterDelegationDto) {
    if (!dto.walletAddress || !dto.delegateAddress || !dto.transactionHash) {
      throw new BadRequestException('walletAddress, delegateAddress, and transactionHash are required');
    }
    return this.daoService.registerDelegation(dto);
  }

  // ─── User History ─────────────────────────────────────────────────────────

  @Get('wallet/:address/history')
  getWalletHistory(@Param('address') address: string) {
    if (!address || !address.startsWith('0x')) {
      throw new BadRequestException('Invalid wallet address');
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
