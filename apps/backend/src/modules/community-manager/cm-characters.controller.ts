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
import { CmCharacterService } from './cm-character.service';
import {
  CmCharacterGenerateResponseDto,
  CmCharacterStatusResponseDto,
  CmCharactersLibraryResponseDto,
  CreateCmCharacterDto,
  SelectCmPortraitDto,
  SetDefaultCmCharacterDto,
  UpdateCmCharacterAppearanceDto,
} from './dto/cm-character.dto';

@Controller('products/:productId/cm-characters')
@UseGuards(TenantGuard)
export class CmCharactersController {
  constructor(private readonly cmCharacter: CmCharacterService) {}

  @Get()
  listLibrary(
    @CurrentUser() user: AuthenticatedUser,
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<CmCharactersLibraryResponseDto> {
    return this.cmCharacter.listLibrary(user.tenantId!, productId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createCharacter(
    @CurrentUser() user: AuthenticatedUser,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: CreateCmCharacterDto,
  ): Promise<CmCharacterStatusResponseDto> {
    return this.cmCharacter.createCharacter(user.tenantId!, productId, dto.name);
  }

  @Patch('default')
  setDefaultCharacter(
    @CurrentUser() user: AuthenticatedUser,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: SetDefaultCmCharacterDto,
  ): Promise<CmCharacterStatusResponseDto> {
    return this.cmCharacter.setDefaultCharacter(user.tenantId!, productId, dto.characterId);
  }

  @Get(':characterId')
  getCharacter(
    @CurrentUser() user: AuthenticatedUser,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('characterId', ParseUUIDPipe) characterId: string,
  ): Promise<CmCharacterStatusResponseDto> {
    return this.cmCharacter.getStatus(user.tenantId!, productId, characterId);
  }

  @Patch(':characterId')
  updateAppearance(
    @CurrentUser() user: AuthenticatedUser,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('characterId', ParseUUIDPipe) characterId: string,
    @Body() dto: UpdateCmCharacterAppearanceDto,
  ): Promise<CmCharacterStatusResponseDto> {
    return this.cmCharacter.updateAppearance(user.tenantId!, productId, dto, characterId);
  }

  @Delete(':characterId')
  @HttpCode(HttpStatus.OK)
  deleteCharacter(
    @CurrentUser() user: AuthenticatedUser,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('characterId', ParseUUIDPipe) characterId: string,
  ): Promise<CmCharactersLibraryResponseDto> {
    return this.cmCharacter.deleteCharacter(user.tenantId!, productId, characterId);
  }

  @Post(':characterId/generate-portrait')
  @HttpCode(HttpStatus.OK)
  generatePortrait(
    @CurrentUser() user: AuthenticatedUser,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('characterId', ParseUUIDPipe) characterId: string,
  ): Promise<CmCharacterGenerateResponseDto> {
    return this.cmCharacter.generatePortrait(user.tenantId!, user.id, productId, characterId);
  }

  @Post(':characterId/generate-preview')
  @HttpCode(HttpStatus.OK)
  generatePreview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('characterId', ParseUUIDPipe) characterId: string,
  ): Promise<CmCharacterGenerateResponseDto> {
    return this.cmCharacter.generatePreview(user.tenantId!, user.id, productId, characterId);
  }

  @Post(':characterId/select-portrait')
  @HttpCode(HttpStatus.OK)
  selectPortrait(
    @CurrentUser() user: AuthenticatedUser,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('characterId', ParseUUIDPipe) characterId: string,
    @Body() dto: SelectCmPortraitDto,
  ): Promise<CmCharacterGenerateResponseDto> {
    return this.cmCharacter.selectPortrait(
      user.tenantId!,
      productId,
      characterId,
      dto.assetId,
    );
  }
}
