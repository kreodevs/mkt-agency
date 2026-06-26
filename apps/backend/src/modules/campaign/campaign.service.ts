import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CAMPAIGN_STATUSES, CampaignStatus } from './domain/campaign.constants';
import {
  CreateCampaignDto,
  ListCampaignsQueryDto,
  UpdateBudgetDto,
  UpdateCampaignDto,
} from './dto/campaign.request.dto';
import {
  BudgetResponseDto,
  CampaignResponseDto,
  GenerateStrategyAcceptedDto,
  PaginatedCampaignsResponseDto,
  StrategyAssignmentResponseDto,
} from './dto/campaign.response.dto';
import { BudgetEntity } from './infrastructure/typeorm/budget.entity';
import { CampaignEntity } from './infrastructure/typeorm/campaign.entity';
import { CampaignStrategyAssignmentEntity } from './infrastructure/typeorm/campaign-strategy-assignment.entity';
import { CampaignTemplateEntity } from './infrastructure/typeorm/campaign-template.entity';
import { StrategyGeneratorWorkerService } from './workers/strategy-generator.worker';

@Injectable()
export class CampaignService {
  constructor(
    @InjectRepository(CampaignEntity)
    private readonly campaigns: Repository<CampaignEntity>,
    @InjectRepository(CampaignTemplateEntity)
    private readonly templates: Repository<CampaignTemplateEntity>,
    @InjectRepository(BudgetEntity)
    private readonly budgets: Repository<BudgetEntity>,
    @InjectRepository(CampaignStrategyAssignmentEntity)
    private readonly strategyAssignments: Repository<CampaignStrategyAssignmentEntity>,
    private readonly strategyWorker: StrategyGeneratorWorkerService,
  ) {}

  async list(
    tenantId: string,
    query: ListCampaignsQueryDto,
  ): Promise<PaginatedCampaignsResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.campaigns
      .createQueryBuilder('c')
      .where('c.tenant_id = :tenantId', { tenantId })
      .orderBy('c.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.status) {
      qb.andWhere('c.status = :status', { status: query.status });
    }

    if (query.platform) {
      qb.andWhere('c.platforms @> :platform', {
        platform: JSON.stringify([query.platform]),
      });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((item) => this.toResponse(item)),
      total,
      page,
      limit,
    };
  }

  async create(tenantId: string, dto: CreateCampaignDto): Promise<CampaignResponseDto> {
    let template: CampaignTemplateEntity | null = null;

    if (dto.templateId) {
      template = await this.templates.findOne({ where: { id: dto.templateId } });
      if (
        !template ||
        (!template.isPredefined && template.tenantId !== tenantId)
      ) {
        throw new NotFoundException({
          error: 'Campaign template not found',
          code: 'NOT_FOUND',
        });
      }
    }

    const saved = await this.campaigns.save(
      this.campaigns.create({
        tenantId,
        templateId: dto.templateId ?? null,
        name: dto.name,
        objective: dto.objective ?? template?.objective ?? null,
        status: 'draft',
        totalBudget:
          dto.totalBudget !== undefined ? String(dto.totalBudget) : null,
        platforms: dto.platforms ?? template?.platforms ?? [],
        strategy: {},
      }),
    );

    return this.toResponse(saved);
  }

  async findOne(tenantId: string, id: string): Promise<CampaignResponseDto> {
    const campaign = await this.findOwnedCampaign(tenantId, id);
    const budgetRows = await this.budgets.find({
      where: { campaignId: campaign.id },
      order: { createdAt: 'ASC' },
    });

    return this.toResponse(campaign, budgetRows);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateCampaignDto,
  ): Promise<CampaignResponseDto> {
    const campaign = await this.findOwnedCampaign(tenantId, id);

    if (dto.status && !CAMPAIGN_STATUSES.includes(dto.status as CampaignStatus)) {
      throw new BadRequestException({
        error: 'Invalid campaign status',
        code: 'VALIDATION_ERROR',
      });
    }

    Object.assign(campaign, {
      name: dto.name ?? campaign.name,
      objective: dto.objective ?? campaign.objective,
      status: (dto.status as CampaignStatus) ?? campaign.status,
      platforms: dto.platforms ?? campaign.platforms,
      totalBudget:
        dto.totalBudget !== undefined
          ? String(dto.totalBudget)
          : campaign.totalBudget,
    });

    const saved = await this.campaigns.save(campaign);
    return this.toResponse(saved);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const campaign = await this.findOwnedCampaign(tenantId, id);

    if (campaign.status !== 'draft') {
      throw new ConflictException({
        error: 'Only draft campaigns can be deleted',
        code: 'CONFLICT',
      });
    }

    await this.budgets.delete({ campaignId: campaign.id });
    await this.campaigns.remove(campaign);
  }

  async requestStrategyGeneration(
    tenantId: string,
    campaignId: string,
  ): Promise<GenerateStrategyAcceptedDto> {
    const campaign = await this.findOwnedCampaign(tenantId, campaignId);

    const inProgress = await this.strategyAssignments.findOne({
      where: [
        { tenantId, campaignId, status: 'pending' },
        { tenantId, campaignId, status: 'processing' },
      ],
    });

    if (inProgress) {
      return {
        assignmentId: inProgress.id,
        status: inProgress.status === 'pending' ? 'pending' : 'processing',
        message: 'Strategy generation already in progress.',
      };
    }

    const assignment = await this.strategyAssignments.save(
      this.strategyAssignments.create({
        tenantId,
        campaignId: campaign.id,
        status: 'pending',
        result: null,
        errorMessage: null,
      }),
    );

    this.strategyWorker.enqueue(assignment.id);

    return {
      assignmentId: assignment.id,
      status: 'pending',
      message: 'Strategy generation in progress.',
    };
  }

  async getStrategyAssignment(
    tenantId: string,
    assignmentId: string,
  ): Promise<StrategyAssignmentResponseDto> {
    const assignment = await this.strategyAssignments.findOne({
      where: { id: assignmentId, tenantId },
    });

    if (!assignment) {
      throw new NotFoundException({
        error: 'Strategy assignment not found',
        code: 'NOT_FOUND',
      });
    }

    const response: StrategyAssignmentResponseDto = {
      assignmentId: assignment.id,
      campaignId: assignment.campaignId,
      status: assignment.status,
    };

    if (assignment.status === 'completed' && assignment.result) {
      response.result = assignment.result;
    }

    if (assignment.status === 'failed' && assignment.errorMessage) {
      response.error = assignment.errorMessage;
    }

    return response;
  }

  async listBudgets(tenantId: string, campaignId: string): Promise<BudgetResponseDto[]> {
    await this.findOwnedCampaign(tenantId, campaignId);

    const rows = await this.budgets.find({
      where: { campaignId },
      order: { createdAt: 'ASC' },
    });

    return rows.map((row) => this.toBudgetResponse(row));
  }

  async updateBudget(
    tenantId: string,
    campaignId: string,
    budgetId: string,
    dto: UpdateBudgetDto,
  ): Promise<BudgetResponseDto> {
    await this.findOwnedCampaign(tenantId, campaignId);

    const budget = await this.budgets.findOne({
      where: { id: budgetId, campaignId },
    });

    if (!budget) {
      throw new NotFoundException({
        error: 'Budget not found',
        code: 'NOT_FOUND',
      });
    }

    budget.approved = dto.approved;
    const saved = await this.budgets.save(budget);
    return this.toBudgetResponse(saved);
  }

  private async findOwnedCampaign(
    tenantId: string,
    id: string,
  ): Promise<CampaignEntity> {
    const campaign = await this.campaigns.findOne({ where: { id, tenantId } });
    if (!campaign) {
      throw new NotFoundException({
        error: 'Campaign not found',
        code: 'NOT_FOUND',
      });
    }

    return campaign;
  }

  private toResponse(
    campaign: CampaignEntity,
    budgetRows?: BudgetEntity[],
  ): CampaignResponseDto {
    const response: CampaignResponseDto = {
      id: campaign.id,
      tenantId: campaign.tenantId,
      templateId: campaign.templateId,
      name: campaign.name,
      objective: campaign.objective,
      status: campaign.status,
      totalBudget: campaign.totalBudget ? Number(campaign.totalBudget) : null,
      platforms: campaign.platforms,
      strategy: campaign.strategy,
      createdAt: campaign.createdAt.toISOString(),
      updatedAt: campaign.updatedAt.toISOString(),
    };

    if (budgetRows) {
      response.budgets = budgetRows.map((row) => this.toBudgetResponse(row));
    }

    return response;
  }

  private toBudgetResponse(budget: BudgetEntity): BudgetResponseDto {
    return {
      id: budget.id,
      platform: budget.platform,
      dailyBudget: Number(budget.dailyBudget),
      totalBudget: Number(budget.totalBudget),
      proposedByAi: budget.proposedByAi,
      approved: budget.approved,
      createdAt: budget.createdAt.toISOString(),
      updatedAt: budget.updatedAt.toISOString(),
    };
  }
}
