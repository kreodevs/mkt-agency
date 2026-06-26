import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateCampaignTemplateDto,
  ListCampaignTemplatesQueryDto,
  UpdateCampaignTemplateDto,
} from './dto/campaign.request.dto';
import {
  CampaignTemplateResponseDto,
  PaginatedCampaignTemplatesResponseDto,
} from './dto/campaign.response.dto';
import { CampaignEntity } from './infrastructure/typeorm/campaign.entity';
import { CampaignTemplateEntity } from './infrastructure/typeorm/campaign-template.entity';

@Injectable()
export class CampaignTemplateService {
  constructor(
    @InjectRepository(CampaignTemplateEntity)
    private readonly templates: Repository<CampaignTemplateEntity>,
    @InjectRepository(CampaignEntity)
    private readonly campaigns: Repository<CampaignEntity>,
  ) {}

  async list(
    tenantId: string,
    query: ListCampaignTemplatesQueryDto,
  ): Promise<PaginatedCampaignTemplatesResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.templates
      .createQueryBuilder('t')
      .where('t.tenant_id = :tenantId OR t.is_predefined = true', { tenantId })
      .orderBy('t.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((item) => this.toResponse(item)),
      total,
      page,
      limit,
    };
  }

  async create(
    tenantId: string,
    dto: CreateCampaignTemplateDto,
  ): Promise<CampaignTemplateResponseDto> {
    const saved = await this.templates.save(
      this.templates.create({
        tenantId,
        name: dto.name,
        description: dto.description ?? null,
        objective: dto.objective ?? null,
        platforms: dto.platforms ?? [],
        budgetDistribution: dto.budgetDistribution ?? {},
        agentConfig: dto.agentConfig ?? {},
        isPredefined: false,
      }),
    );

    return this.toResponse(saved);
  }

  async findOne(tenantId: string, id: string): Promise<CampaignTemplateResponseDto> {
    const template = await this.findAccessibleTemplate(tenantId, id);
    return this.toResponse(template);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateCampaignTemplateDto,
  ): Promise<CampaignTemplateResponseDto> {
    const template = await this.findOwnedTemplate(tenantId, id);

    Object.assign(template, {
      name: dto.name ?? template.name,
      description: dto.description ?? template.description,
      objective: dto.objective ?? template.objective,
      platforms: dto.platforms ?? template.platforms,
      budgetDistribution: dto.budgetDistribution ?? template.budgetDistribution,
      agentConfig: dto.agentConfig ?? template.agentConfig,
    });

    const saved = await this.templates.save(template);
    return this.toResponse(saved);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const template = await this.findOwnedTemplate(tenantId, id);

    const activeCampaigns = await this.campaigns.count({
      where: { templateId: template.id, tenantId },
    });

    if (activeCampaigns > 0) {
      throw new ConflictException({
        error: 'Template is referenced by existing campaigns',
        code: 'CONFLICT',
      });
    }

    await this.templates.remove(template);
  }

  private async findAccessibleTemplate(
    tenantId: string,
    id: string,
  ): Promise<CampaignTemplateEntity> {
    const template = await this.templates.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException({
        error: 'Campaign template not found',
        code: 'NOT_FOUND',
      });
    }

    if (template.isPredefined || template.tenantId === tenantId) {
      return template;
    }

    throw new NotFoundException({
      error: 'Campaign template not found',
      code: 'NOT_FOUND',
    });
  }

  private async findOwnedTemplate(
    tenantId: string,
    id: string,
  ): Promise<CampaignTemplateEntity> {
    const template = await this.templates.findOne({ where: { id, tenantId } });
    if (!template || template.isPredefined) {
      throw new NotFoundException({
        error: 'Campaign template not found',
        code: 'NOT_FOUND',
      });
    }

    return template;
  }

  private toResponse(template: CampaignTemplateEntity): CampaignTemplateResponseDto {
    return {
      id: template.id,
      tenantId: template.tenantId,
      name: template.name,
      description: template.description,
      objective: template.objective,
      platforms: template.platforms,
      budgetDistribution: template.budgetDistribution,
      agentConfig: template.agentConfig,
      isPredefined: template.isPredefined,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    };
  }
}
