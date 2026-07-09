import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentRole } from '../../agency-agents/domain/agent-role.enum';
import type { CreativePackPayload } from '../../agency-agents/domain/handoff/creative-pack.types';
import { CreativePackEntity } from '../../agency-agents/infrastructure/typeorm/creative-pack.entity';
import { AgentPlanEntity } from '../../agency-agents/infrastructure/typeorm/agent-plan.entity';
import { AgentEventService } from '../../agency-agents/services/agent-event.service';
import { OperatingProfileService } from '../../agency-agents/services/operating-profile.service';
import { MediaCampaignIntentEntity } from '../infrastructure/typeorm/media-campaign-intent.entity';

@Injectable()
export class MediaBuyerStubService {
  private readonly logger = new Logger(MediaBuyerStubService.name);

  constructor(
    @InjectRepository(MediaCampaignIntentEntity)
    private readonly intents: Repository<MediaCampaignIntentEntity>,
    @InjectRepository(CreativePackEntity)
    private readonly packs: Repository<CreativePackEntity>,
    @InjectRepository(AgentPlanEntity)
    private readonly plans: Repository<AgentPlanEntity>,
    private readonly operatingProfile: OperatingProfileService,
    private readonly agentEvents: AgentEventService,
  ) {}

  async processCreativePack(tenantId: string, packId: string): Promise<MediaCampaignIntentEntity[]> {
    const profile = await this.operatingProfile.getProfile(tenantId);
    if (!this.operatingProfile.canActivateAgent(profile, AgentRole.MEDIA_BUYER)) {
      this.logger.debug(`Media buyer inactive for tenant ${tenantId}, skipping pack ${packId}`);
      return [];
    }

    const pack = await this.packs.findOne({ where: { id: packId, tenantId } });
    if (!pack) {
      throw new NotFoundException({ error: 'Creative pack not found', code: 'NOT_FOUND' });
    }

    const payload = pack.payload as unknown as CreativePackPayload;
    const plan = pack.planId
      ? await this.plans.findOne({ where: { id: pack.planId, tenantId } })
      : null;

    const monthlyCap = profile.adBudget.monthlyCap ?? 0;
    const platformGroups = this.groupCopiesByPlatform(payload.adCopies ?? []);
    const platformCount = Math.max(platformGroups.size, 1);
    const budgetPerPlatform = monthlyCap > 0 ? monthlyCap / platformCount : 0;
    const dailyBudget = budgetPerPlatform > 0 ? budgetPerPlatform / 30 : 0;

    const created: MediaCampaignIntentEntity[] = [];

    for (const [platform, copies] of platformGroups) {
      const intent = await this.intents.save(
        this.intents.create({
          tenantId,
          planId: pack.planId,
          creativePackId: pack.id,
          productId: pack.productId,
          platform,
          name: `Intent ${platform} — ${plan?.strategistOutput ? 'plan' : 'pack'} ${pack.id.slice(0, 8)}`,
          structure: {
            mode: 'manual_launch',
            note: 'Sin API de ads: ejecutar manualmente en Ads Manager con esta estructura',
            adSets: copies.map((copy, index) => ({
              name: `Ad Set ${index + 1}`,
              copy,
              bidding: 'lowest_cost',
              optimization: 'conversions',
            })),
            hypotheses: payload.hypotheses ?? [],
          },
          dailyBudget: dailyBudget > 0 ? String(Math.round(dailyBudget * 100) / 100) : null,
          totalBudget: budgetPerPlatform > 0 ? String(Math.round(budgetPerPlatform * 100) / 100) : null,
          status: 'pending_approval',
          requiresApproval: true,
          metadata: { source: 'media_buyer_stub' },
        }),
      );
      created.push(intent);
    }

    if (created.length === 0 && (payload.adCopies ?? []).length > 0) {
      const copy = payload.adCopies[0];
      const fallback = await this.intents.save(
        this.intents.create({
          tenantId,
          planId: pack.planId,
          creativePackId: pack.id,
          productId: pack.productId,
          platform: copy.platform,
          name: `Intent ${copy.platform}`,
          structure: { mode: 'manual_launch', adSets: [{ copy }] },
          status: 'pending_approval',
          requiresApproval: true,
          metadata: { source: 'media_buyer_stub' },
        }),
      );
      created.push(fallback);
    }

    await this.agentEvents.logIfAgentActive(AgentRole.MEDIA_BUYER, {
      tenantId,
      productId: pack.productId,
      sourceAgent: AgentRole.MEDIA_BUYER,
      eventType: 'CampaignLive',
      payload: {
        stub: true,
        packId: pack.id,
        intentIds: created.map((i) => i.id),
        message: 'Intents listos para lanzamiento manual (sin integración Meta)',
      },
      correlationId: pack.planId ?? pack.id,
    });

    return created;
  }

  async listIntents(tenantId: string): Promise<MediaCampaignIntentEntity[]> {
    return this.intents.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async approveIntent(
    tenantId: string,
    userId: string,
    intentId: string,
  ): Promise<MediaCampaignIntentEntity> {
    const intent = await this.intents.findOne({ where: { id: intentId, tenantId } });
    if (!intent) {
      throw new NotFoundException({ error: 'Intent not found', code: 'NOT_FOUND' });
    }
    intent.status = 'approved';
    intent.approvedAt = new Date();
    intent.approvedBy = userId;
    return this.intents.save(intent);
  }

  async markManualLaunch(
    tenantId: string,
    intentId: string,
  ): Promise<MediaCampaignIntentEntity> {
    const intent = await this.intents.findOne({ where: { id: intentId, tenantId } });
    if (!intent) {
      throw new NotFoundException({ error: 'Intent not found', code: 'NOT_FOUND' });
    }
    if (intent.status !== 'approved') {
      intent.status = 'approved';
    }
    intent.status = 'launched_manual';
    intent.launchedAt = new Date();
    const saved = await this.intents.save(intent);

    await this.agentEvents.logIfAgentActive(AgentRole.MEDIA_BUYER, {
      tenantId,
      productId: intent.productId,
      sourceAgent: AgentRole.MEDIA_BUYER,
      eventType: 'BudgetReallocated',
      payload: { intentId: intent.id, platform: intent.platform, manual: true },
    });

    return saved;
  }

  private groupCopiesByPlatform(
    copies: CreativePackPayload['adCopies'],
  ): Map<string, CreativePackPayload['adCopies']> {
    const map = new Map<string, CreativePackPayload['adCopies']>();
    for (const copy of copies) {
      const list = map.get(copy.platform) ?? [];
      list.push(copy);
      map.set(copy.platform, list);
    }
    return map;
  }
}
