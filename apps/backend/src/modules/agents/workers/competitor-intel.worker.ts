import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { QUEUE_COMPETITOR_INTEL } from '../../../shared/queue/queue.constants';
import { CompanyProfileEntity } from '../../company-profile/infrastructure/typeorm/company-profile.entity';
import { COMPETITOR_INTEL_ADAPTER, CompetitorIntelAdapterPort } from '../adapters/competitor-intel.adapter.port';
import { AgentCompetitorAnalysisEntity } from '../domain/agent-competitor-analysis.entity';

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

    try {
      const profile = await this.profiles.findOne({
        where: { tenantId: analysis.tenantId },
      });

      const competitors = analysis.competitorsInput ?? profile?.competitors ?? '';
      if (!competitors.trim()) {
        throw new Error('No hay competidores registrados para analizar. Completa el perfil de empresa primero.');
      }

      const result = await this.adapter.generateAnalysis(competitors, {
        companyName: profile?.companyName,
        industry: profile?.industry,
        targetAudience: profile?.targetAudienceDesc,
      });

      analysis.analysis = result;
      analysis.status = 'completed';
      analysis.errorMessage = null;
    } catch (error) {
      analysis.status = 'failed';
      analysis.errorMessage = error instanceof Error ? error.message : 'Analysis generation failed';
      analysis.analysis = null;
    }

    await this.analyses.save(analysis);
  }
}