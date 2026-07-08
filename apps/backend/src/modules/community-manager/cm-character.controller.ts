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
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import { CmCharacterService } from './cm-character.service';
import {
  CmCharacterGenerateResponseDto,
  CmCharacterStatusResponseDto,
  UpdateCmCharacterAppearanceDto,
} from './dto/cm-character.dto';

@Controller('products/:productId/cm-character')
@UseGuards(TenantGuard)
export class CmCharacterController {
  constructor(private readonly cmCharacter: CmCharacterService) {}

  @Get()
  getStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<CmCharacterStatusResponseDto> {
    return this.cmCharacter.getStatus(user.tenantId!, productId);
  }

  @Patch()
  updateAppearance(
    @CurrentUser() user: AuthenticatedUser,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: UpdateCmCharacterAppearanceDto,
  ): Promise<CmCharacterStatusResponseDto> {
    return this.cmCharacter.updateAppearance(user.tenantId!, productId, dto);
  }

  @Post('generate-portrait')
  @HttpCode(HttpStatus.OK)
  generatePortrait(
    @CurrentUser() user: AuthenticatedUser,
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<CmCharacterGenerateResponseDto> {
    return this.cmCharacter.generatePortrait(user.tenantId!, user.id, productId);
  }

  @Post('generate-preview')
  @HttpCode(HttpStatus.OK)
  generatePreview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<CmCharacterGenerateResponseDto> {
    return this.cmCharacter.generatePreview(user.tenantId!, user, productId);
  }
}
