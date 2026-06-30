import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AddInteractionHandler } from './commands/add-interaction.handler';
import { AddInteractionCommand } from './commands/add-interaction.command';
import { DeleteLeadCommand } from './commands/delete-lead.command';
import { DeleteLeadHandler } from './commands/delete-lead.handler';
import type { LeadStage } from './domain/lead.constants';
import {
  ChangeLeadStageDto,
  ListLeadsQueryDto,
  UpdateLeadDto,
} from './dto/lead.request.dto';
import {
  LeadInteractionResponseDto,
  LeadInteractionsListResponseDto,
  LeadResponseDto,
  PaginatedLeadsResponseDto,
} from './dto/lead.response.dto';
import { LeadInteractionEntity } from './infrastructure/typeorm/lead-interaction.entity';
import { LeadEntity } from './infrastructure/typeorm/lead.entity';

@Injectable()
export class LeadService {
  constructor(
    @InjectRepository(LeadEntity)
    private readonly leads: Repository<LeadEntity>,
    @InjectRepository(LeadInteractionEntity)
    private readonly interactions: Repository<LeadInteractionEntity>,
    private readonly addInteractionHandler: AddInteractionHandler,
    private readonly deleteLeadHandler: DeleteLeadHandler,
  ) {}

  async list(tenantId: string, query: ListLeadsQueryDto): Promise<PaginatedLeadsResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.leads
      .createQueryBuilder('l')
      .where('l.tenant_id = :tenantId', { tenantId })
      .orderBy('l.score', 'DESC')
      .addOrderBy('l.updated_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.stage) {
      qb.andWhere('l.stage = :stage', { stage: query.stage });
    }

    if (query.minScore !== undefined) {
      qb.andWhere('l.score >= :minScore', { minScore: query.minScore });
    }

    if (query.formId) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM form_submissions fs
          WHERE fs.lead_id = l.id AND fs.form_id = :formId
        )`,
        { formId: query.formId },
      );
    }

    if (query.productId) {
      qb.andWhere('l.product_id = :productId', { productId: query.productId });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((item) => this.toResponse(item)),
      total,
      page,
      limit,
    };
  }

  async findOne(tenantId: string, id: string): Promise<LeadResponseDto> {
    const lead = await this.findOwnedLead(tenantId, id);
    const recent = await this.interactions.find({
      where: { leadId: lead.id },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return {
      ...this.toResponse(lead),
      recentInteractions: recent.map((item) => this.toInteractionResponse(item)),
    };
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateLeadDto,
  ): Promise<LeadResponseDto> {
    const lead = await this.findOwnedLead(tenantId, id);

    if (dto.name !== undefined) lead.name = dto.name;
    if (dto.email !== undefined) lead.email = dto.email.trim().toLowerCase();
    if (dto.phone !== undefined) lead.phone = dto.phone;
    if (dto.company !== undefined) lead.company = dto.company;

    const saved = await this.leads.save(lead);

    await this.addInteractionHandler.execute(
      new AddInteractionCommand(tenantId, lead.id, 'profile_updated', 'Lead profile updated'),
    );

    return this.findOne(tenantId, saved.id);
  }

  async changeStage(
    tenantId: string,
    id: string,
    dto: ChangeLeadStageDto,
  ): Promise<LeadResponseDto> {
    const lead = await this.findOwnedLead(tenantId, id);
    const previous = lead.stage;

    if (previous === dto.stage) {
      return this.toResponse(lead);
    }

    lead.stage = dto.stage as LeadStage;
    await this.leads.save(lead);

    await this.addInteractionHandler.execute(
      new AddInteractionCommand(
        tenantId,
        lead.id,
        'stage_change',
        dto.note ?? `Stage changed from ${previous} to ${dto.stage}`,
        { from: previous, to: dto.stage },
      ),
    );

    return this.findOne(tenantId, id);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.deleteLeadHandler.execute(new DeleteLeadCommand(tenantId, id));
  }

  async listInteractions(
    tenantId: string,
    id: string,
  ): Promise<LeadInteractionsListResponseDto> {
    await this.findOwnedLead(tenantId, id);

    const items = await this.interactions.find({
      where: { leadId: id },
      order: { createdAt: 'DESC' },
    });

    return {
      items: items.map((item) => this.toInteractionResponse(item)),
      total: items.length,
    };
  }

  private async findOwnedLead(tenantId: string, id: string): Promise<LeadEntity> {
    const lead = await this.leads.findOne({ where: { id, tenantId } });
    if (!lead) {
      throw new NotFoundException({
        error: 'Lead not found',
        code: 'NOT_FOUND',
      });
    }
    return lead;
  }

  private toResponse(lead: LeadEntity): LeadResponseDto {
    return {
      id: lead.id,
      tenantId: lead.tenantId,
      email: lead.email,
      name: lead.name,
      phone: lead.phone,
      company: lead.company,
      score: lead.score,
      stage: lead.stage,
      metadata: lead.metadata,
      formSubmissionId: lead.formSubmissionId,
      productId: lead.productId,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
    };
  }

  private toInteractionResponse(entity: LeadInteractionEntity): LeadInteractionResponseDto {
    return {
      id: entity.id,
      leadId: entity.leadId,
      type: entity.type,
      description: entity.description,
      metadata: entity.metadata,
      createdAt: entity.createdAt.toISOString(),
    };
  }
}
