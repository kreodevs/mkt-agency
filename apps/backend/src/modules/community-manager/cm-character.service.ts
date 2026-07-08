import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IMAGE_GENERATION_ADAPTER, ImageGenerationAdapterPort } from '../agents/adapters/image-generation.adapter.port';
import { TalkingHeadComposerService } from '../agents/talking-head-composer.service';
import { AssetService } from '../assets/asset.service';
import { CompanyProfileEntity } from '../company-profile/infrastructure/typeorm/company-profile.entity';
import { ProductEntity } from '../product/infrastructure/typeorm/product.entity';
import { ProductService } from '../product/product.service';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import {
  CM_CHARACTERS_LIBRARY_KEY,
  CM_CHARACTER_METADATA_KEY,
  CM_PORTRAIT_SIZE,
  CM_PREVIEW_SCRIPT,
  DEFAULT_CM_VOICE_ID,
  DEFAULT_CM_VOICE_NAME,
  type CmCharacterEntry,
  type CmCharacterLlmOption,
  type CmCharactersLibrary,
} from './domain/cm-character.constants';
import {
  buildCmPortraitPrompt,
  createCmCharacterEntry,
  entryToLegacyConfig,
  getCharacterById,
  getDefaultCharacter,
  isCmCharacterEntryReady,
  listReadyCharacters,
  mergeCmCharacterEntry,
  parseCmCharactersLibrary,
  summarizeCharacterForLlm,
} from './domain/cm-character.util';
import type {
  CmCharacterGenerateResponseDto,
  CmCharacterStatusResponseDto,
  CmCharactersLibraryResponseDto,
  UpdateCmCharacterAppearanceDto,
} from './dto/cm-character.dto';

@Injectable()
export class CmCharacterService {
  private readonly logger = new Logger(CmCharacterService.name);

  constructor(
    @InjectRepository(ProductEntity)
    private readonly products: Repository<ProductEntity>,
    @InjectRepository(CompanyProfileEntity)
    private readonly profiles: Repository<CompanyProfileEntity>,
    private readonly productService: ProductService,
    private readonly assetService: AssetService,
    private readonly talkingHeadComposer: TalkingHeadComposerService,
    @Inject(IMAGE_GENERATION_ADAPTER)
    private readonly imageAdapter: ImageGenerationAdapterPort,
  ) {}

  async listLibrary(tenantId: string, productId: string): Promise<CmCharactersLibraryResponseDto> {
    const product = await this.productService.findOwnedEntity(tenantId, productId);
    const library = await this.loadLibrary(product);

    return {
      productId: product.id,
      defaultCharacterId: library.defaultCharacterId,
      readyCount: listReadyCharacters(library).length,
      characters: library.characters.map((entry) =>
        this.toStatusResponse(product.id, entry, library.defaultCharacterId),
      ),
    };
  }

  async createCharacter(
    tenantId: string,
    productId: string,
    name: string,
  ): Promise<CmCharacterStatusResponseDto> {
    const product = await this.productService.findOwnedEntity(tenantId, productId);
    const library = await this.loadLibrary(product);
    const entry = createCmCharacterEntry(name);
    library.characters.push(entry);
    if (!library.defaultCharacterId) {
      library.defaultCharacterId = entry.id;
    }
    await this.saveLibrary(product, library);
    return this.toStatusResponse(product.id, entry, library.defaultCharacterId);
  }

  async deleteCharacter(
    tenantId: string,
    productId: string,
    characterId: string,
  ): Promise<CmCharactersLibraryResponseDto> {
    const product = await this.productService.findOwnedEntity(tenantId, productId);
    const library = await this.loadLibrary(product);
    const index = library.characters.findIndex((c) => c.id === characterId);
    if (index < 0) {
      throw new NotFoundException({ error: 'CM no encontrada', code: 'NOT_FOUND' });
    }

    library.characters.splice(index, 1);
    if (library.defaultCharacterId === characterId) {
      library.defaultCharacterId =
        listReadyCharacters(library)[0]?.id ?? library.characters[0]?.id ?? null;
    }

    await this.saveLibrary(product, library);
    return this.listLibrary(tenantId, productId);
  }

  async setDefaultCharacter(
    tenantId: string,
    productId: string,
    characterId: string,
  ): Promise<CmCharacterStatusResponseDto> {
    const product = await this.productService.findOwnedEntity(tenantId, productId);
    const library = await this.loadLibrary(product);
    const entry = getCharacterById(library, characterId);
    if (!entry) {
      throw new NotFoundException({ error: 'CM no encontrada', code: 'NOT_FOUND' });
    }
    library.defaultCharacterId = characterId;
    await this.saveLibrary(product, library);
    return this.toStatusResponse(product.id, entry, library.defaultCharacterId);
  }

  async getStatus(
    tenantId: string,
    productId: string,
    characterId?: string,
  ): Promise<CmCharacterStatusResponseDto> {
    const product = await this.productService.findOwnedEntity(tenantId, productId);
    const library = await this.loadLibrary(product);
    const entry = characterId
      ? getCharacterById(library, characterId)
      : getDefaultCharacter(library);
    if (!entry) {
      throw new NotFoundException({
        error: 'No hay CM virtual configurada. Crea una en la biblioteca.',
        code: 'CM_CHARACTER_NOT_FOUND',
      });
    }
    return this.toStatusResponse(product.id, entry, library.defaultCharacterId);
  }

  async updateAppearance(
    tenantId: string,
    productId: string,
    dto: UpdateCmCharacterAppearanceDto,
    characterId?: string,
  ): Promise<CmCharacterStatusResponseDto> {
    const product = await this.productService.findOwnedEntity(tenantId, productId);
    const library = await this.loadLibrary(product);
    const entry = characterId
      ? getCharacterById(library, characterId)
      : getDefaultCharacter(library);
    if (!entry) {
      throw new NotFoundException({ error: 'CM no encontrada', code: 'NOT_FOUND' });
    }

    const next = mergeCmCharacterEntry(entry, {
      name: dto.name?.trim() || entry.name,
      appearance: {
        ...entry.appearance,
        gender: dto.gender ?? entry.appearance?.gender,
        ageRange: dto.ageRange ?? entry.appearance?.ageRange,
        style: dto.style ?? entry.appearance?.style,
        background: dto.background ?? entry.appearance?.background,
        notes: dto.notes ?? entry.appearance?.notes,
      },
      voiceId: dto.voiceId?.trim() || entry.voiceId || DEFAULT_CM_VOICE_ID,
      voiceName: dto.voiceName?.trim() || entry.voiceName || DEFAULT_CM_VOICE_NAME,
      status: entry.status === 'ready' ? 'ready' : 'pending',
      errorMessage: null,
    });

    this.replaceEntry(library, next);
    await this.saveLibrary(product, library);
    return this.toStatusResponse(product.id, next, library.defaultCharacterId);
  }

  async selectPortrait(
    tenantId: string,
    productId: string,
    characterId: string,
    assetId: string,
  ): Promise<CmCharacterGenerateResponseDto> {
    const product = await this.productService.findOwnedEntity(tenantId, productId);
    const library = await this.loadLibrary(product);
    const entry = getCharacterById(library, characterId);
    if (!entry) {
      throw new NotFoundException({ error: 'CM no encontrada', code: 'NOT_FOUND' });
    }

    const asset = await this.assetService.findOne(tenantId, assetId);
    if (asset.type !== 'image') {
      throw new BadRequestException({
        error: 'El retrato debe ser una imagen de la biblioteca',
        code: 'INVALID_ASSET_TYPE',
      });
    }

    const next = mergeCmCharacterEntry(entry, {
      portraitAssetId: asset.id,
      status: entry.status === 'ready' ? 'ready' : 'pending',
      errorMessage: null,
    });
    this.replaceEntry(library, next);
    await this.saveLibrary(product, library);

    return {
      characterId: next.id,
      portraitAssetId: asset.id,
      status: next.status ?? 'pending',
      message: entry.status === 'ready'
        ? 'Retrato actualizado desde la biblioteca.'
        : 'Retrato asignado. Genera la vista previa para activar esta CM.',
    };
  }

  async generatePortrait(
    tenantId: string,
    userId: string,
    productId: string,
    characterId?: string,
  ): Promise<CmCharacterGenerateResponseDto> {
    void userId;
    const product = await this.productService.findOwnedEntity(tenantId, productId);
    const library = await this.loadLibrary(product);
    let entry = characterId
      ? getCharacterById(library, characterId)
      : getDefaultCharacter(library);
    if (!entry) {
      entry = createCmCharacterEntry('CM principal');
      library.characters.push(entry);
      library.defaultCharacterId = entry.id;
    }

    const current = entry;
    this.replaceEntry(
      library,
      mergeCmCharacterEntry(current, { status: 'generating_portrait', errorMessage: null }),
    );
    await this.saveLibrary(product, library);

    try {
      const profile = await this.profiles.findOne({ where: { tenantId } });
      const prompt = buildCmPortraitPrompt(current.appearance, {
        industry: profile?.industry ?? null,
        brandVoice: profile?.brandVoice ?? null,
      });

      const generated = await this.imageAdapter.generateImage(prompt, {
        size: CM_PORTRAIT_SIZE,
        style: 'corporate professional portrait photography',
        taskType: 'cm_portrait_generation',
      });

      let buffer: Buffer;
      let mimeType = generated.mimeType ?? 'image/png';

      if (generated.imageBuffer) {
        buffer = generated.imageBuffer;
      } else if (generated.imageUrl) {
        const response = await fetch(generated.imageUrl);
        if (!response.ok) {
          throw new Error(`No se pudo descargar el retrato (${response.status})`);
        }
        buffer = Buffer.from(await response.arrayBuffer());
        mimeType = response.headers.get('content-type') ?? mimeType;
      } else {
        throw new Error('La generación de retrato no devolvió imagen');
      }

      const extension = mimeType.split('/').pop() || 'png';
      const fakeFile: Express.Multer.File = {
        buffer,
        originalname: `cm-retrato-${current.id.slice(0, 8)}.${extension}`,
        mimetype: mimeType,
        size: buffer.length,
        fieldname: 'file',
        encoding: '7bit',
        stream: null as unknown as import('stream').Readable,
        destination: '',
        filename: `cm-retrato.${extension}`,
        path: '',
      };

      const asset = await this.assetService.upload(tenantId, fakeFile, undefined, undefined, {
        source: 'cm-character',
        kind: 'portrait',
        productId: product.id,
        cmCharacterId: current.id,
        cmCharacterName: current.name,
      });

      const updated = mergeCmCharacterEntry(current, {
        portraitAssetId: asset.id,
        status: 'pending',
        errorMessage: null,
      });
      this.replaceEntry(library, updated);
      await this.saveLibrary(product, library);

      return {
        characterId: current.id,
        portraitAssetId: asset.id,
        status: 'pending',
        message: 'Retrato generado. Genera la vista previa para activar esta CM.',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al generar retrato';
      this.logger.error(`CM portrait failed for product ${productId}`, error);
      this.replaceEntry(
        library,
        mergeCmCharacterEntry(current, { status: 'failed', errorMessage: message }),
      );
      await this.saveLibrary(product, library);
      throw new BadRequestException({ error: message, code: 'CM_PORTRAIT_FAILED' });
    }
  }

  async generatePreview(
    tenantId: string,
    user: AuthenticatedUser,
    productId: string,
    characterId?: string,
  ): Promise<CmCharacterGenerateResponseDto> {
    const product = await this.productService.findOwnedEntity(tenantId, productId);
    const library = await this.loadLibrary(product);
    const entry = characterId
      ? getCharacterById(library, characterId)
      : getDefaultCharacter(library);
    if (!entry?.portraitAssetId) {
      throw new BadRequestException({
        error: 'Asigna o genera primero el retrato de la CM',
        code: 'CM_PORTRAIT_MISSING',
      });
    }

    this.replaceEntry(
      library,
      mergeCmCharacterEntry(entry, { status: 'generating_preview', errorMessage: null }),
    );
    await this.saveLibrary(product, library);

    try {
      const composed = await this.talkingHeadComposer.compose({
        tenantId,
        productId: product.id,
        portraitAssetId: entry.portraitAssetId,
        script: CM_PREVIEW_SCRIPT,
        voiceId: entry.voiceId ?? DEFAULT_CM_VOICE_ID,
        accessUser: {
          id: user.id,
          tenantId: user.tenantId!,
          email: user.email,
          role: user.role,
        },
        metadata: { phase: 'preview', cmCharacterId: entry.id, cmCharacterName: entry.name },
      });

      const updated = mergeCmCharacterEntry(entry, {
        previewVideoAssetId: composed.videoAssetId,
        status: 'ready',
        readyAt: new Date().toISOString(),
        errorMessage: null,
      });
      this.replaceEntry(library, updated);
      await this.saveLibrary(product, library);

      return {
        characterId: entry.id,
        previewVideoAssetId: composed.videoAssetId,
        portraitAssetId: entry.portraitAssetId,
        status: 'ready',
        message: `${entry.name} lista. El copiloto elegirá entre tus CMs según el post.`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al generar vista previa';
      this.logger.error(`CM preview failed for product ${productId}`, error);
      this.replaceEntry(
        library,
        mergeCmCharacterEntry(entry, { status: 'failed', errorMessage: message }),
      );
      await this.saveLibrary(product, library);
      throw new BadRequestException({ error: message, code: 'CM_PREVIEW_FAILED' });
    }
  }

  async hasAnyReadyCharacter(tenantId: string, productId: string): Promise<boolean> {
    const product = await this.productService.findOwnedEntity(tenantId, productId);
    const library = await this.loadLibrary(product);
    return listReadyCharacters(library).length > 0;
  }

  async listReadyForLlm(tenantId: string, productId: string): Promise<CmCharacterLlmOption[]> {
    const product = await this.productService.findOwnedEntity(tenantId, productId);
    const library = await this.loadLibrary(product);
    return listReadyCharacters(library).map(summarizeCharacterForLlm);
  }

  async assertReadyForTalkingHead(
    tenantId: string,
    productId: string,
    characterId?: string,
  ): Promise<CmCharacterEntry> {
    const product = await this.productService.findOwnedEntity(tenantId, productId);
    const library = await this.loadLibrary(product);
    const entry = characterId
      ? getCharacterById(library, characterId)
      : getDefaultCharacter(library);

    if (!entry || !isCmCharacterEntryReady(entry) || !entry.portraitAssetId) {
      throw new NotFoundException({
        error: 'No hay CM virtual lista para este post. Configura la biblioteca de CMs.',
        code: 'CM_CHARACTER_NOT_READY',
      });
    }

    if (characterId && !isCmCharacterEntryReady(entry)) {
      throw new NotFoundException({
        error: 'La CM seleccionada no está lista',
        code: 'CM_CHARACTER_NOT_READY',
      });
    }

    return entry;
  }

  private async loadLibrary(product: ProductEntity): Promise<CmCharactersLibrary> {
    const library = parseCmCharactersLibrary(product.metadata);
    const shouldPersist =
      !product.metadata?.[CM_CHARACTERS_LIBRARY_KEY] &&
      Boolean(product.metadata?.[CM_CHARACTER_METADATA_KEY]);
    if (shouldPersist) {
      await this.saveLibrary(product, library);
    }
    return library;
  }

  private replaceEntry(library: CmCharactersLibrary, entry: CmCharacterEntry): void {
    const index = library.characters.findIndex((c) => c.id === entry.id);
    if (index >= 0) {
      library.characters[index] = entry;
    } else {
      library.characters.push(entry);
    }
  }

  private async saveLibrary(product: ProductEntity, library: CmCharactersLibrary): Promise<void> {
    const defaultEntry = getDefaultCharacter(library);
    product.metadata = {
      ...(product.metadata ?? {}),
      [CM_CHARACTERS_LIBRARY_KEY]: library,
      [CM_CHARACTER_METADATA_KEY]: defaultEntry ? entryToLegacyConfig(defaultEntry) : null,
    };
    await this.products.save(product);
  }

  private toStatusResponse(
    productId: string,
    entry: CmCharacterEntry,
    defaultCharacterId: string | null,
  ): CmCharacterStatusResponseDto {
    return {
      characterId: entry.id,
      name: entry.name,
      productId,
      ready: isCmCharacterEntryReady(entry),
      status: entry.status ?? 'pending',
      portraitAssetId: entry.portraitAssetId ?? null,
      previewVideoAssetId: entry.previewVideoAssetId ?? null,
      appearance: entry.appearance ?? null,
      voiceId: entry.voiceId ?? DEFAULT_CM_VOICE_ID,
      voiceName: entry.voiceName ?? DEFAULT_CM_VOICE_NAME,
      errorMessage: entry.errorMessage ?? null,
      isDefault: entry.id === defaultCharacterId,
    };
  }
}
