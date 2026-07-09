import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentRole } from '../../agency-agents/domain/agent-role.enum';
import { AgentEventService } from '../../agency-agents/services/agent-event.service';
import { OperatingProfileService } from '../../agency-agents/services/operating-profile.service';
import { AddInteractionHandler } from '../../crm/commands/add-interaction.handler';
import { AddInteractionCommand } from '../../crm/commands/add-interaction.command';
import { LeadEntity } from '../../crm/infrastructure/typeorm/lead.entity';
import { LeadScoringService } from '../../crm/services/lead-scoring.service';
import type { IngestSocialInteractionDto } from '../dto/social-inbox.request.dto';
import type {
  PaginatedSocialInteractionsDto,
  SocialInteractionResponseDto,
} from '../dto/social-inbox.response.dto';
import { SocialInteractionEntity } from '../infrastructure/typeorm/social-interaction.entity';
import { IntentClassifierService } from './intent-classifier.service';

@Injectable()
export class SocialInboxService {
  constructor(
    @InjectRepository(SocialInteractionEntity)
    private readonly interactions: Repository<SocialInteractionEntity>,
    @InjectRepository(LeadEntity)
    private readonly leads: Repository<LeadEntity>,
    private readonly classifier: IntentClassifierService,
    private readonly operatingProfile: OperatingProfileService,
    private readonly agentEvents: AgentEventService,
    private readonly addInteraction: AddInteractionHandler,
    private readonly scoring: LeadScoringService,
  ) {}

  async ingest(
    tenantId: string,
    dto: IngestSocialInteractionDto,
  ): Promise<SocialInteractionResponseDto> {
    const profile = await this.operatingProfile.getProfile(tenantId);
    if (!this.operatingProfile.canActivateAgent(profile, AgentRole.COMMUNITY)) {
      throw new ForbiddenException({
        error: 'Community agent no activo para este perfil',
        code: 'AGENT_INACTIVE',
      });
    }

    const classification = await this.classifier.classify(dto.message, tenantId);

    const row = this.interactions.create({
      tenantId,
      productId: dto.productId ?? null,
      platform: dto.platform ?? 'manual',
      channel: dto.channel ?? 'comment',
      externalId: dto.externalId ?? null,
      authorHandle: dto.authorHandle ?? null,
      message: dto.message,
      intent: classification.intent,
      sentiment: classification.sentiment,
      status: classification.intent === 'spam' ? 'dismissed' : 'open',
      suggestedReply: classification.suggestedReply ?? null,
      metadata: {
        purchaseSignals: classification.purchaseSignals,
        ...dto.metadata,
      },
    });

    let saved = await this.interactions.save(row);

    if (classification.intent === 'prospect') {
      saved = await this.bridgeToCrm(tenantId, saved, dto);
    }

    await this.agentEvents.logIfAgentActive(AgentRole.COMMUNITY, {
      tenantId,
      productId: saved.productId,
      sourceAgent: AgentRole.COMMUNITY,
      eventType: classification.intent === 'prospect' ? 'QualifiedLeadBatch' : 'SentimentSignal',
      payload: {
        interactionId: saved.id,
        intent: saved.intent,
        messagePreview: saved.message.slice(0, 120),
        leadId: saved.leadId,
      },
    });

    return this.toResponse(saved);
  }

  async list(
    tenantId: string,
    options: { status?: string; intent?: string; limit?: number; page?: number } = {},
  ): Promise<PaginatedSocialInteractionsDto> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;

    const qb = this.interactions
      .createQueryBuilder('s')
      .where('s.tenant_id = :tenantId', { tenantId })
      .orderBy('s.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (options.status) {
      qb.andWhere('s.status = :status', { status: options.status });
    }
    if (options.intent) {
      qb.andWhere('s.intent = :intent', { intent: options.intent });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((item) => this.toResponse(item)),
      total,
      page,
      limit,
    };
  }

  async markReplied(tenantId: string, id: string): Promise<SocialInteractionResponseDto> {
    const row = await this.findOwned(tenantId, id);
    row.status = 'replied';
    const saved = await this.interactions.save(row);
    return this.toResponse(saved);
  }

  private async bridgeToCrm(
    tenantId: string,
    interaction: SocialInteractionEntity,
    dto: IngestSocialInteractionDto,
  ): Promise<SocialInteractionEntity> {
    const email =
      dto.contactEmail ??
      (interaction.authorHandle
        ? `${interaction.authorHandle.replace(/[^a-zA-Z0-9]/g, '')}@social.placeholder`
        : `social-${interaction.id.slice(0, 8)}@placeholder.local`);

    let lead = await this.leads.findOne({
      where: { tenantId, email: email.toLowerCase() },
    });

    if (!lead) {
      lead = await this.leads.save(
        this.leads.create({
          tenantId,
          email: email.toLowerCase(),
          name: dto.contactName ?? interaction.authorHandle,
          phone: dto.contactPhone ?? null,
          productId: interaction.productId,
          stage: 'prospect',
          score: 0,
          metadata: {
            source: 'social',
            firstTouchSource: 'social',
            lastTouchSource: 'social',
            platform: interaction.platform,
            channel: interaction.channel,
            interactionId: interaction.id,
          },
        }),
      );
    }

    await this.addInteraction.execute(
      new AddInteractionCommand(
        tenantId,
        lead.id,
        'social_prospect',
        `Prospecto desde ${interaction.platform}/${interaction.channel}`,
        { interactionId: interaction.id, message: interaction.message },
      ),
    );

    await this.scoring.recalculate(lead.id);

    interaction.leadId = lead.id;
    interaction.status = 'escalated';
    return this.interactions.save(interaction);
  }

  private async findOwned(tenantId: string, id: string): Promise<SocialInteractionEntity> {
    const row = await this.interactions.findOne({ where: { id, tenantId } });
    if (!row) {
      throw new NotFoundException({ error: 'Interaction not found', code: 'NOT_FOUND' });
    }
    return row;
  }

  private toResponse(entity: SocialInteractionEntity): SocialInteractionResponseDto {
    return {
      id: entity.id,
      productId: entity.productId,
      platform: entity.platform,
      channel: entity.channel,
      authorHandle: entity.authorHandle,
      message: entity.message,
      intent: entity.intent,
      sentiment: entity.sentiment,
      status: entity.status,
      leadId: entity.leadId,
      suggestedReply: entity.suggestedReply,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
