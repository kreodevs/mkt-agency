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
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import { ContentService } from './content.service';
import {
  CreateContentDto,
  FeedbackDto,
  ListContentsQueryDto,
  UpdateContentDto,
} from './dto/content.request.dto';
import {
  ApproveContentResponseDto,
  ContentResponseDto,
  ContentVersionResponseDto,
  PaginatedContentsResponseDto,
  RejectContentResponseDto,
} from './dto/content.response.dto';

@Controller('contents')
@UseGuards(TenantGuard)
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListContentsQueryDto,
  ): Promise<PaginatedContentsResponseDto> {
    return this.contentService.list(user.tenantId!, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateContentDto,
  ): Promise<ContentResponseDto> {
    return this.contentService.create(user.tenantId!, user.id, body);
  }

  @Get(':id/versions')
  listVersions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ContentVersionResponseDto[]> {
    return this.contentService.listVersions(user.tenantId!, id);
  }

  @Get(':id/versions/:vid')
  getVersion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('vid', ParseUUIDPipe) vid: string,
  ): Promise<ContentVersionResponseDto> {
    return this.contentService.getVersion(user.tenantId!, id, vid);
  }

  @Post(':id/versions/:vid/approve')
  approve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('vid', ParseUUIDPipe) vid: string,
    @Body() body: FeedbackDto,
  ): Promise<ApproveContentResponseDto> {
    return this.contentService.approveVersion(user.tenantId!, user.id, id, vid, body);
  }

  @Post(':id/versions/:vid/reject')
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('vid', ParseUUIDPipe) vid: string,
    @Body() body: FeedbackDto,
  ): Promise<RejectContentResponseDto> {
    return this.contentService.rejectVersion(user.tenantId!, user.id, id, vid, body);
  }

  @Post(':id/versions/:vid/request-changes')
  requestChanges(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('vid', ParseUUIDPipe) vid: string,
    @Body() body: FeedbackDto,
  ): Promise<ContentVersionResponseDto> {
    return this.contentService.requestChanges(user.tenantId!, user.id, id, vid, body);
  }

  @Post(':id/revert/:vid')
  @HttpCode(HttpStatus.CREATED)
  revert(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('vid', ParseUUIDPipe) vid: string,
  ): Promise<ContentVersionResponseDto> {
    return this.contentService.revert(user.tenantId!, user.id, id, vid);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ContentResponseDto> {
    return this.contentService.findOne(user.tenantId!, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateContentDto,
  ): Promise<ContentResponseDto> {
    return this.contentService.update(user.tenantId!, user.id, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.contentService.remove(user.tenantId!, id);
  }
}
