import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompetitorIntelService } from '../agents/competitor-intel.service';
import { CmCharacterService } from '../community-manager/cm-character.service';
import { CompetitorService } from '../competitors/competitor.service';
import { inferDiscoveryScope } from '../competitors/domain/competitor-discovery-context.util';
import { ProductService } from '../product/product.service';
import { isProductOnboardingCompleted } from '../product/domain/product-onboarding.util';
import { ProductEntity } from '../product/infrastructure/typeorm/product.entity';
import { AgencyOrchestrationService } from './agency-orchestration.service';
import { AGENCY_NOTIFICATION_TYPES } from './domain/publication-inbox.constants';
import { OwnerNotificationService } from './services/owner-notification.service';
import { PublicationInboxService } from './publication-inbox.service';
import type { PrepareWeekResponseDto } from './dto/publication-inbox.dto';
import {
  copilotHorizonLabel,
  type CopilotPrepareHorizon,
} from './domain/publication-inbox.constants';
import { todayDateKey } from '../../shared/domain/date-key.util';

const COPILOT_INTEL_WAIT_MS = 120_000;
const MIN_COMPETITORS_FOR_INTEL = 2;

@Injectable()
export class CopilotOrchestrationService {
  private readonly logger = new Logger(CopilotOrchestrationService.name);

  constructor(
    @InjectRepository(ProductEntity)
    private readonly products: Repository<ProductEntity>,
    private readonly productService: ProductService,
    private readonly competitorService: CompetitorService,
    private readonly competitorIntel: CompetitorIntelService,
    private readonly agencyOrchestration: AgencyOrchestrationService,
    private readonly inboxService: PublicationInboxService,
    private readonly cmCharacter: CmCharacterService,
    private readonly ownerNotifications: OwnerNotificationService,
  ) {}

  async prepareWeek(
    tenantId: string,
    userId: string,
    productId?: string,
    horizon: CopilotPrepareHorizon = 'week',
  ): Promise<PrepareWeekResponseDto> {
    const product = await this.resolveProduct(tenantId, productId);
    const warnings: string[] = [];
    const horizonLabel = copilotHorizonLabel(horizon);

    if (!isProductOnboardingCompleted(product)) {
      return {
        status: 'blocked',
        horizon,
        message: `Completa el onboarding del producto antes de preparar tu ${horizonLabel}.`,
        productId: product.id,
        productName: product.name,
        postsGenerated: 0,
        imagesAttached: 0,
        warnings,
      };
    }

    if (!(await this.cmCharacter.hasAnyReadyCharacter(tenantId, product.id))) {
      return {
        status: 'blocked',
        horizon,
        message:
          `Configura al menos una CM virtual (retrato + vista previa) antes de preparar tu ${horizonLabel}.`,
        productId: product.id,
        productName: product.name,
        postsGenerated: 0,
        imagesAttached: 0,
        warnings,
      };
    }

    const competitorsBefore = await this.competitorService.list(tenantId);
    if (competitorsBefore.items.length < MIN_COMPETITORS_FOR_INTEL) {
      try {
        const scopeHint = inferDiscoveryScope(product.targetAudience);
        const discovery = await this.competitorService.discover(tenantId, {
          scope: scopeHint.scope,
          country: scopeHint.country,
          city: scopeHint.city,
          productId: product.id,
        });
        if (discovery.items.length > 0) {
          await this.competitorService.bulkCreate(tenantId, {
            items: discovery.items.slice(0, 8).map((item) => ({
              name: item.name,
              website: item.website ?? undefined,
              industry: item.industry ?? undefined,
            })),
          });
        }
      } catch (error) {
        warnings.push('No se pudieron descubrir competidores; se continúa con el contexto disponible.');
        this.logger.warn('Copilot competitor discovery skipped', error);
      }
    }

    const latestCompleted = await this.competitorIntel.getLatestCompletedAnalysis(tenantId);
    const needsFreshAnalysis =
      !latestCompleted ||
      Date.now() - latestCompleted.updatedAt.getTime() > 7 * 24 * 60 * 60 * 1000;

    if (needsFreshAnalysis) {
      let analysisId: string | null = null;
      try {
        const started = await this.competitorIntel.triggerAnalysis(tenantId);
        analysisId = started.id;
      } catch (error) {
        if (error && typeof error === 'object' && 'getResponse' in error) {
          const body = (error as { getResponse: () => unknown }).getResponse() as {
            analysisId?: string;
          };
          analysisId = body.analysisId ?? null;
        }
        if (!analysisId) {
          warnings.push('Competitor Intel no disponible; el copy usará contexto parcial.');
        }
      }

      if (analysisId) {
        try {
          const finished = await this.competitorIntel.waitForAnalysisCompletion(
            tenantId,
            analysisId,
            { timeoutMs: COPILOT_INTEL_WAIT_MS },
          );
          if (finished.status === 'failed') {
            warnings.push('El análisis de competidores falló; revisa competidores registrados.');
          } else if (finished.status !== 'completed') {
            warnings.push('El análisis sigue en proceso; puedes regenerar más tarde.');
          }
        } catch (error) {
          warnings.push('Tiempo de espera agotado para análisis de competidores.');
          this.logger.warn('Copilot intel wait failed', error);
        }
      }
    }

    const run = await this.agencyOrchestration.runWeeklyForProduct(
      tenantId,
      userId,
      product,
      horizon,
    );

    if (run.postsGenerated > 0) {
      const readyTitle =
        horizon === 'day' ? 'Tu día está listo' : 'Tu semana está lista';
      const readyBody =
        horizon === 'day'
          ? `Tu copiloto generó ${run.postsGenerated} publicación(es) de prueba${run.imagesAttached > 0 ? ` con ${run.imagesAttached} visual(es)` : ''} para validar el pipeline.`
          : `Tu copiloto generó ${run.postsGenerated} publicación(es)${run.imagesAttached > 0 ? ` con ${run.imagesAttached} visual(es)` : ''} para revisar y copiar.`;

      await this.inboxService.createNotification({
        tenantId,
        productId: product.id,
        type: AGENCY_NOTIFICATION_TYPES.WEEK_READY,
        title: readyTitle,
        body: readyBody,
        metadata: {
          postsGenerated: run.postsGenerated,
          imagesAttached: run.imagesAttached,
          source: 'copilot-prepare-week',
          horizon,
          strategyId: run.strategyId,
        },
        dedupKey: `copilot-${horizon}-${product.id}-${this.todayKey()}`,
      });

      if (horizon === 'week') {
        await this.ownerNotifications.notifyWeekReady(
          tenantId,
          run.postsGenerated,
          product.name,
        );
      }
    }

    return {
      status: run.postsGenerated > 0 ? 'completed' : 'empty',
      horizon,
      message:
        run.postsGenerated > 0
          ? `${run.postsGenerated} publicación(es) lista(s) para revisar.`
          : 'No se generaron publicaciones nuevas. Revisa configuración LLM o el producto.',
      productId: product.id,
      productName: product.name,
      postsGenerated: run.postsGenerated,
      imagesAttached: run.imagesAttached,
      strategyId: run.strategyId,
      topicsUsed: run.topicsUsed,
      warnings,
    };
  }

  private async resolveProduct(tenantId: string, productId?: string): Promise<ProductEntity> {
    if (productId) {
      return this.productService.findOwnedEntity(tenantId, productId);
    }

    const primary = await this.productService.findPrimary(tenantId);
    if (primary) {
      return primary;
    }

    const first = await this.products.findOne({
      where: { tenantId, status: 'active' },
      order: { createdAt: 'ASC' },
    });

    if (!first) {
      throw new NotFoundException({
        error: 'No hay producto activo para preparar la semana',
        code: 'NOT_FOUND',
      });
    }

    return first;
  }

  private todayKey(): string {
    return todayDateKey();
  }
}
