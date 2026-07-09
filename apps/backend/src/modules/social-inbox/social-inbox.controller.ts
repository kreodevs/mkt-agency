import {
  Body,
  Controller,
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
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import {
  IngestSocialInteractionDto,
  ListSocialInteractionsQueryDto,
} from './dto/social-inbox.request.dto';
import type {
  PaginatedSocialInteractionsDto,
  SocialInteractionResponseDto,
} from './dto/social-inbox.response.dto';
import { SocialInboxService } from './services/social-inbox.service';

@Controller('social-inbox')
@UseGuards(TenantGuard)
export class SocialInboxController {
  constructor(private readonly inbox: SocialInboxService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListSocialInteractionsQueryDto,
  ): Promise<PaginatedSocialInteractionsDto> {
    return this.inbox.list(user.tenantId!, query);
  }

  @Post('ingest')
  @HttpCode(HttpStatus.CREATED)
  ingest(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: IngestSocialInteractionDto,
  ): Promise<SocialInteractionResponseDto> {
    return this.inbox.ingest(user.tenantId!, body);
  }

  @Patch(':id/replied')
  markReplied(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SocialInteractionResponseDto> {
    return this.inbox.markReplied(user.tenantId!, id);
  }
}
