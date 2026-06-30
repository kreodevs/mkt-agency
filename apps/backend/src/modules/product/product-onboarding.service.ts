import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LlmClient } from '../../shared/ai/llm.client';
import { fetchPageContent, type PageMetadata } from '../../shared/web/page-content.util';
import { AgentInterviewService } from '../agents/agent-interview.service';
import { CompetitorIntelService } from '../agents/competitor-intel.service';
import { CommunityManagerService } from '../community-manager/community-manager.service';
import { DEFAULT_CM_PLATFORMS, DEFAULT_CM_POST_COUNT } from '../community-manager/domain/cm-platforms.constants';
import { CompetitorService } from '../competitors/competitor.service';
import {
  calculateProductOnboardingCompletion,
  getProductOnboardingFieldStatuses,
  getProductOnboardingMissing,
  isProductOnboardingCompleted,
  isProductOnboardingReady,
} from './domain/product-onboarding.util';
import {
  CompleteProductOnboardingResponseDto,
  ProductOnboardingAgentsDto,
  ProductOnboardingStatusDto,
  SuggestProductKeywordsResponseDto,
  InferProductFromPageResponseDto,
} from './dto/product-onboarding.dto';
import { ProductEntity } from './infrastructure/typeorm/product.entity';
import { ProductService } from './product.service';

@Injectable()
export class ProductOnboardingService {
  private readonly logger = new Logger(ProductOnboardingService.name);

  constructor(
    @InjectRepository(ProductEntity)
    private readonly products: Repository<ProductEntity>,
    private readonly productService: ProductService,
    private readonly llmClient: LlmClient,
    private readonly agentInterview: AgentInterviewService,
    private readonly competitorIntel: CompetitorIntelService,
    private readonly competitorService: CompetitorService,
    private readonly communityManager: CommunityManagerService,
  ) {}

  async getStatus(tenantId: string, productId: string): Promise<ProductOnboardingStatusDto> {
    const product = await this.productService.findOwnedEntity(tenantId, productId);
    return this.buildStatus(product);
  }

  async suggestKeywords(
    tenantId: string,
    productId: string,
    url?: string,
  ): Promise<SuggestProductKeywordsResponseDto> {
    const product = await this.productService.findOwnedEntity(tenantId, productId);
    const pageContent = await this.fetchProductPage(product, url);
    const keywords = await this.generateSemanticKeywords(product, pageContent);

    return {
      keywords,
      sourceUrl: pageContent.url,
      generatedFromPage: true,
    };
  }

  async inferFromPage(
    tenantId: string,
    productId: string,
    url?: string,
  ): Promise<InferProductFromPageResponseDto> {
    const product = await this.productService.findOwnedEntity(tenantId, productId);
    const page = await this.fetchProductPage(product, url);
    const inferred = await this.inferProductProfile(product, page);

    product.name = inferred.name?.trim() || product.name;
    product.category = inferred.category ?? product.category;
    product.description = inferred.description ?? product.description;
    product.valueProposition = inferred.valueProposition ?? product.valueProposition;
    product.targetAudience = inferred.targetAudience ?? product.targetAudience;
    product.priceRange = inferred.priceRange ?? product.priceRange;
    product.keywords = inferred.keywords?.length ? inferred.keywords : product.keywords;
    product.websiteUrl = page.url;
    await this.products.save(product);

    return {
      ...inferred,
      sourceUrl: page.url,
      inferredFromPage: true,
    };
  }

  private async fetchProductPage(
    product: ProductEntity,
    url?: string,
  ): Promise<Awaited<ReturnType<typeof fetchPageContent>>> {
    const targetUrl = url?.trim() || product.websiteUrl?.trim() || '';

    if (!targetUrl) {
      throw new BadRequestException({
        error: 'Indica la URL de la página del producto',
        code: 'VALIDATION_ERROR',
      });
    }

    try {
      const pageContent = await fetchPageContent(targetUrl);
      if (product.websiteUrl !== pageContent.url) {
        product.websiteUrl = pageContent.url;
        await this.products.save(product);
      }
      return pageContent;
    } catch (error) {
      this.logger.warn(`Page fetch failed for product ${product.id}`, error);
      throw new BadRequestException({
        error: 'No se pudo acceder a la página del producto. Verifica la URL.',
        code: 'FETCH_ERROR',
      });
    }
  }

  private async inferProductProfile(
    product: ProductEntity,
    page: Awaited<ReturnType<typeof fetchPageContent>>,
  ): Promise<Omit<InferProductFromPageResponseDto, 'sourceUrl' | 'inferredFromPage'>> {
    if (!(await this.llmClient.isConfigured())) {
      return this.stubInferredProfile(product, page);
    }

    const systemPrompt =
      'Eres consultor de marketing para PYMEs en México. Analiza la página de un producto o servicio ' +
      'e infiere cómo lo describiría un dueño de negocio que NO tiene claro su propuesta de valor. ' +
      'Redacta en español claro, concreto y orientado a ventas. ' +
      'NO copies meta tags ni textos legales del footer. Responde SOLO JSON válido.';

    const userPrompt = JSON.stringify({
      task: 'Inferir perfil comercial del producto para onboarding',
      currentProductName: product.name,
      pageReference: { url: page.url, metadata: page.metadata },
      pageTextSample: page.text.slice(0, 12000),
      outputFormat: {
        name: 'nombre comercial sugerido',
        category: 'physical|digital|service|subscription|other',
        description: '2-3 frases: qué es y qué problema resuelve',
        valueProposition: 'por qué elegir este producto frente a alternativas',
        targetAudience: 'cliente ideal en México',
        priceRange: 'rango estimado en MXN o null si no hay pistas',
        keywords: ['8-12 tags SEO para buscar competidores'],
      },
    });

    try {
      const result = await this.llmClient.chatJson<{
        name?: string;
        category?: string;
        description?: string;
        valueProposition?: string;
        targetAudience?: string;
        priceRange?: string | null;
        keywords?: string[];
      }>(systemPrompt, userPrompt, { taskType: 'brand_interview', temperature: 0.45 });

      return {
        name: result.name?.trim() || product.name,
        category: this.normalizeCategory(result.category),
        description: result.description?.trim() || null,
        valueProposition: result.valueProposition?.trim() || null,
        targetAudience: result.targetAudience?.trim() || null,
        priceRange: result.priceRange?.trim() || null,
        keywords: this.normalizeKeywords(result.keywords ?? []),
      };
    } catch (error) {
      this.logger.warn('Product profile inference failed, using fallback', error);
      return this.stubInferredProfile(product, page);
    }
  }

  private stubInferredProfile(
    product: ProductEntity,
    page: Awaited<ReturnType<typeof fetchPageContent>>,
  ): Omit<InferProductFromPageResponseDto, 'sourceUrl' | 'inferredFromPage'> {
    const title = page.metadata.title ?? page.metadata.ogTitle ?? product.name;
    const blurb =
      page.metadata.ogDescription ??
      page.metadata.metaDescription ??
      page.text.slice(0, 280);

    return {
      name: title?.trim() || product.name,
      category: product.category ?? 'service',
      description: blurb.trim() || null,
      valueProposition: blurb.trim() || null,
      targetAudience: 'Pequeñas y medianas empresas en México que buscan esta solución.',
      priceRange: null,
      keywords: this.stubKeywordsFromPage(product, page),
    };
  }

  private normalizeCategory(value?: string | null): string | null {
    const allowed = new Set(['physical', 'digital', 'service', 'subscription', 'other']);
    const normalized = value?.trim().toLowerCase() ?? '';
    return allowed.has(normalized) ? normalized : 'service';
  }

  private async generateSemanticKeywords(
    product: ProductEntity,
    page: Awaited<ReturnType<typeof fetchPageContent>>,
  ): Promise<string[]> {
    if (!(await this.llmClient.isConfigured())) {
      return this.stubKeywordsFromPage(product, page);
    }

    const systemPrompt =
      'Eres un analista de inteligencia competitiva y SEO semántico para PYMEs. ' +
      'A partir del contenido de una página de producto/servicio, infiere el concepto de negocio, ' +
      'problema que resuelve, audiencia y categoría de mercado. ' +
      'NO copies literalmente meta keywords, title tags ni listas SEO del HTML. ' +
      'Genera términos de búsqueda que un cliente usaría para encontrar competidores directos. ' +
      'Responde SOLO JSON válido: { "keywords": ["tag1", "tag2"] }';

    const userPrompt = JSON.stringify({
      task: 'Generar entre 8 y 15 tags SEO en español (1-4 palabras) para descubrir competidores',
      productContext: {
        name: product.name,
        category: product.category,
        description: product.description,
        valueProposition: product.valueProposition,
        targetAudience: product.targetAudience,
      },
      pageReference: {
        url: page.url,
        metadata: page.metadata,
        note: 'Los metadatos son referencia; prioriza el significado del contenido visible',
      },
      pageTextSample: page.text.slice(0, 12000),
      rules: [
        'Inferir concepto y categoría, no repetir meta keywords del sitio',
        'Incluir sinónimos, verticales y casos de uso',
        'Evitar el nombre de marca del producto como tag principal',
      ],
    });

    try {
      const result = await this.llmClient.chatJson<{ keywords: string[] }>(
        systemPrompt,
        userPrompt,
        { taskType: 'competitor_discovery', temperature: 0.45 },
      );

      const keywords = this.normalizeKeywords(result.keywords ?? []);
      if (keywords.length >= 3) {
        return keywords;
      }
    } catch (error) {
      this.logger.warn('Semantic keyword generation failed, using fallback', error);
    }

    return this.stubKeywordsFromPage(product, page);
  }

  private normalizeKeywords(raw: string[]): string[] {
    return [...new Set(raw.map((k) => String(k).trim()).filter(Boolean))].slice(0, 15);
  }

  private stubKeywordsFromPage(
    product: ProductEntity,
    page: Awaited<ReturnType<typeof fetchPageContent>>,
  ): string[] {
    const fromMeta = this.extractConceptHints(page.metadata);
    const fromText = page.text
      .split(/\s+/)
      .filter((w) => w.length > 4)
      .slice(0, 5);

    const base = [
      product.name,
      product.category ?? '',
      ...fromMeta,
      ...fromText,
      ...(product.description?.split(/\s+/).slice(0, 4) ?? []),
    ]
      .map((s) => s.trim())
      .filter(Boolean);

    return this.normalizeKeywords(base);
  }

  private extractConceptHints(metadata: PageMetadata): string[] {
    const hints: string[] = [];
    const fields = [
      metadata.ogDescription,
      metadata.metaDescription,
      metadata.ogTitle,
      metadata.title,
    ];
    for (const field of fields) {
      if (!field) continue;
      const words = field
        .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 4)
        .slice(0, 3);
      hints.push(...words);
    }
    return hints;
  }

  async complete(
    tenantId: string,
    productId: string,
    userId: string,
  ): Promise<CompleteProductOnboardingResponseDto> {
    const product = await this.productService.findOwnedEntity(tenantId, productId);

    if (!isProductOnboardingReady(product)) {
      throw new BadRequestException({
        error: 'Completa todos los campos obligatorios del onboarding de producto',
        code: 'VALIDATION_ERROR',
        missingFields: getProductOnboardingMissing(product),
      });
    }

    product.metadata = {
      ...product.metadata,
      onboardingCompletedAt: new Date().toISOString(),
    };
    await this.products.save(product);

    const agents = await this.triggerAgents(tenantId, productId, userId);

    return {
      product: {
        id: product.id,
        name: product.name,
        onboardingCompleted: true,
        completionPercentage: calculateProductOnboardingCompletion(product),
      },
      agents,
    };
  }

  private async triggerAgents(
    tenantId: string,
    productId: string,
    userId: string,
  ): Promise<ProductOnboardingAgentsDto> {
    const result: ProductOnboardingAgentsDto = {
      skippedAgents: [],
      warnings: [],
    };

    try {
      const interview = await this.agentInterview.createInterview(
        tenantId,
        'brand_interview',
        productId,
      );
      result.brandInterviewId = interview.id;
    } catch (error) {
      if (error instanceof ConflictException) {
        const body = error.getResponse() as { interviewId?: string };
        result.brandInterviewId = body.interviewId ?? null;
        result.warnings?.push('Ya había una entrevista Brand Analyst en progreso.');
      } else {
        result.skippedAgents?.push('brand_interview');
        result.warnings?.push('No se pudo iniciar Brand Analyst.');
        this.logger.warn('Brand interview trigger failed', error);
      }
    }

    try {
      const discovery = await this.competitorService.discover(tenantId, {
        scope: 'global',
        productId,
      });
      if (discovery.items.length > 0) {
        const bulk = await this.competitorService.bulkCreate(tenantId, {
          items: discovery.items.slice(0, 8).map((item) => ({
            name: item.name,
            website: item.website ?? undefined,
            industry: item.industry ?? undefined,
          })),
        });
        result.competitorsDiscovered = bulk.created.length;
      }
    } catch (error) {
      result.warnings?.push('Descubrimiento de competidores omitido o sin resultados.');
      this.logger.warn('Competitor discovery failed', error);
    }

    try {
      const analysis = await this.competitorIntel.triggerAnalysis(tenantId);
      result.competitorAnalysisId = analysis.id;
    } catch (error) {
      if (error instanceof ConflictException) {
        const body = error.getResponse() as { analysisId?: string };
        result.competitorAnalysisId = body.analysisId ?? null;
      } else {
        result.skippedAgents?.push('competitor_intel');
        result.warnings?.push('No se pudo iniciar Competitor Intel.');
        this.logger.warn('Competitor intel trigger failed', error);
      }
    }

    try {
      const prefs = await this.communityManager.getPreferences(tenantId);
      const generated = await this.communityManager.generate(tenantId, userId, {
        platforms: prefs.platforms.length > 0 ? prefs.platforms : [...DEFAULT_CM_PLATFORMS],
        count: prefs.count ?? DEFAULT_CM_POST_COUNT,
        productId,
      });
      result.communityManagerBatchId = generated.id;
    } catch (error) {
      result.skippedAgents?.push('community_manager');
      result.warnings?.push('No se pudo generar copy del Community Manager.');
      this.logger.warn('Community manager trigger failed', error);
    }

    return result;
  }

  private buildStatus(product: ProductEntity): ProductOnboardingStatusDto {
    const fields = getProductOnboardingFieldStatuses(product);
    return {
      productId: product.id,
      productName: product.name,
      completionPercentage: calculateProductOnboardingCompletion(product),
      ready: isProductOnboardingReady(product),
      completed: isProductOnboardingCompleted(product),
      missingFields: getProductOnboardingMissing(product),
      fields,
    };
  }
}
