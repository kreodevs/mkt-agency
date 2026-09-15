import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Post,
  UseGuards,
  forwardRef,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import { CommunityManagerService } from '../community-manager/community-manager.service';
import { ImageGenerationService, type GenerateImageResult } from './image-generation.service';

@Controller('agents/image-generation')
@UseGuards(TenantGuard)
export class ImageGenerationController {
  constructor(
    private readonly imageGeneration: ImageGenerationService,
    @Inject(forwardRef(() => CommunityManagerService))
    private readonly communityManager: CommunityManagerService,
  ) {}

  @Get()
  listGenerations(@CurrentUser() user: AuthenticatedUser) {
    return this.imageGeneration.list(user.tenantId!);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  generate(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      prompt: string;
      style?: string;
      size?: string;
      productId?: string;
      contentId?: string;
    },
  ) {
    return this.imageGeneration.generate(user.tenantId!, user.id, body.prompt, {
      style: body.style,
      size: body.size,
      productId: body.productId,
      contentId: body.contentId,
      background: true,
    });
  }

  @Get('by-content/:contentId')
  async getGenerationByContent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contentId') contentId: string,
  ) {
    const record = await this.imageGeneration.findByContentId(user.tenantId!, contentId);
    return { generation: record };
  }

  @Post('for-content/:contentId')
  @HttpCode(HttpStatus.CREATED)
  async generateForContent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contentId') contentId: string,
  ) {
    if (await this.imageGeneration.requiresKitVisualPipeline(user.tenantId!, contentId)) {
      return this.composeVisualForContent(user.tenantId!, user.id, contentId);
    }
    return this.imageGeneration.generateForContent(user.tenantId!, user.id, contentId);
  }

  @Post('for-content/:contentId/regenerate')
  async regenerateForContent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contentId') contentId: string,
  ) {
    if (await this.imageGeneration.requiresKitVisualPipeline(user.tenantId!, contentId)) {
      return this.composeVisualForContent(user.tenantId!, user.id, contentId);
    }
    return this.imageGeneration.regenerateForContent(user.tenantId!, user.id, contentId);
  }

  private async composeVisualForContent(
    tenantId: string,
    userId: string,
    contentId: string,
  ): Promise<GenerateImageResult> {
    const result = await this.communityManager.recomposeVisualForContent(
      tenantId,
      userId,
      contentId,
    );
    if (!result.attached) {
      throw new BadRequestException({
        error:
          'No se pudo regenerar el visual. Revisa el media kit del producto y el estilo visual del contenido.',
        code: 'VISUAL_REGENERATE_FAILED',
      });
    }

    const record = await this.imageGeneration.findByContentId(tenantId, contentId);
    if (!record) {
      throw new BadRequestException({
        error: 'El visual se generó pero no hay registro de generación asociado al contenido.',
        code: 'VISUAL_REGENERATE_FAILED',
      });
    }

    return this.imageGeneration.mapToGenerateImageResult(record);
  }

  @Get(':id')
  async getGeneration(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const record = await this.imageGeneration.findOne(user.tenantId!, id);
    if (!record) {
      throw new NotFoundException({ error: 'Generation not found', code: 'NOT_FOUND' });
    }
    return record;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteGeneration(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.imageGeneration.delete(user.tenantId!, id);
  }

  @Post(':id/retry')
  async retryGeneration(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.imageGeneration.retry(user.tenantId!, user.id, id, { background: true });
  }

  @Post(':id/regenerate')
  regenerateGeneration(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.imageGeneration.regenerate(user.tenantId!, user.id, id);
  }
}
