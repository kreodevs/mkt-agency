import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { maskApiKey } from '../../../shared/ai/llm-provider.service';
import { PlatformIntegrationEntity } from '../infrastructure/typeorm/platform-integration.entity';

export interface PlatformIntegrationResponse {
  slug: string;
  name: string;
  apiKeyConfigured: boolean;
  apiKeyHint: string | null;
  isActive: boolean;
  settings: Record<string, unknown>;
  updatedAt: string;
}

@Injectable()
export class PlatformIntegrationService implements OnModuleInit {
  constructor(
    @InjectRepository(PlatformIntegrationEntity)
    private readonly integrations: Repository<PlatformIntegrationEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureDefaults();
  }

  private async ensureDefaults(): Promise<void> {
    const defaults = [{ slug: 'tavily', name: 'Tavily Search' }];
    for (const item of defaults) {
      const existing = await this.integrations.findOne({ where: { slug: item.slug } });
      if (!existing) {
        await this.integrations.save(this.integrations.create(item));
      }
    }
  }

  async getBySlug(slug: string): Promise<PlatformIntegrationResponse> {
    const row = await this.findEntityBySlug(slug);
    return this.toResponse(row);
  }

  async getActiveApiKey(slug: string): Promise<string | null> {
    const row = await this.integrations.findOne({ where: { slug } });
    if (!row?.isActive || !row.apiKey?.trim()) {
      return null;
    }
    return row.apiKey.trim();
  }

  async isActiveAndConfigured(slug: string): Promise<boolean> {
    const apiKey = await this.getActiveApiKey(slug);
    return !!apiKey;
  }

  async update(
    slug: string,
    body: Partial<{ apiKey: string | null; isActive: boolean; settings: Record<string, unknown> }>,
  ): Promise<PlatformIntegrationResponse> {
    const row = await this.findEntityBySlug(slug);

    if (body.apiKey !== undefined) {
      row.apiKey = body.apiKey?.trim() || null;
    }
    if (body.isActive !== undefined) {
      row.isActive = body.isActive;
    }
    if (body.settings !== undefined) {
      row.settings = body.settings;
    }

    const saved = await this.integrations.save(row);
    return this.toResponse(saved);
  }

  private async findEntityBySlug(slug: string): Promise<PlatformIntegrationEntity> {
    const row = await this.integrations.findOne({ where: { slug } });
    if (!row) {
      throw new NotFoundException({
        error: `Integration ${slug} not found`,
        code: 'NOT_FOUND',
      });
    }
    return row;
  }

  toResponse(row: PlatformIntegrationEntity): PlatformIntegrationResponse {
    const masked = maskApiKey(row.apiKey);
    return {
      slug: row.slug,
      name: row.name,
      apiKeyConfigured: masked.configured,
      apiKeyHint: masked.hint,
      isActive: row.isActive,
      settings: row.settings ?? {},
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
