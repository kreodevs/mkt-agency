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
import { AuditLog } from '../audit/decorators/audit-log.decorator';
import {
  CreatePackageRequestDto,
  UpdatePackageRequestDto,
} from './dto/package.request.dto';
import {
  PackageListResponseDto,
  PackageResponseDto,
} from './dto/package.response.dto';
import { PackageService } from './package.service';

@Controller('packages')
@UseGuards(SuperadminGuard)
export class PackageController {
  constructor(private readonly packageService: PackageService) {}

  @Get()
  list(
    @Query('includeInactive') includeInactive?: string,
  ): Promise<PackageListResponseDto> {
    return this.packageService.list(includeInactive === 'true');
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PackageResponseDto> {
    return this.packageService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @AuditLog({ action: 'package.created', resourceType: 'package' })
  create(@Body() body: CreatePackageRequestDto): Promise<PackageResponseDto> {
    return this.packageService.create(body);
  }

  @Patch(':id')
  @AuditLog({ action: 'package.updated', resourceType: 'package' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdatePackageRequestDto,
  ): Promise<PackageResponseDto> {
    return this.packageService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AuditLog({ action: 'package.deleted', resourceType: 'package' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.packageService.remove(id);
  }
}
