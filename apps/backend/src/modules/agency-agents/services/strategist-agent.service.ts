import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LlmClient } from '../../../shared/ai/llm.client';
import type { StrategistPlanPayload } from '../domain/handoff/strategist-plan.types';
import type { ContentBriefPayload } from '../domain/handoff/creative-pack.types';
import { AgentPlanEntity } from '../infrastructure/typeorm/agent-plan.entity';
import { AgentEventService } from './agent-event.service';
import { AgentRole } from '../domain/agent-role.enum';
import { CreativeAgentService } from './creative-agent.service';
import { OperatingProfileService } from './operating-profile.service';
import type { CreateAgencyPlanDto } from '../dto/agency-plan.request.dto';

@Injectable()
export class StrategistAgentService {
  constructor(
    @InjectRepository(AgentPlanEntity)
    private readonly plans: Repository<AgentPlanEntity>,
    private readonly operatingProfile: OperatingProfileService,
    private readonly agentEvents: AgentEventService,
    private readonly llm: LlmClient,
    private readonly creativeAgent: CreativeAgentService,
  ) {}

  async createPlan(
    tenantId: string,
    userId: string,
    dto: CreateAgencyPlanDto,
  ): Promise<AgentPlanEntity> {
    const profile = await this.operatingProfile.getProfile(tenantId);
    if (profile.profile === 'soho') {
      throw new ForbiddenException({
        error: 'Los planes de estrategia comercial requieren perfil Growth',
        code: 'SOHO_PROFILE',
      });
    }

    const subProfile = this.operatingProfile.resolveSubProfile(profile);
    const strategistOutput = await this.buildPlanOutput(tenantId, dto, subProfile);

    const plan = await this.plans.save(
      this.plans.create({
        tenantId,
        productId: dto.productId ?? null,
        strategistOutput: strategistOutput as unknown as Record<string, unknown>,
        status: 'draft',
      }),
    );

    await this.agentEvents.log({
      tenantId,
      productId: dto.productId ?? null,
      sourceAgent: AgentRole.STRATEGIST,
      eventType: 'StrategistPlanDraft',
      payload: { planId: plan.id, objective: dto.objective },
      correlationId: plan.id,
    });

    return plan;
  }

  async approvePlan(
    tenantId: string,
    userId: string,
    planId: string,
  ): Promise<AgentPlanEntity> {
    const plan = await this.plans.findOne({ where: { id: planId, tenantId } });
    if (!plan) {
      throw new NotFoundException({ error: 'Plan not found', code: 'NOT_FOUND' });
    }
    if (plan.status === 'approved') {
      return plan;
    }

    plan.status = 'approved';
    plan.approvedAt = new Date();
    plan.approvedBy = userId;
    const saved = await this.plans.save(plan);

    await this.agentEvents.log({
      tenantId,
      productId: plan.productId,
      sourceAgent: AgentRole.STRATEGIST,
      targetAgent: AgentRole.CREATIVE,
      eventType: 'PlanApproved',
      payload: { planId: plan.id },
      correlationId: plan.id,
    });

    const brief = this.extractCreativeBrief(saved.strategistOutput);
    await this.agentEvents.log({
      tenantId,
      productId: plan.productId,
      sourceAgent: AgentRole.STRATEGIST,
      targetAgent: AgentRole.CREATIVE,
      eventType: 'CreativeBrief',
      payload: {
        planId: plan.id,
        brief,
      },
      correlationId: plan.id,
    });

    void this.creativeAgent
      .generateFromBrief(tenantId, plan.id, brief, plan.productId)
      .catch(() => undefined);

    const profile = await this.operatingProfile.getProfile(tenantId);
    if (this.operatingProfile.isPaidCapable(profile)) {
      await this.agentEvents.log({
        tenantId,
        productId: plan.productId,
        sourceAgent: AgentRole.STRATEGIST,
        targetAgent: AgentRole.MEDIA_BUYER,
        eventType: 'PlanApproved',
        payload: { planId: plan.id, adBudget: profile.adBudget },
        correlationId: plan.id,
      });
    }

    return saved;
  }

  async listPlans(tenantId: string): Promise<AgentPlanEntity[]> {
    return this.plans.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async getPlan(tenantId: string, planId: string): Promise<AgentPlanEntity> {
    const plan = await this.plans.findOne({ where: { id: planId, tenantId } });
    if (!plan) {
      throw new NotFoundException({ error: 'Plan not found', code: 'NOT_FOUND' });
    }
    return plan;
  }

  private async buildPlanOutput(
    tenantId: string,
    dto: CreateAgencyPlanDto,
    subProfile: string,
  ): Promise<StrategistPlanPayload> {
    const includeBudget = subProfile === 'growth_paid';

    const systemPrompt =
      'Eres Director de Estrategia de Negocio. Responde SOLO JSON válido con la forma: ' +
      '{"commercialObjective":{"metric","target","unit","horizon"},' +
      '"funnelStages":[{"stage","channels","budgetPercent","kpi"}],' +
      '"channelRecommendations":[{"channel","rationale","priority"}],' +
      '"constraints":{},"rationale":""}. ' +
      'Enfócate en objetivos financieros (ingresos, margen, ROI). ' +
      (includeBudget
        ? 'Incluye budgetPercent por etapa del embudo que sume 100.'
        : 'Todos los budgetPercent deben ser 0 (sin pauta pagada).');

    try {
      const result = await this.llm.chatJson<StrategistPlanPayload>(
        systemPrompt,
        JSON.stringify({
          objective: dto.objective,
          metric: dto.metric,
          target: dto.target,
          horizon: dto.horizon ?? '30d',
          includeBudget,
          channels: dto.channels ?? [],
        }),
        { taskType: 'campaign_strategy', tenantId },
      );
      if (result?.commercialObjective && Array.isArray(result.funnelStages)) {
        if (!includeBudget) {
          result.funnelStages = result.funnelStages.map((stage) => ({
            ...stage,
            budgetPercent: 0,
          }));
        }
        return result;
      }
    } catch {
      // fallback below
    }

    return this.fallbackPlan(dto, includeBudget);
  }

  private fallbackPlan(dto: CreateAgencyPlanDto, includeBudget: boolean): StrategistPlanPayload {
    const metric = dto.metric ?? 'leads';
    return {
      commercialObjective: {
        metric,
        target: dto.target ?? 10,
        unit: metric === 'leads' ? 'count' : 'percent',
        horizon: dto.horizon ?? '30d',
      },
      funnelStages: [
        {
          stage: 'awareness',
          channels: dto.channels?.length ? dto.channels : ['instagram', 'facebook'],
          budgetPercent: includeBudget ? 30 : 0,
          kpi: 'reach',
        },
        {
          stage: 'consideration',
          channels: dto.channels?.length ? dto.channels : ['instagram'],
          budgetPercent: includeBudget ? 30 : 0,
          kpi: 'engagement',
        },
        {
          stage: 'conversion',
          channels: dto.channels?.length ? dto.channels.slice(0, 1) : ['instagram'],
          budgetPercent: includeBudget ? 40 : 0,
          kpi: 'leads',
        },
      ],
      channelRecommendations: (dto.channels ?? ['instagram']).map((channel, i) => ({
        channel,
        rationale: `Canal alineado al objetivo: ${dto.objective}`,
        priority: i + 1,
      })),
      constraints: {},
      rationale: `Plan generado para: ${dto.objective}`,
    };
  }

  private extractCreativeBrief(output: Record<string, unknown>): ContentBriefPayload {
    const stages = output.funnelStages;
    const channels = Array.isArray(stages)
      ? [...new Set((stages as Array<{ channels?: string[] }>).flatMap((s) => s.channels ?? []))]
      : ['instagram'];
    const objective = (output.commercialObjective as { metric?: string })?.metric ?? 'leads';
    return {
      platforms: channels,
      objective,
      topics: [],
    };
  }
}
