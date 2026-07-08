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
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import { AssetService } from './asset.service';
import { ListAssetsQueryDto, UpdateAssetDto } from './dto/asset.request.dto';
import {
  AssetDownloadUrlResponseDto,
  AssetResponseDto,
  PaginatedAssetsResponseDto,
} from './dto/asset.response.dto';

@Controller('assets')
@UseGuards(TenantGuard)
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListAssetsQueryDto,
  ): Promise<PaginatedAssetsResponseDto> {
    return this.assetService.list(user.tenantId!, query);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  upload(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
    @Body('folderId') folderId?: string,
    @Body('tagIds') tagIds?: string,
  ): Promise<AssetResponseDto> {
    return this.assetService.upload(user.tenantId!, file, folderId, tagIds);
  }

  @Get(':id/download-url')
  downloadUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AssetDownloadUrlResponseDto> {
    return this.assetService.getDownloadUrl(user.tenantId!, id);
  }

  @Get(':id/file')
  async serveFile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StreamableFile> {
    const file = await this.assetService.readFile(user.tenantId!, id);
    return new StreamableFile(file.buffer, {
      type: file.mimeType,
      disposition: `inline; filename="${file.fileName.replace(/"/g, '')}"`,
    });
  }

  @Get(':id/thumbnail')
  async serveThumbnail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StreamableFile> {
    const file = await this.assetService.readThumbnail(user.tenantId!, id);
    return new StreamableFile(file.buffer, {
      type: file.mimeType,
      disposition: `inline; filename="${file.fileName.replace(/"/g, '')}"`,
    });
  }

  @Post(':id/duplicate')
  @HttpCode(HttpStatus.CREATED)
  duplicate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AssetResponseDto> {
    return this.assetService.duplicate(user.tenantId!, id);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AssetResponseDto> {
    return this.assetService.findOne(user.tenantId!, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateAssetDto,
  ): Promise<AssetResponseDto> {
    return this.assetService.update(user.tenantId!, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.assetService.remove(user.tenantId!, id);
  }
}
