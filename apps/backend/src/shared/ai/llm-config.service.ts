import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LlmTaskConfigEntity } from '../../modules/platform/infrastructure/typeorm/llm-task-config.entity';
import { LlmProviderService } from './llm-provider.service';
import {
  LLM_TASK_TYPES,
  type LlmTaskConfigResponse,
  type LlmTaskType,
  type ResolvedLlmExecutionConfig,
} from './llm-task-types';
import { LLM_TASK_METADATA } from './llm-task-metadata';
import { normalizeOpenRouterImageModel } from '../social/openrouter-image-model.util';

@Injectable()
export class LlmConfigService {
  private readonly logger = new Logger(LlmConfigService.name);

  constructor(
    @InjectRepository(LlmTaskConfigEntity)
    private readonly configs: Repository<LlmTaskConfigEntity>,
    private readonly providerService: LlmProviderService,
  ) {}

  async listAll(): Promise<LlmTaskConfigResponse[]> {
    const rows = await this.configs.find({
      relations: { providerEntity: true },
      order: { taskType: 'ASC' },
    });

    // Auto-create missing task configs for any task type not yet in DB
    const existingTypes = new Set(rows.map((r) => r.taskType));
    const missing = LLM_TASK_TYPES.filter((t) => !existingTypes.has(t));
    if (missing.length > 0) {
      const defaultProviderId = await this.resolveDefaultProviderId();
      const newRows = this.configs.create(
        missing.map((taskType) => {
          const meta = LLM_TASK_METADATA[taskType];
          return {
            taskType,
            label: meta.label,
            description: meta.description,
            providerId: defaultProviderId,
            model: meta.defaultModel,
            temperature: meta.temperature,
            enabled: true,
          };
        }),
      );
      await this.configs.save(newRows);
      this.logger.log(`Auto-created LLM task configs: ${missing.join(', ')}`);
      const saved = await this.configs.find({
        where: missing.map((taskType) => ({ taskType })),
        relations: { providerEntity: true },
      });
      rows.push(...saved);
    }

    await this.syncTaskMetadata(rows);

    return rows.map((row) => this.toResponse(row));
  }

  private async resolveDefaultProviderId(): Promise<string | null> {
    const providers = await this.providerService.list(true);
    const configured = providers.find((provider) => provider.apiKeyConfigured);
    return configured?.id ?? providers[0]?.id ?? null;
  }

  /** Corrige filas creadas antes con label = slug crudo (p. ej. video_generation). */
  private async syncTaskMetadata(rows: LlmTaskConfigEntity[]): Promise<void> {
    const updates: LlmTaskConfigEntity[] = [];

    for (const row of rows) {
      const taskType = row.taskType as LlmTaskType;
      const meta = LLM_TASK_METADATA[taskType];
      if (!meta) {
        continue;
      }

      const needsLabel = row.label === row.taskType || !row.description;
      const needsModel =
        taskType === 'video_generation' &&
        row.model === 'deepseek/deepseek-v4-flash';
      const normalizedImageModel = normalizeOpenRouterImageModel(row.model);
      const normalizedFallback = row.fallbackModel
        ? normalizeOpenRouterImageModel(row.fallbackModel)
        : null;
      const needsFluxSlug =
        (taskType === 'image_generation' || taskType === 'cm_portrait_generation') &&
        (normalizedImageModel !== row.model ||
          (row.fallbackModel && normalizedFallback !== row.fallbackModel));

      if (!needsLabel && !needsModel && !needsFluxSlug) {
        continue;
      }

      if (needsLabel) {
        row.label = meta.label;
        row.description = meta.description;
      }
      if (needsModel) {
        row.model = meta.defaultModel;
        row.temperature = meta.temperature;
      }
      if (needsFluxSlug) {
        row.model = normalizedImageModel;
        if (row.fallbackModel && normalizedFallback) {
          row.fallbackModel = normalizedFallback;
        }
      }
      updates.push(row);
    }

    if (updates.length) {
      await this.configs.save(updates);
    }
  }

  async resolve(taskType: LlmTaskType): Promise<ResolvedLlmExecutionConfig> {
    const row = await this.configs.findOne({
      where: { taskType },
      relations: { providerEntity: true },
    });

    if (!row) {
      throw new NotFoundException({
        error: `LLM task config not found: ${taskType}`,
        code: 'NOT_FOUND',
      });
    }

    return this.toExecutionConfig(row);
  }

  async update(
    taskType: LlmTaskType,
    data: Partial<{
      label: string;
      description: string | null;
      providerId: string;
      model: string;
      fallbackModel: string | null;
      temperature: number;
      maxTokens: number | null;
      systemPromptTemplate: string | null;
      enabled: boolean;
    }>,
  ): Promise<LlmTaskConfigResponse> {
    if (!LLM_TASK_TYPES.includes(taskType)) {
      throw new BadRequestException({
        error: 'Invalid LLM task type',
        code: 'VALIDATION_ERROR',
      });
    }

    let row = await this.configs.findOne({
      where: { taskType },
      relations: { providerEntity: true },
    });

    if (!row) {
      let providerId = data.providerId ?? null;
      if (providerId) {
        const provider = await this.providerService.findEntityById(providerId);
        if (!provider) {
          throw new BadRequestException({
            error: 'Invalid providerId',
            code: 'VALIDATION_ERROR',
          });
        }
      } else {
        const providers = await this.providerService.list(true);
        providerId = providers[0]?.id ?? null;
        if (!providerId) {
          throw new BadRequestException({
            error: 'Create an LLM provider before configuring tasks',
            code: 'VALIDATION_ERROR',
          });
        }
      }

      row = this.configs.create({
        taskType,
        label: LLM_TASK_METADATA[taskType]?.label ?? taskType,
        description: LLM_TASK_METADATA[taskType]?.description ?? null,
        providerId,
        model: data.model ?? LLM_TASK_METADATA[taskType]?.defaultModel ?? 'deepseek/deepseek-v4-flash',
      });
    }

    if (data.providerId !== undefined) {
      const provider = await this.providerService.findEntityById(data.providerId);
      if (!provider) {
        throw new BadRequestException({
          error: 'Invalid providerId',
          code: 'VALIDATION_ERROR',
        });
      }
      row.providerId = data.providerId;
    }

    if (data.label !== undefined) row.label = data.label;
    if (data.description !== undefined) row.description = data.description;
    if (data.model !== undefined) row.model = data.model;
    if (data.fallbackModel !== undefined) {
      row.fallbackModel = data.fallbackModel?.trim() || null;
    }
    if (data.temperature !== undefined) {
      row.temperature = String(data.temperature);
    }
    if (data.maxTokens !== undefined) row.maxTokens = data.maxTokens;
    if (data.systemPromptTemplate !== undefined) {
      row.systemPromptTemplate = data.systemPromptTemplate;
    }
    if (data.enabled !== undefined) row.enabled = data.enabled;

    const saved = await this.configs.save(row);
    const reloaded = await this.configs.findOne({
      where: { taskType: saved.taskType },
      relations: { providerEntity: true },
    });

    return this.toResponse(reloaded!);
  }

  private toResponse(row: LlmTaskConfigEntity): LlmTaskConfigResponse {
    return {
      taskType: row.taskType as LlmTaskType,
      label: row.label,
      description: row.description,
      providerId: row.providerId,
      providerName: row.providerEntity?.name ?? null,
      providerSlug: row.providerEntity?.slug ?? null,
      model: row.model,
      fallbackModel: row.fallbackModel,
      temperature: Number(row.temperature),
      maxTokens: row.maxTokens ?? undefined,
      systemPromptTemplate: row.systemPromptTemplate,
      enabled: row.enabled,
    };
  }

  private toExecutionConfig(row: LlmTaskConfigEntity): ResolvedLlmExecutionConfig {
    const provider = row.providerEntity;
    if (!provider) {
      throw new BadRequestException({
        error: `LLM task ${row.taskType} has no provider assigned`,
        code: 'LLM_PROVIDER_MISSING',
      });
    }
    if (!provider.isActive) {
      throw new BadRequestException({
        error: `LLM provider ${provider.slug} is inactive`,
        code: 'LLM_PROVIDER_INACTIVE',
      });
    }
    if (!provider.apiKey?.trim()) {
      throw new BadRequestException({
        error: `LLM provider ${provider.slug} has no API key configured`,
        code: 'LLM_API_KEY_MISSING',
      });
    }

    const rawModel = row.model?.trim() || provider.defaultModel?.trim();
    if (!rawModel) {
      throw new BadRequestException({
        error: `LLM task ${row.taskType} has no model configured`,
        code: 'LLM_MODEL_MISSING',
      });
    }

    const taskType = row.taskType as LlmTaskType;
    const model =
      taskType === 'image_generation' || taskType === 'cm_portrait_generation'
        ? normalizeOpenRouterImageModel(rawModel)
        : rawModel;

    return {
      ...this.toResponse(row),
      apiUrl: provider.apiUrl.replace(/\/$/, ''),
      apiKey: provider.apiKey.trim(),
      model,
    };
  }
}
