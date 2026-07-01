import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import { ImageGenerationService } from './image-generation.service';

@Controller('agents/image-generation')
@UseGuards(TenantGuard)
export class ImageGenerationController {
  constructor(private readonly imageGeneration: ImageGenerationService) {}

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
    });
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
    return this.imageGeneration.retry(user.tenantId!, user.id, id);
  }
}
