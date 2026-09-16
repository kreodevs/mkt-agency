import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SuperadminGuard } from '../../shared/guards/superadmin.guard';
import { SuperadminPlatformAccessGuard } from '../../shared/guards/superadmin-platform-access.guard';
import { AuditLog } from '../audit/decorators/audit-log.decorator';
import { CreateTenantRequestDto } from './dto/create-tenant.request.dto';
import {
  ListTenantsQueryDto,
  UpdateTenantRequestDto,
} from './dto/tenant.request.dto';
import {
  PaginatedTenantsResponseDto,
  TenantResponseDto,
} from './dto/tenant.response.dto';
import { TenantService } from './tenant.service';
import { TenantHealthService } from './services/tenant-health.service';

@Controller('tenants')
export class TenantController {
  constructor(
    private readonly tenantService: TenantService,
    private readonly tenantHealth: TenantHealthService,
  ) {}

  @Get('health/overview')
  @UseGuards(SuperadminGuard)
  getHealthOverview() {
    return this.tenantHealth.getOverview();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(SuperadminGuard)
  @AuditLog({ action: 'tenant.created', resourceType: 'tenant' })
  create(@Body() body: CreateTenantRequestDto): Promise<TenantResponseDto> {
    return this.tenantService.create(body);
  }

  @Get()
  @UseGuards(SuperadminPlatformAccessGuard)
  list(@Query() query: ListTenantsQueryDto): Promise<PaginatedTenantsResponseDto> {
    return this.tenantService.list(query);
  }

  @Get(':id')
  @UseGuards(SuperadminGuard)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TenantResponseDto> {
    return this.tenantService.findById(id);
  }

  @Patch(':id')
  @UseGuards(SuperadminGuard)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateTenantRequestDto,
  ): Promise<TenantResponseDto> {
    return this.tenantService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(SuperadminGuard)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.tenantService.delete(id);
  }
}
