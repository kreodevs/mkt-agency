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
import {
  STRATEGY_ADAPTER,
  StrategyAdjustmentAdapterPort,
} from './adapters/strategy.adapter.port';
import { StrategyAdjustmentEntity } from './infrastructure/typeorm/strategy-adjustment.entity';
import { CampaignEntity } from '../campaign/infrastructure/typeorm/campaign.entity';
import {
  StrategyAdjustmentResponse,
  StrategySuggestionResponse,
  TriggerAnalysisResponse,
} from './dto/strategy.response.dto';
import type { StrategySuggestion } from './adapters/strategy.adapter.port';

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
    brandBriefId?: string,
  ): Promise<TriggerAnalysisResponse> {
    // Create analysis record
    const record = await this.adjustments.save(
      this.adjustments.create({
        tenantId,
        status: 'analyzing',
        source: 'auto',
        brandBriefId: brandBriefId ?? null,
        data: {},
        suggestions: [],
      }),
    );

    try {
      // Collect metrics from campaigns, leads, content
      const campaignList = await this.campaigns.find({ where: { tenantId } });

      // Collect campaigns data
      const campaigns = campaignList.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        platforms: c.platforms ?? [],
        objective: c.objective ?? null,
      }));

      // Collect basic metrics (reuse dashboard pattern)
      const totalCampaigns = campaignList.length;
      const activeCampaigns = campaignList.filter((c) => c.status === 'active').length;
      const byStatus: Record<string, number> = {};
      for (const c of campaignList) {
        byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
      }

      // For full metrics, we'd need LeadEntity/ContentEntity repos
      // Use the adapter with what we have
      const brandBrief = null; // TODO: fetch brand brief if brandBriefId provided

      const analysis = await this.adapter.analyze({
        tenantId,
        source: 'auto',
        brandBrief,
        metrics: {
          leads: { total: 0, byStage: {}, conversionRate: 0 },
          content: { total: 0, byStatus: {}, approvalRate: 0 },
          campaigns: {
            total: totalCampaigns,
            active: activeCampaigns,
            byStatus,
          },
          trends: [],
        },
        campaigns,
      });

      record.data = {
        summary: analysis.summary,
        overallHealth: analysis.overallHealth,
        topPerforming: analysis.topPerforming,
        underperforming: analysis.underperforming,
        generatedAt: analysis.generatedAt,
      };
      record.suggestions = analysis.suggestions as unknown as Array<Record<string, unknown>>;
      record.status = 'ready';
      await this.adjustments.save(record);

      return { id: record.id, status: 'ready' };
    } catch (error) {
      this.logger.error(`Strategy analysis failed: ${error instanceof Error ? error.message : error}`);
      record.status = 'failed';
      record.errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      await this.adjustments.save(record);
      return { id: record.id, status: 'failed' };
    }
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

    // Mark approved suggestions as applied
    for (const s of suggestions) {
      if (s.status === 'approved') {
        s.status = 'applied';
      }
    }
    record.suggestions = suggestions as unknown as Array<Record<string, unknown>>;
    record.status = 'applied';
    await this.adjustments.save(record);

    // TODO: In future, this would trigger content regeneration per approved suggestion
    // For each approved suggestion with actionType 'adjust_content', queue content regeneration

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