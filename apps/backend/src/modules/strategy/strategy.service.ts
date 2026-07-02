import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LlmProviderService } from '../../shared/ai/llm-provider.service';
import { runWithLlmUsageContext } from '../../shared/ai/llm-usage.context';
import { DashboardMetricsService } from '../dashboard/dashboard-metrics.service';
import {
  STRATEGY_ADAPTER,
  StrategyAdjustmentAdapterPort,
} from './adapters/strategy.adapter.port';
import type { StrategySuggestion } from './adapters/strategy.adapter.port';
import { StrategyAdjustmentEntity } from './infrastructure/typeorm/strategy-adjustment.entity';
import { CampaignEntity } from '../campaign/infrastructure/typeorm/campaign.entity';
import {
  StrategyAdjustmentResponse,
  StrategySuggestionResponse,
  TriggerAnalysisResponse,
} from './dto/strategy.response.dto';

export interface TriggerAnalysisOptions {
  brandBriefId?: string;
  productId?: string;
  autoApplyContentSuggestions?: boolean;
}

const CM_TOPIC_ACTIONS = new Set(['adjust_content', 'amplify', 'change_strategy']);

@Injectable()
export class StrategyService {
  private readonly logger = new Logger(StrategyService.name);

  constructor(
    @InjectRepository(StrategyAdjustmentEntity)
    private readonly adjustments: Repository<StrategyAdjustmentEntity>,
    private readonly llmProviders: LlmProviderService,
    @Inject(STRATEGY_ADAPTER)
    private readonly adapter: StrategyAdjustmentAdapterPort,
    @InjectRepository(CampaignEntity)
    private readonly campaigns: Repository<CampaignEntity>,
    private readonly metricsService: DashboardMetricsService,
  ) {}

  async list(tenantId: string): Promise<StrategyAdjustmentResponse[]> {
    const items = await this.adjustments.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
    return items.map((item) => this.toResponse(item));
  }

  async findOne(tenantId: string, id: string): Promise<StrategyAdjustmentResponse> {
    const item = await this.findOwned(tenantId, id);
    return this.toResponse(item);
  }

  async triggerAnalysis(
    tenantId: string,
    options: TriggerAnalysisOptions = {},
  ): Promise<TriggerAnalysisResponse> {
    const record = await this.adjustments.save(
      this.adjustments.create({
        tenantId,
        status: 'analyzing',
        source: 'auto',
        brandBriefId: options.brandBriefId ?? null,
        data: { productId: options.productId ?? null },
        suggestions: [],
      }),
    );

    try {
      const metrics = await this.metricsService.collectTenantMetrics(
        tenantId,
        options.productId,
      );

      const campaignList = await this.campaigns.find({
        where: { tenantId },
        ...(options.productId ? { productId: options.productId } : {}),
      });

      const campaigns = campaignList.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        platforms: c.platforms ?? [],
        objective: c.objective ?? null,
      }));

      const analysis = await runWithLlmUsageContext({ tenantId }, () =>
        this.adapter.analyze({
          tenantId,
          source: 'auto',
          brandBrief: null,
          metrics: {
            leads: metrics.leads,
            content: metrics.content,
            campaigns: metrics.campaigns,
            trends: metrics.trends,
          },
          campaigns,
        }),
      );

      record.data = {
        productId: options.productId ?? null,
        summary: analysis.summary,
        overallHealth: analysis.overallHealth,
        topPerforming: analysis.topPerforming,
        underperforming: analysis.underperforming,
        generatedAt: analysis.generatedAt,
        metricsSnapshot: metrics,
      };
      record.suggestions = analysis.suggestions as unknown as Array<Record<string, unknown>>;
      record.status = 'ready';
      await this.adjustments.save(record);

      if (options.autoApplyContentSuggestions) {
        await this.autoApplyContentSuggestions(tenantId, record.id);
      }

      const saved = await this.adjustments.findOne({ where: { id: record.id } });
      return { id: record.id, status: saved?.status ?? 'ready' };
    } catch (error) {
      this.logger.error(`Strategy analysis failed: ${error instanceof Error ? error.message : error}`);
      record.status = 'failed';
      record.errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      await this.adjustments.save(record);
      return { id: record.id, status: 'failed' };
    }
  }

  async extractTopicsForContentGeneration(
    tenantId: string,
    adjustmentId: string,
  ): Promise<string[]> {
    const record = await this.findOwned(tenantId, adjustmentId);
    const suggestions = record.suggestions as unknown as StrategySuggestion[];

    return suggestions
      .filter(
        (s) =>
          CM_TOPIC_ACTIONS.has(s.actionType) &&
          (s.status === 'approved' || s.status === 'applied' || s.status === 'pending'),
      )
      .map((s) => s.recommendation.trim())
      .filter(Boolean)
      .slice(0, 5);
  }

  async autoApplyContentSuggestions(tenantId: string, adjustmentId: string): Promise<string[]> {
    const record = await this.findOwned(tenantId, adjustmentId);
    if (record.status !== 'ready') {
      return [];
    }

    const suggestions = record.suggestions as unknown as StrategySuggestion[];
    let changed = false;

    for (const suggestion of suggestions) {
      if (suggestion.status !== 'pending') continue;
      if (!CM_TOPIC_ACTIONS.has(suggestion.actionType)) continue;
      suggestion.status = 'approved';
      changed = true;
    }

    if (!changed) {
      return this.extractTopicsForContentGeneration(tenantId, adjustmentId);
    }

    for (const suggestion of suggestions) {
      if (suggestion.status === 'approved') {
        suggestion.status = 'applied';
      }
    }

    record.suggestions = suggestions as unknown as Array<Record<string, unknown>>;
    record.status = 'applied';
    await this.adjustments.save(record);

    return suggestions
      .filter((s) => CM_TOPIC_ACTIONS.has(s.actionType))
      .map((s) => s.recommendation.trim())
      .filter(Boolean)
      .slice(0, 5);
  }

  async updateSuggestion(
    tenantId: string,
    id: string,
    suggestionId: string,
    status: 'approved' | 'rejected',
  ): Promise<StrategyAdjustmentResponse> {
    const record = await this.findOwned(tenantId, id);
    const suggestions = record.suggestions as unknown as StrategySuggestion[];
    const suggestion = suggestions.find((s) => s.id === suggestionId);
    if (!suggestion) {
      throw new NotFoundException({ error: 'Suggestion not found', code: 'NOT_FOUND' });
    }
    suggestion.status = status;
    record.suggestions = suggestions as unknown as Array<Record<string, unknown>>;
    await this.adjustments.save(record);
    return this.toResponse(record);
  }

  async applyApproved(
    tenantId: string,
    id: string,
  ): Promise<StrategyAdjustmentResponse> {
    const record = await this.findOwned(tenantId, id);
    if (record.status !== 'ready') {
      throw new BadRequestException({ error: 'Analysis must be in ready status', code: 'INVALID_STATUS' });
    }

    const suggestions = record.suggestions as unknown as StrategySuggestion[];
    const approved = suggestions.filter((s) => s.status === 'approved');
    if (approved.length === 0) {
      throw new BadRequestException({ error: 'No approved suggestions to apply', code: 'NO_APPROVED' });
    }

    for (const s of suggestions) {
      if (s.status === 'approved') {
        s.status = 'applied';
      }
    }
    record.suggestions = suggestions as unknown as Array<Record<string, unknown>>;
    record.status = 'applied';
    await this.adjustments.save(record);

    return this.toResponse(record);
  }

  private async findOwned(tenantId: string, id: string): Promise<StrategyAdjustmentEntity> {
    const item = await this.adjustments.findOne({ where: { id, tenantId } });
    if (!item) {
      throw new NotFoundException({ error: 'Strategy adjustment not found', code: 'NOT_FOUND' });
    }
    return item;
  }

  private toResponse(entity: StrategyAdjustmentEntity): StrategyAdjustmentResponse {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      status: entity.status,
      source: entity.source,
      brandBriefId: entity.brandBriefId,
      data: entity.data,
      suggestions: (entity.suggestions as unknown as StrategySuggestion[]).map(
        (s): StrategySuggestionResponse => ({
          id: s.id,
          channel: s.channel,
          currentPerformance: s.currentPerformance,
          insight: s.insight,
          recommendation: s.recommendation,
          actionType: s.actionType,
          expectedImpact: s.expectedImpact,
          status: s.status,
        }),
      ),
      errorMessage: entity.errorMessage,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
