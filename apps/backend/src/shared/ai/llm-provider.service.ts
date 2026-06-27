import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LlmProviderEntity } from '../../modules/platform/infrastructure/typeorm/llm-provider.entity';
import type { LlmProviderResponse } from './llm-task-types';

export function maskApiKey(apiKey: string | null | undefined): {
  configured: boolean;
  hint: string | null;
} {
  if (!apiKey?.trim()) {
    return { configured: false, hint: null };
  }
  const trimmed = apiKey.trim();
  if (trimmed.length <= 8) {
    return { configured: true, hint: '••••••••' };
  }
  return { configured: true, hint: `••••${trimmed.slice(-4)}` };
}

@Injectable()
export class LlmProviderService {
  constructor(
    @InjectRepository(LlmProviderEntity)
    private readonly providers: Repository<LlmProviderEntity>,
  ) {}

  async list(includeInactive = false): Promise<LlmProviderResponse[]> {
    const rows = await this.providers.find({
      where: includeInactive ? {} : { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return rows.map((row) => this.toResponse(row));
  }

  async findById(id: string): Promise<LlmProviderResponse> {
    const row = await this.providers.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException({
        error: 'LLM provider not found',
        code: 'NOT_FOUND',
      });
    }
    return this.toResponse(row);
  }

  async findEntityById(id: string): Promise<LlmProviderEntity | null> {
    return this.providers.findOne({ where: { id } });
  }

  async hasActiveConfigured(): Promise<boolean> {
    const count = await this.providers
      .createQueryBuilder('p')
      .where('p.is_active = true')
      .andWhere('p.api_key IS NOT NULL')
      .andWhere("TRIM(p.api_key) <> ''")
      .getCount();
    return count > 0;
  }

  async create(body: {
    slug: string;
    name: string;
    apiUrl: string;
    apiKey?: string;
    defaultModel?: string | null;
    sortOrder?: number;
  }): Promise<LlmProviderResponse> {
    const existing = await this.providers.findOne({
      where: { slug: body.slug.trim().toLowerCase() },
    });
    if (existing) {
      throw new ConflictException({
        error: 'Provider slug already exists',
        code: 'CONFLICT',
      });
    }

    const saved = await this.providers.save(
      this.providers.create({
        slug: body.slug.trim().toLowerCase(),
        name: body.name.trim(),
        apiUrl: body.apiUrl.trim().replace(/\/$/, ''),
        apiKey: body.apiKey?.trim() || null,
        defaultModel: body.defaultModel?.trim() || null,
        sortOrder: body.sortOrder ?? 0,
        isActive: true,
      }),
    );

    return this.toResponse(saved);
  }

  async update(
    id: string,
    body: Partial<{
      name: string;
      apiUrl: string;
      apiKey: string | null;
      defaultModel: string | null;
      isActive: boolean;
      sortOrder: number;
    }>,
  ): Promise<LlmProviderResponse> {
    const row = await this.providers.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException({
        error: 'LLM provider not found',
        code: 'NOT_FOUND',
      });
    }

    if (body.name !== undefined) row.name = body.name.trim();
    if (body.apiUrl !== undefined) {
      row.apiUrl = body.apiUrl.trim().replace(/\/$/, '');
    }
    if (body.apiKey !== undefined) {
      row.apiKey = body.apiKey?.trim() || null;
    }
    if (body.defaultModel !== undefined) {
      row.defaultModel = body.defaultModel?.trim() || null;
    }
    if (body.isActive !== undefined) row.isActive = body.isActive;
    if (body.sortOrder !== undefined) row.sortOrder = body.sortOrder;

    const saved = await this.providers.save(row);
    return this.toResponse(saved);
  }

  async remove(id: string): Promise<void> {
    const row = await this.providers.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException({
        error: 'LLM provider not found',
        code: 'NOT_FOUND',
      });
    }
    await this.providers.delete({ id });
  }

  toResponse(row: LlmProviderEntity): LlmProviderResponse {
    const masked = maskApiKey(row.apiKey);
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      apiUrl: row.apiUrl,
      defaultModel: row.defaultModel,
      apiKeyConfigured: masked.configured,
      apiKeyHint: masked.hint,
      isActive: row.isActive,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
