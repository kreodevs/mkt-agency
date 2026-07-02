import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { CompanyProfileEntity } from '../../company-profile/infrastructure/typeorm/company-profile.entity';
import { toProductContext } from '../../product/domain/product-context.util';
import { ProductEntity } from '../../product/infrastructure/typeorm/product.entity';
import { runWithLlmUsageContext } from '../../../shared/ai/llm-usage.context';
import { QUEUE_CAMPAIGN_STRATEGY } from '../../../shared/queue/queue.constants';
import {
  STRATEGY_ADAPTER,
  StrategyAdapterPort,
} from '../adapters/strategy.adapter.port';
import { BudgetEntity } from '../infrastructure/typeorm/budget.entity';
import { CampaignEntity } from '../infrastructure/typeorm/campaign.entity';
import { CampaignStrategyAssignmentEntity } from '../infrastructure/typeorm/campaign-strategy-assignment.entity';

export interface StrategyJobData {
  assignmentId: string;
}

@Injectable()
export class StrategyGeneratorWorkerService {
  private readonly logger = new Logger(StrategyGeneratorWorkerService.name);

  constructor(
    @InjectRepository(CampaignStrategyAssignmentEntity)
    private readonly assignments: Repository<CampaignStrategyAssignmentEntity>,
    @InjectRepository(CampaignEntity)
    private readonly campaigns: Repository<CampaignEntity>,
    @InjectRepository(BudgetEntity)
    private readonly budgets: Repository<BudgetEntity>,
    @InjectRepository(CompanyProfileEntity)
    private readonly profiles: Repository<CompanyProfileEntity>,
    @InjectRepository(ProductEntity)
    private readonly products: Repository<ProductEntity>,
    @Inject(STRATEGY_ADAPTER)
    private readonly strategyAdapter: StrategyAdapterPort,
    @InjectQueue(QUEUE_CAMPAIGN_STRATEGY)
    private readonly queue: Queue<StrategyJobData>,
  ) {}

  enqueue(assignmentId: string): void {
    void this.queue
      .add(
        'generate',
        { assignmentId },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 3000 },
          removeOnComplete: true,
          removeOnFail: 100,
        },
      )
      .catch((error) => {
        this.logger.error(`Failed to enqueue strategy ${assignmentId}`, error);
      });
  }

  async processAssignment(assignmentId: string): Promise<void> {
    const assignment = await this.assignments.findOne({ where: { id: assignmentId } });
    if (!assignment || assignment.status !== 'pending') {
      return;
    }

    assignment.status = 'processing';
    await this.assignments.save(assignment);

    return runWithLlmUsageContext({ tenantId: assignment.tenantId }, async () => {
      try {
      const campaign = await this.campaigns.findOne({
        where: { id: assignment.campaignId, tenantId: assignment.tenantId },
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const profile =
        (await this.profiles.findOne({ where: { tenantId: assignment.tenantId } })) ??
        null;

      const productEntity = campaign.productId
        ? await this.products.findOne({
            where: { id: campaign.productId, tenantId: assignment.tenantId },
          })
        : null;
      const productContext = productEntity ? toProductContext(productEntity) : null;

      const generated = await this.strategyAdapter.generate({
        tenantId: assignment.tenantId,
        campaign: {
          id: campaign.id,
          name: campaign.name,
          objective: campaign.objective,
          platforms: campaign.platforms,
          totalBudget: campaign.totalBudget ? Number(campaign.totalBudget) : null,
        },
        companyProfile: {
          companyName: profile?.companyName ?? null,
          industry: profile?.industry ?? null,
          brandVoice: profile?.brandVoice ?? null,
          targetAudienceDesc:
            productContext?.targetAudience ?? profile?.targetAudienceDesc ?? null,
          objectives: profile?.objectives ?? null,
        },
        product: productContext
          ? {
              id: productContext.id,
              name: productContext.name,
              description: productContext.description,
              valueProposition: productContext.valueProposition,
              targetAudience: productContext.targetAudience,
              keywords: productContext.keywords,
              category: productContext.category,
            }
          : null,
      });

      await this.budgets.delete({ campaignId: campaign.id, proposedByAi: true });

      if (generated.budgets.length > 0) {
        await this.budgets.save(
          generated.budgets.map((item) =>
            this.budgets.create({
              campaignId: campaign.id,
              platform: item.platform,
              dailyBudget: String(item.dailyBudget),
              totalBudget: String(item.totalBudget),
              proposedByAi: true,
              approved: false,
            }),
          ),
        );
      }

      campaign.strategy = generated.strategy;
      await this.campaigns.save(campaign);

      assignment.status = 'completed';
      assignment.result = {
        strategy: generated.strategy,
        budgets: generated.budgets,
      };
      assignment.errorMessage = null;
    } catch (error) {
      assignment.status = 'failed';
      assignment.errorMessage =
        error instanceof Error ? error.message : 'Strategy generation failed';
      assignment.result = null;
    }

    await this.assignments.save(assignment);
    });
  }
}
