import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import { AssetService } from '../assets/asset.service';
import {
  IMAGE_GENERATION_ADAPTER,
  ImageGenerationAdapterPort,
} from './adapters/image-generation.adapter.port';
import { AgentImageGenerationEntity } from './domain/agent-image-generation.entity';

@Controller('agents/image-generation')
@UseGuards(TenantGuard)
export class ImageGenerationController {
  private readonly logger = new Logger(ImageGenerationController.name);

  constructor(
    @InjectRepository(AgentImageGenerationEntity)
    private readonly generations: Repository<AgentImageGenerationEntity>,
    @Inject(IMAGE_GENERATION_ADAPTER)
    private readonly adapter: ImageGenerationAdapterPort,
    private readonly assetService: AssetService,
  ) {}

  @Get()
  listGenerations(@CurrentUser() user: AuthenticatedUser) {
    return this.generations.find({
      where: { tenantId: user.tenantId! },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async generate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { prompt: string; style?: string; size?: string },
  ) {
    if (!body.prompt?.trim()) {
      throw new BadRequestException({ error: 'Prompt is required', code: 'VALIDATION_ERROR' });
    }

    const tenantId = user.tenantId!;

    // Create generation record
    const record = await this.generations.save(
      this.generations.create({
        tenantId,
        prompt: body.prompt.trim(),
        status: 'processing',
      }),
    );

    try {
      // Generate image via adapter
      this.logger.log(`Generating image for prompt: ${body.prompt.slice(0, 80)}`);
      const result = await this.adapter.generateImage(body.prompt.trim(), {
        size: body.size,
        style: body.style,
      });

      if (!result.imageUrl) {
        throw new Error('Adapter returned no image URL');
      }

      // Download the generated image
      const imageResponse = await fetch(result.imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download generated image: ${imageResponse.status}`);
      }
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const contentType =
        imageResponse.headers.get('content-type') || 'image/png';
      const extension = contentType.split('/').pop() || 'png';
      const fileName = `${body.prompt.trim().slice(0, 40).replace(/[^a-zA-Z0-9]/g, '_')}.${extension}`;

      // Create a fake Multer file from the downloaded buffer
      const fakeFile: Express.Multer.File = {
        buffer: imageBuffer,
        originalname: fileName,
        mimetype: contentType,
        size: imageBuffer.length,
        fieldname: 'file',
        encoding: '7bit',
        stream: null as unknown as import('stream').Readable,
        destination: '',
        filename: fileName,
        path: '',
      };

      // Upload as asset
      this.logger.log(`Saving generated image as asset: ${fileName}`);
      const asset = await this.assetService.upload(tenantId, fakeFile);

      // Update record with success
      record.imageUrl = asset.url ?? result.imageUrl;
      record.assetId = asset.id;
      record.status = 'completed';
      await this.generations.save(record);

      return record;
    } catch (error) {
      this.logger.error(`Image generation failed: ${error instanceof Error ? error.message : error}`);
      record.status = 'failed';
      record.errorMessage = error instanceof Error ? error.message : 'Generation failed';
      await this.generations.save(record);
      return record;
    }
  }

  @Get(':id')
  getGeneration(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.generations.findOne({ where: { id, tenantId: user.tenantId! } });
  }
}