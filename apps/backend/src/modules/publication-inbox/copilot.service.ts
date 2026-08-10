import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompetitorIntelService } from '../agents/competitor-intel.service';
import { CompetitorService } from '../competitors/competitor.service';
import { CmCharacterService } from '../community-manager/cm-character.service';
import { ProductService } from '../product/product.service';
import { isProductOnboardingCompleted } from '../product/domain/product-onboarding.util';
import { ProductEntity } from '../product/infrastructure/typeorm/product.entity';
import { CampaignTemplateSuggestionService } from '../agency-agents/services/campaign-template-suggestion.service';
import type { CopilotStatusResponseDto } from './dto/publication-inbox.dto';
import { PublicationInboxService } from './publication-inbox.service';

@Injectable()
export class CopilotService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly products: Repository<ProductEntity>,
    private readonly productService: ProductService,
    private readonly competitorService: CompetitorService,
    private readonly competitorIntel: CompetitorIntelService,
    private readonly inboxService: PublicationInboxService,
    private readonly cmCharacter: CmCharacterService,
    private readonly templateSuggestions: CampaignTemplateSuggestionService,
  ) {}

  async getStatus(tenantId: string, productId?: string): Promise<CopilotStatusResponseDto> {
    const product = await this.resolveProduct(tenantId, productId);
    const onboardingCompleted = isProductOnboardingCompleted(product);

    const [competitors, latestAnalysis, inbox, cmLibrary, campaignTemplates] = await Promise.all([
      this.competitorService.list(tenantId),
      this.competitorIntel.getLatestCompletedAnalysis(tenantId),
      this.inboxService.getInbox(tenantId, product.id),
      this.cmCharacter.listLibrary(tenantId, product.id),
      this.templateSuggestions.suggestForProduct(tenantId, product.id, 2),
    ]);

    const pendingAnalysis = await this.competitorIntel.listAnalyses(tenantId);
    const inFlight = pendingAnalysis.find(
      (row) => row.status === 'pending' || row.status === 'processing',
    );

    const analysisStatus = inFlight
      ? inFlight.status
      : latestAnalysis
        ? latestAnalysis.status
        : 'none';

    let nextStep = 'Revisa y publica lo que ya está listo';
    let canPrepareWeek = onboardingCompleted;
    let prepareBlockedReason: string | null = null;

    if (!onboardingCompleted) {
      nextStep = 'Completa el onboarding de tu producto';
      canPrepareWeek = false;
      prepareBlockedReason =
        'Termina el wizard de producto (descripción, audiencia y tags SEO).';
    } else if (cmLibrary.readyCount === 0) {
      nextStep =
        'Configura al menos una CM virtual en tu biblioteca (retrato + vista previa)';
      canPrepareWeek = false;
      prepareBlockedReason =
        cmLibrary.characters.length > 0
          ? 'Completa retrato y vista previa en al menos una CM de tu biblioteca.'
          : 'Crea una CM virtual y completa retrato + vista previa.';
    } else if (inbox.stats.readyCount > 0) {
      nextStep = `Copia y pega ${inbox.stats.readyCount} publicación(es) listas`;
    } else if (inbox.stats.pendingCount > 0) {
      nextStep = `Aprueba ${inbox.stats.pendingCount} borrador(es) sugeridos`;
    } else if (competitors.items.length < 2) {
      nextStep = 'Prepara tu semana (descubrirá competidores y generará posts)';
    } else if (!latestAnalysis || latestAnalysis.status !== 'completed') {
      nextStep = 'Prepara tu semana (analizará competencia y generará posts)';
    } else if (inbox.stats.upcomingCount === 0 && inbox.stats.pendingCount === 0) {
      nextStep = 'Prepara tu semana con el copiloto';
    }

    return {
      productId: product.id,
      productName: product.name,
      onboardingCompleted,
      competitorsCount: competitors.items.length,
      analysisStatus,
      analysisUpdatedAt: latestAnalysis?.updatedAt.toISOString() ?? null,
      inbox: inbox.stats,
      nextStep,
      canPrepareWeek,
      cmCharacterReady: cmLibrary.readyCount > 0,
      cmCharacterStatus:
        cmLibrary.readyCount > 0
          ? `${cmLibrary.readyCount}/${cmLibrary.characters.length} listas`
          : cmLibrary.characters.length > 0
            ? 'pendiente'
            : 'sin configurar',
      cmCharactersReadyCount: cmLibrary.readyCount,
      cmCharactersTotalCount: cmLibrary.characters.length,
      prepareBlockedReason,
      campaignTemplateSuggestions: campaignTemplates,
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
        error: 'No hay producto activo. Crea uno en Mi producto.',
        code: 'NOT_FOUND',
      });
    }

    return first;
  }
}
