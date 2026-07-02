import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  LlmUsageEventEntity,
  type LlmUsageModality,
} from '../../modules/platform/infrastructure/typeorm/llm-usage-event.entity';
import { LlmModelsCatalogService } from './llm-models-catalog.service';
import { estimateTokenCostUsd, roundCostUsd } from './llm-usage-cost.util';
import { getLlmUsageContext } from './llm-usage.context';
import type { LlmTaskType } from './llm-task-types';

export interface RecordLlmUsageInput {
  tenantId?: string | null;
  userId?: string | null;
  taskType: LlmTaskType | string;
  providerId?: string | null;
  model: string;
  modality?: LlmUsageModality;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
  status?: 'success' | 'error';
  metadata?: Record<string, unknown>;
}

export interface LlmUsageSummary {
  totalCalls: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

export interface LlmUsageTenantRow extends LlmUsageSummary {
  tenantId: string | null;
  tenantName: string | null;
}

export interface LlmUsageDailyRow {
  day: string;
  totalCalls: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

export interface LlmUsageDashboardResponse {
  summary: LlmUsageSummary;
  byTenant: LlmUsageTenantRow[];
  daily: LlmUsageDailyRow[];
}

@Injectable()
export class LlmUsageService {
  private readonly logger = new Logger(LlmUsageService.name);
  private readonly pricingCache = new Map<
    string,
    { inputCostPer1M: number | null; outputCostPer1M: number | null; expiresAt: number }
  >();

  constructor(
    @InjectRepository(LlmUsageEventEntity)
    private readonly events: Repository<LlmUsageEventEntity>,
    private readonly modelsCatalog: LlmModelsCatalogService,
  ) {}

  record(input: RecordLlmUsageInput): void {
    void this.persist(input).catch((error) => {
      this.logger.warn(
        `Failed to persist LLM usage event: ${error instanceof Error ? error.message : error}`,
      );
    });
  }

  async getDashboard(from?: Date, to?: Date): Promise<LlmUsageDashboardResponse> {
    const [summary, byTenant, daily] = await Promise.all([
      this.aggregateSummary(from, to),
      this.aggregateByTenant(from, to),
      this.aggregateDaily(from, to),
    ]);

    return { summary, byTenant, daily };
  }

  private async persist(input: RecordLlmUsageInput): Promise<void> {
    const context = getLlmUsageContext();
    const promptTokens = input.promptTokens ?? 0;
    const completionTokens = input.completionTokens ?? 0;
    const totalTokens = input.totalTokens ?? promptTokens + completionTokens;

    let estimatedCostUsd = input.estimatedCostUsd;
    if (estimatedCostUsd === undefined && input.providerId && totalTokens > 0) {
      const pricing = await this.resolveModelPricing(input.providerId, input.model);
      estimatedCostUsd = roundCostUsd(
        estimateTokenCostUsd(
          promptTokens,
          completionTokens,
          pricing.inputCostPer1M,
          pricing.outputCostPer1M,
        ),
      );
    }

    await this.events.save(
      this.events.create({
        tenantId: input.tenantId ?? context.tenantId ?? null,
        userId: input.userId ?? context.userId ?? null,
        taskType: input.taskType,
        providerId: input.providerId ?? null,
        model: input.model,
        modality: input.modality ?? 'chat',
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCostUsd: String(estimatedCostUsd ?? 0),
        status: input.status ?? 'success',
        metadata: input.metadata ?? {},
      }),
    );
  }

  private async resolveModelPricing(
    providerId: string,
    model: string,
  ): Promise<{ inputCostPer1M: number | null; outputCostPer1M: number | null }> {
    const cacheKey = `${providerId}:${model}`;
    const cached = this.pricingCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached;
    }

    try {
      const catalog = await this.modelsCatalog.listForProvider(providerId);
      const match = catalog.models.find((item) => item.id === model);
      const pricing = {
        inputCostPer1M: match?.inputCostPer1M ?? null,
        outputCostPer1M: match?.outputCostPer1M ?? null,
        expiresAt: Date.now() + 10 * 60 * 1000,
      };
      this.pricingCache.set(cacheKey, pricing);
      return pricing;
    } catch {
      return { inputCostPer1M: null, outputCostPer1M: null };
    }
  }

  private applyDateRange(
    qb: ReturnType<Repository<LlmUsageEventEntity>['createQueryBuilder']>,
    from?: Date,
    to?: Date,
    alias = 'e',
  ) {
    if (from) {
      qb.andWhere(`${alias}.created_at >= :from`, { from });
    }
    if (to) {
      qb.andWhere(`${alias}.created_at <= :to`, { to });
    }
    return qb;
  }

  private async aggregateSummary(from?: Date, to?: Date): Promise<LlmUsageSummary> {
    const qb = this.applyDateRange(this.events.createQueryBuilder('e'), from, to);
    const raw = await qb
      .select('COUNT(*)', 'totalCalls')
      .addSelect('COALESCE(SUM(e.prompt_tokens), 0)', 'promptTokens')
      .addSelect('COALESCE(SUM(e.completion_tokens), 0)', 'completionTokens')
      .addSelect('COALESCE(SUM(e.total_tokens), 0)', 'totalTokens')
      .addSelect('COALESCE(SUM(e.estimated_cost_usd), 0)', 'estimatedCostUsd')
      .getRawOne<Record<string, string>>();

    return this.mapSummary(raw);
  }

  private async aggregateByTenant(from?: Date, to?: Date): Promise<LlmUsageTenantRow[]> {
    const qb = this.applyDateRange(this.events.createQueryBuilder('e'), from, to);
    const rows = await qb
      .leftJoin('tenants', 't', 't.id = e.tenant_id')
      .select('e.tenant_id', 'tenantId')
      .addSelect('t.name', 'tenantName')
      .addSelect('COUNT(*)', 'totalCalls')
      .addSelect('COALESCE(SUM(e.prompt_tokens), 0)', 'promptTokens')
      .addSelect('COALESCE(SUM(e.completion_tokens), 0)', 'completionTokens')
      .addSelect('COALESCE(SUM(e.total_tokens), 0)', 'totalTokens')
      .addSelect('COALESCE(SUM(e.estimated_cost_usd), 0)', 'estimatedCostUsd')
      .groupBy('e.tenant_id')
      .addGroupBy('t.name')
      .orderBy('estimatedCostUsd', 'DESC')
      .getRawMany<Record<string, string | null>>();

    return rows.map((row) => ({
      tenantId: row.tenantId ?? null,
      tenantName: row.tenantName ?? null,
      ...this.mapSummary(row),
    }));
  }

  private async aggregateDaily(from?: Date, to?: Date): Promise<LlmUsageDailyRow[]> {
    const qb = this.applyDateRange(this.events.createQueryBuilder('e'), from, to);
    const rows = await qb
      .select("DATE_TRUNC('day', e.created_at)", 'day')
      .addSelect('COUNT(*)', 'totalCalls')
      .addSelect('COALESCE(SUM(e.total_tokens), 0)', 'totalTokens')
      .addSelect('COALESCE(SUM(e.estimated_cost_usd), 0)', 'estimatedCostUsd')
      .groupBy("DATE_TRUNC('day', e.created_at)")
      .orderBy('day', 'ASC')
      .getRawMany<Record<string, string>>();

    return rows.map((row) => ({
      day: new Date(row.day).toISOString().slice(0, 10),
      totalCalls: Number(row.totalCalls ?? 0),
      totalTokens: Number(row.totalTokens ?? 0),
      estimatedCostUsd: Number(row.estimatedCostUsd ?? 0),
    }));
  }

  private mapSummary(raw?: Record<string, string | null>): LlmUsageSummary {
    return {
      totalCalls: Number(raw?.totalCalls ?? 0),
      promptTokens: Number(raw?.promptTokens ?? 0),
      completionTokens: Number(raw?.completionTokens ?? 0),
      totalTokens: Number(raw?.totalTokens ?? 0),
      estimatedCostUsd: Number(raw?.estimatedCostUsd ?? 0),
    };
  }
}
