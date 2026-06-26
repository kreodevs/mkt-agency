import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import { AssetTagService } from './asset-tag.service';
import { CreateAssetTagDto } from './dto/asset.request.dto';
import { AssetTagResponseDto, AssetTagsListResponseDto } from './dto/asset.response.dto';

@Controller('asset-tags')
@UseGuards(TenantGuard)
export class AssetTagController {
  constructor(private readonly tagService: AssetTagService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser): Promise<AssetTagsListResponseDto> {
    return this.tagService.list(user.tenantId!);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateAssetTagDto,
  ): Promise<AssetTagResponseDto> {
    return this.tagService.create(user.tenantId!, body);
  }
}
