import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LlmTaskConfigEntity } from '../../modules/platform/infrastructure/typeorm/llm-task-config.entity';
import {
  LLM_TASK_TYPES,
  type LlmTaskType,
  type ResolvedLlmConfig,
} from './llm-task-types';

@Injectable()
export class LlmConfigService {
  constructor(
    @InjectRepository(LlmTaskConfigEntity)
    private readonly configs: Repository<LlmTaskConfigEntity>,
    private readonly configService: ConfigService,
  ) {}

  async listAll(): Promise<ResolvedLlmConfig[]> {
    const rows = await this.configs.find({ order: { taskType: 'ASC' } });
    return rows.map((row) => this.toResolved(row));
  }

  async resolve(taskType: LlmTaskType): Promise<ResolvedLlmConfig> {
    const row = await this.configs.findOne({ where: { taskType } });
    if (row) {
      return this.toResolved(row);
    }

    return {
      taskType,
      provider: 'openrouter',
      model: this.configService.get<string>(
        'AI_MODEL',
        'deepseek/deepseek-v4-flash',
      ),
      temperature: 0.7,
      enabled: true,
    };
  }

  async update(
    taskType: LlmTaskType,
    data: Partial<{
      label: string;
      description: string | null;
      provider: string;
      model: string;
      temperature: number;
      maxTokens: number | null;
      systemPromptTemplate: string | null;
      enabled: boolean;
    }>,
  ): Promise<ResolvedLlmConfig> {
    if (!LLM_TASK_TYPES.includes(taskType)) {
      throw new Error(`Unknown task type: ${taskType}`);
    }

    let row = await this.configs.findOne({ where: { taskType } });
    if (!row) {
      row = this.configs.create({
        taskType,
        label: taskType,
        provider: 'openrouter',
        model: this.configService.get<string>(
          'AI_MODEL',
          'deepseek/deepseek-v4-flash',
        ),
      });
    }

    if (data.label !== undefined) row.label = data.label;
    if (data.description !== undefined) row.description = data.description;
    if (data.provider !== undefined) row.provider = data.provider;
    if (data.model !== undefined) row.model = data.model;
    if (data.temperature !== undefined) {
      row.temperature = String(data.temperature);
    }
    if (data.maxTokens !== undefined) row.maxTokens = data.maxTokens;
    if (data.systemPromptTemplate !== undefined) {
      row.systemPromptTemplate = data.systemPromptTemplate;
    }
    if (data.enabled !== undefined) row.enabled = data.enabled;

    const saved = await this.configs.save(row);
    return this.toResolved(saved);
  }

  private toResolved(row: LlmTaskConfigEntity): ResolvedLlmConfig {
    return {
      taskType: row.taskType as LlmTaskType,
      provider: row.provider,
      model: row.model,
      temperature: Number(row.temperature),
      maxTokens: row.maxTokens ?? undefined,
      systemPromptTemplate: row.systemPromptTemplate,
      enabled: row.enabled,
    };
  }
}
