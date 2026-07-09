import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../../product/infrastructure/typeorm/product.entity';
import { TenantEntity } from '../../tenant/infrastructure/typeorm/tenant.entity';
import { isProductOnboardingCompleted } from '../../product/domain/product-onboarding.util';
import { AgentRole } from '../domain/agent-role.enum';
import { AgentEventService } from './agent-event.service';
import { AnalyticsAgentService } from './analytics-agent.service';
import { OperatingProfileService } from './operating-profile.service';

export interface WeeklyBalanceResult {
  tenantId: string;
  productsProcessed: number;
  reportsPublished: number;
  anomalies: number;
}

@Injectable()
export class WeeklyBalanceService {
  private readonly logger = new Logger(WeeklyBalanceService.name);

  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenants: Repository<TenantEntity>,
    @InjectRepository(ProductEntity)
    private readonly products: Repository<ProductEntity>,
    private readonly operatingProfile: OperatingProfileService,
    private readonly analytics: AnalyticsAgentService,
    private readonly agentEvents: AgentEventService,
  ) {}

  async runForAllTenants(): Promise<number> {
    const active = await this.tenants.find({ where: { status: 'active' } });
    let count = 0;
    for (const tenant of active) {
      try {
        const result = await this.runForTenant(tenant.id);
        if (result.reportsPublished > 0) count += 1;
      } catch (error) {
        this.logger.warn(`Weekly balance failed tenant=${tenant.id}`, error);
      }
    }
    return count;
  }

  async runForTenant(tenantId: string): Promise<WeeklyBalanceResult> {
    const result: WeeklyBalanceResult = {
      tenantId,
      productsProcessed: 0,
      reportsPublished: 0,
      anomalies: 0,
    };

    const profile = await this.operatingProfile.getProfile(tenantId);
    const eligible = (await this.products.find({ where: { tenantId, status: 'active' } })).filter(
      isProductOnboardingCompleted,
    );

    for (const product of eligible) {
      result.productsProcessed += 1;

      const summary = await this.analytics.publishPerformanceReport(tenantId, product.id);
      result.reportsPublished += 1;

      const anomalies = await this.analytics.detectAnomalies(tenantId, product.id);
      result.anomalies += anomalies.length;

      for (const alert of anomalies) {
        await this.agentEvents.logIfAgentActive(AgentRole.ANALYTICS, {
          tenantId,
          productId: product.id,
          sourceAgent: AgentRole.ANALYTICS,
          targetAgent: AgentRole.STRATEGIST,
          eventType: 'AnomalyDetected',
          payload: alert as unknown as Record<string, unknown>,
        });
      }

      if (this.operatingProfile.isGrowthProfile(profile)) {
        await this.agentEvents.logIfAgentActive(AgentRole.STRATEGIST, {
          tenantId,
          productId: product.id,
          sourceAgent: AgentRole.STRATEGIST,
          eventType: 'WeeklyBalance',
          payload: {
            performance: summary,
            anomalies,
            recommendation:
              anomalies.length > 0
                ? 'Revisar ángulos creativos y canales orgánicos'
                : 'Mantener estrategia actual',
          },
        });
      }
    }

    await this.agentEvents.log({
      tenantId,
      sourceAgent: AgentRole.ANALYTICS,
      eventType: 'WeeklyBalance',
      payload: result as unknown as Record<string, unknown>,
    });

    return result;
  }
}
