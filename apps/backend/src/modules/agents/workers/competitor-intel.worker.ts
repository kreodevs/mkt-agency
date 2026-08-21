import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { runWithLlmUsageContext } from '../../../shared/ai/llm-usage.context';
import { QUEUE_COMPETITOR_INTEL } from '../../../shared/queue/queue.constants';
import { CompanyProfileEntity } from '../../company-profile/infrastructure/typeorm/company-profile.entity';
import { CompanyProfileSectionEntity } from '../../company-profile/infrastructure/typeorm/company-profile-section.entity';
import { ProfileSectionSyncService } from '../../company-profile/services/profile-section-sync.service';
import { CompetitorService } from '../../competitors/competitor.service';
import { ProductEntity } from '../../product/infrastructure/typeorm/product.entity';
import { toProductContext } from '../../product/domain/product-context.util';
import { COMPETITOR_INTEL_ADAPTER, CompetitorIntelAdapterPort } from '../adapters/competitor-intel.adapter.port';
import { buildCompetitorIntelContext } from '../domain/competitor-intel-context.util';
import { AgentCompetitorAnalysisEntity } from '../domain/agent-competitor-analysis.entity';
import { AgentInterviewEntity } from '../domain/agent-interview.entity';

export interface CompetitorIntelJobData {
  analysisId: string;
}

@Injectable()
export class CompetitorIntelWorkerService {
  private readonly logger = new Logger(CompetitorIntelWorkerService.name);

  constructor(
    @InjectRepository(AgentCompetitorAnalysisEntity)
    private readonly analyses: Repository<AgentCompetitorAnalysisEntity>,
    @InjectRepository(CompanyProfileEntity)
    private readonly profiles: Repository<CompanyProfileEntity>,
    @InjectRepository(CompanyProfileSectionEntity)
    private readonly profileSections: Repository<CompanyProfileSectionEntity>,
    @InjectRepository(AgentInterviewEntity)
    private readonly interviews: Repository<AgentInterviewEntity>,
    @InjectRepository(ProductEntity)
    private readonly products: Repository<ProductEntity>,
    private readonly profileSectionSync: ProfileSectionSyncService,
    private readonly competitorService: CompetitorService,
    @Inject(COMPETITOR_INTEL_ADAPTER)
    private readonly adapter: CompetitorIntelAdapterPort,
    @InjectQueue(QUEUE_COMPETITOR_INTEL)
    private readonly queue: Queue<CompetitorIntelJobData>,
  ) {}

  enqueue(analysisId: string): void {
    void this.queue
      .add('generate', { analysisId }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: 100,
      })
      .catch((error) => {
        this.logger.error(`Failed to enqueue competitor analysis ${analysisId}`, error);
      });
  }

  async processAnalysis(analysisId: string): Promise<void> {
    const analysis = await this.analyses.findOne({ where: { id: analysisId } });
    if (!analysis || analysis.status !== 'pending') return;

    analysis.status = 'processing';
    await this.analyses.save(analysis);

    return runWithLlmUsageContext({ tenantId: analysis.tenantId }, async () => {
      try {
      const profile = await this.profiles.findOne({
        where: { tenantId: analysis.tenantId },
      });
      const sections = profile
        ? await this.profileSections.find({ where: { profileId: profile.id } })
        : [];
      const profileValues = this.profileSectionSync.resolveProfileValues(profile, sections);

      const interview = await this.interviews.findOne({
        where: { tenantId: analysis.tenantId, agentType: 'brand_interview' },
        order: { updatedAt: 'DESC' },
      });

      const product = await this.products.findOne({
        where: { tenantId: analysis.tenantId, status: 'active' },
        order: { updatedAt: 'DESC' },
      });

      const fromTable = await this.competitorService.buildCompetitorsText(analysis.tenantId);
      const competitors =
        analysis.competitorsInput?.trim() || fromTable || profileValues.competitors?.trim() || '';
      if (!competitors) {
        throw new Error(
          'No hay competidores registrados para analizar. Búscalos con IA o regístralos manualmente.',
        );
      }

      const tenantContext = buildCompetitorIntelContext({
        profile: profileValues,
        product: product ? toProductContext(product) : null,
        brandBrief: interview?.brandBrief ?? null,
        brandBriefMarkdown: interview?.brandBriefMarkdown ?? null,
      });

      const result = await this.adapter.generateAnalysis(competitors, tenantContext);

      analysis.analysis = result;
      analysis.status = 'completed';
      analysis.errorMessage = null;
    } catch (error) {
      analysis.status = 'failed';
      analysis.errorMessage = error instanceof Error ? error.message : 'Analysis generation failed';
      analysis.analysis = null;
    }

    await this.analyses.save(analysis);
      });
  }
}