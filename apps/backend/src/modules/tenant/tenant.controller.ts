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

@Controller('tenants')
@UseGuards(SuperadminGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: CreateTenantRequestDto): Promise<TenantResponseDto> {
    return this.tenantService.create(body);
  }

  @Get()
  list(@Query() query: ListTenantsQueryDto): Promise<PaginatedTenantsResponseDto> {
    return this.tenantService.list(query);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TenantResponseDto> {
    return this.tenantService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateTenantRequestDto,
  ): Promise<TenantResponseDto> {
    return this.tenantService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.tenantService.delete(id);
  }
}
