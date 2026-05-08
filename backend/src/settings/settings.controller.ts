import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Controller('tenants/:tenantId/products/:productId/settings')
@UseGuards(AuthGuard('jwt'))
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings(@Param('productId') productId: string) {
    return this.settingsService.getOrCreate(productId);
  }

  @Patch()
  async updateSettings(
    @Param('productId') productId: string,
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.settingsService.update(productId, dto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('tenantId') tenantId: string,
    @Param('productId') productId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.settingsService.uploadFile(tenantId, productId, file);
  }

  @Get('uploads')
  async getUploads(
    @Param('tenantId') tenantId: string,
    @Param('productId') productId: string,
  ) {
    return this.settingsService.getUploads(tenantId, productId);
  }
}
