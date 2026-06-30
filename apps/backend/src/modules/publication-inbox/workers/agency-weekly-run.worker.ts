import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { QUEUE_AGENCY_WEEKLY_RUN } from '../../../shared/queue/queue.constants';
import { isProductOnboardingCompleted } from '../../product/domain/product-onboarding.util';
import { ProductEntity } from '../../product/infrastructure/typeorm/product.entity';
import { UserEntity } from '../../../shared/infrastructure/typeorm/user.entity';
import { TenantEntity } from '../../tenant/infrastructure/typeorm/tenant.entity';
import { AgencyOrchestrationService } from '../agency-orchestration.service';
import { AGENCY_NOTIFICATION_TYPES } from '../domain/publication-inbox.constants';
import { PublicationInboxService } from '../publication-inbox.service';

export interface AgencyWeeklyRunJobData {
  triggeredAt: string;
}

@Injectable()
export class AgencyWeeklyRunWorkerService implements OnModuleInit {
  private readonly logger = new Logger(AgencyWeeklyRunWorkerService.name);

  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenants: Repository<TenantEntity>,
    @InjectRepository(ProductEntity)
    private readonly products: Repository<ProductEntity>,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectQueue(QUEUE_AGENCY_WEEKLY_RUN)
    private readonly queue: Queue<AgencyWeeklyRunJobData>,
    private readonly orchestration: AgencyOrchestrationService,
    private readonly inboxService: PublicationInboxService,
  ) {}

  onModuleInit(): void {
    void this.queue
      .add(
        'weekly-run',
        { triggeredAt: new Date().toISOString() },
        {
          repeat: { pattern: '0 6 * * 1' },
          jobId: 'agency-weekly-run',
        },
      )
      .catch((error) => {
        this.logger.warn('Could not schedule agency weekly run job', error);
      });
  }

  async runWeeklyGeneration(): Promise<number> {
    const activeTenants = await this.tenants.find({
      where: { status: 'active' },
    });

    let processed = 0;

    for (const tenant of activeTenants) {
      try {
        const didRun = await this.runForTenant(tenant.id);
        if (didRun) processed += 1;
      } catch (error) {
        this.logger.warn(`Weekly agency run failed for tenant ${tenant.id}`, error);
      }
    }

    if (processed > 0) {
      this.logger.log(`Agency weekly run completed for ${processed} tenant(s)`);
    }

    return processed;
  }

  private async runForTenant(tenantId: string): Promise<boolean> {
    const onboardedProducts = await this.products.find({
      where: { tenantId, status: 'active' },
      order: { isPrimary: 'DESC', createdAt: 'ASC' },
    });

    const eligible = onboardedProducts.filter(isProductOnboardingCompleted);
    if (eligible.length === 0) {
      return false;
    }

    const author = await this.users.findOne({
      where: { tenantId },
      order: { createdAt: 'ASC' },
    });

    if (!author) {
      this.logger.warn(`No user found for tenant ${tenantId}, skipping weekly run`);
      return false;
    }

    let generatedTotal = 0;
    let imagesTotal = 0;
    const runSummaries: Array<Record<string, unknown>> = [];

    for (const product of eligible) {
      try {
        const run = await this.orchestration.runWeeklyForProduct(tenantId, author.id, product);
        generatedTotal += run.postsGenerated;
        imagesTotal += run.imagesAttached;
        if (run.postsGenerated > 0) {
          runSummaries.push({
            productId: run.productId,
            productName: run.productName,
            strategyId: run.strategyId,
            topicsUsed: run.topicsUsed,
            postsGenerated: run.postsGenerated,
            imagesAttached: run.imagesAttached,
          });
        }
      } catch (error) {
        this.logger.warn(`Weekly orchestration failed product=${product.id}`, error);
      }
    }

    if (generatedTotal === 0) {
      return false;
    }

    const weekKey = this.weekDedupKey();
    await this.inboxService.createNotification({
      tenantId,
      productId: eligible[0]?.id ?? null,
      type: AGENCY_NOTIFICATION_TYPES.WEEK_READY,
      title: 'Tu semana está lista',
      body: `La agencia analizó métricas, ajustó estrategia y generó ${generatedTotal} pieza(s)${imagesTotal > 0 ? ` con ${imagesTotal} imagen(es)` : ''} para revisar.`,
      metadata: {
        postsGenerated: generatedTotal,
        imagesAttached: imagesTotal,
        productCount: eligible.length,
        runs: runSummaries,
      },
      dedupKey: `week-ready-${weekKey}`,
    });

    return true;
  }

  private weekDedupKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const week = Math.ceil(
      ((now.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + new Date(year, 0, 1).getDay() + 1) /
        7,
    );
    return `${year}-W${week}`;
  }
}
