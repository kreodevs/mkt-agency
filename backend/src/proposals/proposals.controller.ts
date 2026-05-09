import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProposalsService } from './proposals.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { ApproveProposalDto, RejectProposalDto } from './dto/update-proposal-status.dto';

@Controller('tenants/:tenantId/proposals')
@UseGuards(AuthGuard('jwt'))
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Get()
  findAll(
    @Param('tenantId') tenantId: string,
    @Query('status') status?: string,
    @Query('productId') productId?: string,
  ) {
    return this.proposalsService.findByTenant(tenantId, { status, productId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.proposalsService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateProposalDto) {
    return this.proposalsService.create(dto);
  }

  @Post(':id/approve')
  approve(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: ApproveProposalDto,
  ) {
    const userId = req.user?.id || 'system';
    return this.proposalsService.approve(id, userId, dto?.feedback);
  }

  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectProposalDto,
  ) {
    return this.proposalsService.reject(id, dto?.reason);
  }
}
