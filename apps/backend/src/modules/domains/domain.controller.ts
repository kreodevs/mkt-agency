import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import { CreateDomainDto } from './dto/domain.request.dto';
import {
  DomainListResponseDto,
  DomainResponseDto,
} from './dto/domain.response.dto';
import { DomainService } from './domain.service';

@Controller('domains')
@UseGuards(TenantGuard)
export class DomainController {
  constructor(private readonly domainService: DomainService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser): Promise<DomainListResponseDto> {
    return this.domainService.list(user.tenantId!);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDomainDto,
  ): Promise<DomainResponseDto> {
    return this.domainService.create(user.tenantId!, dto);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DomainResponseDto> {
    return this.domainService.findOne(user.tenantId!, id);
  }

  @Post(':id/verify-dns')
  verifyDns(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DomainResponseDto> {
    return this.domainService.verifyDns(user.tenantId!, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.domainService.remove(user.tenantId!, id);
  }
}
