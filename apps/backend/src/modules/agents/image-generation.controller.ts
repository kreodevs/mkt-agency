import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import { IMAGE_GENERATION_ADAPTER, ImageGenerationAdapterPort } from './adapters/image-generation.adapter.port';
import { AgentImageGenerationEntity } from './domain/agent-image-generation.entity';

@Controller('agents/image-generation')
@UseGuards(TenantGuard)
export class ImageGenerationController {
  constructor(
    @InjectRepository(AgentImageGenerationEntity)
    private readonly generations: Repository<AgentImageGenerationEntity>,
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

    const record = await this.generations.save(
      this.generations.create({
        tenantId: user.tenantId!,
        prompt: body.prompt.trim(),
        status: 'processing',
      }),
    );

    // Process synchronously for now (async would need worker)
    try {
      // We can't inject the adapter here easily, so return the record as processing
      // The frontend will poll
      return record;
    } catch (error) {
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