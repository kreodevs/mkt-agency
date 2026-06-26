import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import {
  CreateProposalDto,
  ListProposalsQueryDto,
  RejectProposalDto,
} from './dto/proposal.request.dto';
import {
  CreateProposalResponseDto,
  PaginatedProposalsResponseDto,
  ProposalResponseDto,
} from './dto/proposal.response.dto';
import { ProposalService } from './proposal.service';

@Controller('proposals')
@UseGuards(TenantGuard)
export class ProposalController {
  constructor(private readonly proposalService: ProposalService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProposalDto,
  ): Promise<CreateProposalResponseDto> {
    return this.proposalService.create(user.tenantId!, dto);
  }

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListProposalsQueryDto,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedProposalsResponseDto> {
    return this.proposalService.list(
      user.tenantId!,
      query,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProposalResponseDto> {
    return this.proposalService.findOne(user.tenantId!, id);
  }

  @Post(':id/sign')
  sign(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProposalResponseDto> {
    return this.proposalService.sign(user.tenantId!, user, id);
  }

  @Post(':id/reject')
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectProposalDto,
  ): Promise<ProposalResponseDto> {
    return this.proposalService.reject(user.tenantId!, id, dto);
  }
}
