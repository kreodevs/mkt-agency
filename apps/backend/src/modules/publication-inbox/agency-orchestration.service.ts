import { Injectable, Logger } from '@nestjs/common';
import { DEFAULT_CM_PLATFORMS } from '../community-manager/domain/cm-platforms.constants';
import { CommunityManagerService } from '../community-manager/community-manager.service';
import { ProductEntity } from '../product/infrastructure/typeorm/product.entity';
import { StrategyService } from '../strategy/strategy.service';
import { WEEKLY_CM_POST_COUNT } from './domain/publication-inbox.constants';

export interface WeeklyProductRunResult {
  productId: string;
  productName: string;
  strategyId: string | null;
  strategyStatus: string | null;
  topicsUsed: string[];
  postsGenerated: number;
  imagesAttached: number;
}

@Injectable()
export class AgencyOrchestrationService {
  private readonly logger = new Logger(AgencyOrchestrationService.name);

  constructor(
    private readonly strategyService: StrategyService,
    private readonly communityManager: CommunityManagerService,
  ) {}

  async runWeeklyForProduct(
    tenantId: string,
    userId: string,
    product: ProductEntity,
  ): Promise<WeeklyProductRunResult> {
    const result: WeeklyProductRunResult = {
      productId: product.id,
      productName: product.name,
      strategyId: null,
      strategyStatus: null,
      topicsUsed: [],
      postsGenerated: 0,
      imagesAttached: 0,
    };

    try {
      const strategy = await this.strategyService.triggerAnalysis(tenantId, {
        productId: product.id,
        autoApplyContentSuggestions: true,
      });
      result.strategyId = strategy.id;
      result.strategyStatus = strategy.status;

      if (strategy.status === 'ready' || strategy.status === 'applied') {
        result.topicsUsed = await this.strategyService.extractTopicsForContentGeneration(
          tenantId,
          strategy.id,
        );
      }
    } catch (error) {
      this.logger.warn(`Strategy step failed for product ${product.id}`, error);
    }

    const prefs = await this.communityManager.getPreferences(tenantId);

    try {
      const cmResult = await this.communityManager.generate(tenantId, userId, {
        platforms: prefs.platforms.length > 0 ? prefs.platforms : [...DEFAULT_CM_PLATFORMS],
        count: WEEKLY_CM_POST_COUNT,
        productId: product.id,
        topics: result.topicsUsed.length > 0 ? result.topicsUsed : undefined,
        attachImages: true,
      });

      if (cmResult.status === 'completed') {
        result.postsGenerated = cmResult.postsGenerated ?? WEEKLY_CM_POST_COUNT;
        result.imagesAttached = cmResult.imagesAttached ?? 0;
      }
    } catch (error) {
      this.logger.warn(`CM step failed for product ${product.id}`, error);
    }

    return result;
  }
}
