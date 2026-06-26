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
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import { AssetFolderService } from './asset-folder.service';
import {
  CreateAssetFolderDto,
  UpdateAssetFolderDto,
} from './dto/asset.request.dto';
import {
  AssetFolderResponseDto,
  AssetFoldersListResponseDto,
} from './dto/asset.response.dto';

@Controller('asset-folders')
@UseGuards(TenantGuard)
export class AssetFolderController {
  constructor(private readonly folderService: AssetFolderService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser): Promise<AssetFoldersListResponseDto> {
    return this.folderService.list(user.tenantId!);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateAssetFolderDto,
  ): Promise<AssetFolderResponseDto> {
    return this.folderService.create(user.tenantId!, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateAssetFolderDto,
  ): Promise<AssetFolderResponseDto> {
    return this.folderService.update(user.tenantId!, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.folderService.remove(user.tenantId!, id);
  }
}
