import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { QUEUE_BRAND_INTERVIEW } from '../../../shared/queue/queue.constants';
import { formatWorkerErrorMessage } from '../../../shared/worker-error.util';
import { CompanyProfileService } from '../../company-profile/company-profile.service';
import { CompanyProfileEntity } from '../../company-profile/infrastructure/typeorm/company-profile.entity';
import { ProductEntity } from '../../product/infrastructure/typeorm/product.entity';
import { toProductContext } from '../../product/domain/product-context.util';
import { brandBriefToMarkdown } from '../brand-brief-markdown.util';
import { INTERVIEW_ADAPTER, InterviewAdapterPort } from '../adapters/interview.adapter.port';
import { InterviewContext } from '../adapters/interview.context';
import { AgentInterviewEntity } from '../domain/agent-interview.entity';
import { AgentInterviewMessageEntity } from '../domain/agent-interview-message.entity';

export interface BrandInterviewJobData {
  interviewId: string;
  tenantId: string;
}

@Injectable()
export class BrandInterviewWorkerService {
  private readonly logger = new Logger(BrandInterviewWorkerService.name);

  constructor(
    @InjectRepository(AgentInterviewEntity)
    private readonly interviews: Repository<AgentInterviewEntity>,
    @InjectRepository(AgentInterviewMessageEntity)
    private readonly messages: Repository<AgentInterviewMessageEntity>,
    @InjectRepository(CompanyProfileEntity)
    private readonly profiles: Repository<CompanyProfileEntity>,
    @InjectRepository(ProductEntity)
    private readonly products: Repository<ProductEntity>,
    private readonly companyProfile: CompanyProfileService,
    @Inject(INTERVIEW_ADAPTER)
    private readonly adapter: InterviewAdapterPort,
    @InjectQueue(QUEUE_BRAND_INTERVIEW)
    private readonly queue: Queue<BrandInterviewJobData>,
  ) {}

  enqueue(interviewId: string): void {
    void this.queue
      .add(
        'generate-brief',
        { interviewId, tenantId: '' }, // tenantId resolved in processor
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: true,
          removeOnFail: 100,
        },
      )
      .catch((error) => {
        this.logger.error(`Failed to enqueue brand interview ${interviewId}`, error);
      });
  }

  async processInterview(interviewId: string): Promise<void> {
    const interview = await this.interviews.findOne({ where: { id: interviewId } });
    if (!interview || interview.status !== 'in_progress') {
      return;
    }

    try {
      const profile = await this.profiles.findOne({
        where: { tenantId: interview.tenantId },
      });

      let productContext: InterviewContext['product'] = null;
      if (interview.productId) {
        const product = await this.products.findOne({
          where: { id: interview.productId, tenantId: interview.tenantId },
        });
        if (product) {
          const ctx = toProductContext(product);
          productContext = {
            id: ctx.id,
            name: ctx.name,
            description: ctx.description,
            valueProposition: ctx.valueProposition,
            targetAudience: ctx.targetAudience,
          };
        }
      }

      const context: InterviewContext = {
        agentType: interview.agentType,
        tenantId: interview.tenantId,
        currentStep: interview.currentStep,
        totalSteps: interview.totalSteps,
        answers: interview.answers,
        profile: {
          companyName: profile?.companyName ?? null,
          industry: profile?.industry ?? null,
          website: profile?.website ?? null,
          brandVoice: profile?.brandVoice ?? null,
          targetAudienceDesc: profile?.targetAudienceDesc ?? null,
          competitors: profile?.competitors ?? null,
          objectives: profile?.objectives ? JSON.stringify(profile.objectives) : null,
        },
        product: productContext,
      };

      const brandBrief =
        interview.brandBrief ?? (await this.adapter.generateBrandBrief(context));

      await this.finalizeInterview(interview, profile, brandBrief);
    } catch (error) {
      interview.status = 'failed';
      interview.errorMessage = formatWorkerErrorMessage(
        error,
        'No se pudo generar el Brand Brief',
      );
      await this.interviews.save(interview);

      await this.messages.save(
        this.messages.create({
          interviewId,
          role: 'system',
          content: `Error al generar el Brand Brief: ${interview.errorMessage}. Intenta de nuevo en unos segundos.`,
          metadata: { type: 'error' },
        }),
      );

      this.logger.error(`Brand interview ${interviewId} failed`, error);
    }
  }

  private async finalizeInterview(
    interview: AgentInterviewEntity,
    profile: CompanyProfileEntity | null,
    brandBrief: Record<string, unknown>,
  ): Promise<void> {
    interview.brandBrief = brandBrief;
    interview.brandBriefMarkdown = brandBriefToMarkdown(brandBrief);
    interview.status = 'completed';
    interview.errorMessage = null;
    await this.interviews.save(interview);

    const objectivesRaw = brandBrief.objectives;
    const objectivesArr =
      typeof objectivesRaw === 'string'
        ? objectivesRaw.split('\n').filter(Boolean).map((s) => s.trim())
        : Array.isArray(objectivesRaw)
          ? objectivesRaw
          : profile?.objectives ?? [];

    try {
      await this.companyProfile.mergeFromBrandBrief(interview.tenantId, {
        companyName: (brandBrief.companyName ?? profile?.companyName ?? undefined) as
          | string
          | undefined,
        industry: (brandBrief.industry ?? profile?.industry ?? undefined) as string | undefined,
        targetAudienceDesc: (brandBrief.targetAudienceDesc ??
          profile?.targetAudienceDesc ??
          undefined) as string | undefined,
        brandVoice: (brandBrief.brandVoice ?? profile?.brandVoice ?? undefined) as
          | string
          | undefined,
        competitors: (brandBrief.competitors ?? profile?.competitors ?? undefined) as
          | string
          | undefined,
        objectives: objectivesArr.length > 0 ? objectivesArr : undefined,
      });
    } catch (error) {
      this.logger.warn(
        `Brand interview ${interview.id}: brief saved but profile merge failed`,
        error,
      );
    }

    await this.messages.save(
      this.messages.create({
        interviewId: interview.id,
        role: 'agent',
        content:
          '✅ **Brand Brief generado con éxito.** El análisis de tu marca está listo. Puedes ver el resumen en la parte inferior de esta página y consultar tu perfil de empresa actualizado.',
        metadata: { type: 'completed' },
      }),
    );
  }
}