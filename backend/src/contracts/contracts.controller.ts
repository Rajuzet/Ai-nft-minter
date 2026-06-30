import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { ContractsService, ContractConfigDto } from './contracts.service';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

class CompileRequestDto {
  @ApiProperty({ description: 'The smart contract standard type (ERC-20, ERC-721, ERC-1155, Soulbound, Vesting)', example: 'ERC-20' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Contract details' })
  config: ContractConfigDto;
}

@ApiTags('Contract Builder')
@Controller('api/v1/contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get('templates')
  @ApiOperation({ summary: 'List all audited smart contract templates' })
  @ApiResponse({ status: 200, description: 'Success' })
  getTemplates() {
    return this.contractsService.getTemplates();
  }

  @Post('compile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate and compile Solidity code for a configured template' })
  @ApiResponse({ status: 200, description: 'Success' })
  compile(@Body() body: CompileRequestDto) {
    return this.contractsService.compile(body.type, body.config);
  }
}
