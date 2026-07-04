import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentCompetitorAnalysisEntity } from './domain/agent-competitor-analysis.entity';
import { CompetitorIntelWorkerService } from './workers/competitor-intel.worker';

@Injectable()
export class CompetitorIntelService {
  constructor(
    @InjectRepository(AgentCompetitorAnalysisEntity)
    private readonly analyses: Repository<AgentCompetitorAnalysisEntity>,
    private readonly worker: CompetitorIntelWorkerService,
  ) {}

  async listAnalyses(tenantId: string): Promise<AgentCompetitorAnalysisEntity[]> {
    return this.analyses.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async triggerAnalysis(tenantId: string, competitorsInput?: string): Promise<AgentCompetitorAnalysisEntity> {
    const active = await this.analyses.findOne({
      where: { tenantId, status: 'pending' },
    });
    if (active) {
      throw new ConflictException({
        error: 'Ya hay un análisis en progreso',
        code: 'CONFLICT',
        analysisId: active.id,
      });
    }

    const analysis = await this.analyses.save(
      this.analyses.create({
        tenantId,
        status: 'pending',
        competitorsInput: competitorsInput ?? null,
        analysis: null,
        errorMessage: null,
      }),
    );

    this.worker.enqueue(analysis.id);
    return analysis;
  }

  async getAnalysis(tenantId: string, analysisId: string): Promise<AgentCompetitorAnalysisEntity> {
    const analysis = await this.analyses.findOne({
      where: { id: analysisId, tenantId },
    });
    if (!analysis) {
      throw new NotFoundException({
        error: 'Análisis no encontrado',
        code: 'NOT_FOUND',
      });
    }
    return analysis;
  }

  async getLatestCompletedAnalysis(
    tenantId: string,
  ): Promise<AgentCompetitorAnalysisEntity | null> {
    return this.analyses.findOne({
      where: { tenantId, status: 'completed' },
      order: { updatedAt: 'DESC' },
    });
  }

  async waitForAnalysisCompletion(
    tenantId: string,
    analysisId: string,
    options?: { timeoutMs?: number; pollIntervalMs?: number },
  ): Promise<AgentCompetitorAnalysisEntity> {
    const timeoutMs = options?.timeoutMs ?? 180_000;
    const pollIntervalMs = options?.pollIntervalMs ?? 3_000;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const analysis = await this.getAnalysis(tenantId, analysisId);
      if (analysis.status === 'completed' || analysis.status === 'failed') {
        return analysis;
      }

      await sleep(pollIntervalMs);
    }

    return this.getAnalysis(tenantId, analysisId);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}