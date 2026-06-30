import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LlmProviderService } from '../../shared/ai/llm-provider.service';
import { AgentInterviewEntity } from '../agents/domain/agent-interview.entity';
import { CompanyProfileService } from '../company-profile/company-profile.service';
import { CompanyProfileEntity } from '../company-profile/infrastructure/typeorm/company-profile.entity';
import { CompanyProfileSectionEntity } from '../company-profile/infrastructure/typeorm/company-profile-section.entity';
import { ProfileSectionSyncService } from '../company-profile/services/profile-section-sync.service';
import {
  COMPETITOR_DISCOVERY_ADAPTER,
  CompetitorDiscoveryAdapterPort,
} from './adapters/competitor-discovery.adapter.port';
import type { MentionSentiment } from './domain/competitor.constants';
import {
  filterIrrelevantCompetitors,
  formatIndustryLabel,
  hasMinimalDiscoveryContext,
} from './domain/competitor-discovery-context.util';
import {
  productSummaryForDiscovery,
  toProductContext,
} from '../product/domain/product-context.util';
import { ProductService } from '../product/product.service';
import {
  BulkCreateCompetitorsDto,
  CreateCompetitorDto,
  DiscoverCompetitorsDto,
  ListMentionsQueryDto,
} from './dto/competitor.request.dto';
import {
  BulkCreateCompetitorsResponseDto,
  CompetitorListResponseDto,
  CompetitorMentionResponseDto,
  CompetitorResponseDto,
  DiscoverCompetitorsResponseDto,
  PaginatedMentionsResponseDto,
} from './dto/competitor.response.dto';
import { CompetitorMentionEntity } from './infrastructure/typeorm/competitor-mention.entity';
import { CompetitorEntity } from './infrastructure/typeorm/competitor.entity';

@Injectable()
export class CompetitorService {
  constructor(
    @InjectRepository(CompetitorEntity)
    private readonly competitors: Repository<CompetitorEntity>,
    @InjectRepository(CompetitorMentionEntity)
    private readonly mentions: Repository<CompetitorMentionEntity>,
    @InjectRepository(CompanyProfileEntity)
    private readonly profiles: Repository<CompanyProfileEntity>,
    @InjectRepository(CompanyProfileSectionEntity)
    private readonly profileSections: Repository<CompanyProfileSectionEntity>,
    @InjectRepository(AgentInterviewEntity)
    private readonly interviews: Repository<AgentInterviewEntity>,
    @Inject(COMPETITOR_DISCOVERY_ADAPTER)
    private readonly discoveryAdapter: CompetitorDiscoveryAdapterPort,
    private readonly companyProfile: CompanyProfileService,
    private readonly productService: ProductService,
    private readonly profileSectionSync: ProfileSectionSyncService,
  ) {}

  async list(tenantId: string): Promise<CompetitorListResponseDto> {
    const items = await this.competitors.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });

    return { items: items.map((item) => this.toCompetitorResponse(item)) };
  }

  async create(
    tenantId: string,
    dto: CreateCompetitorDto,
  ): Promise<CompetitorResponseDto> {
    const saved = await this.competitors.save(
      this.competitors.create({
        tenantId,
        name: dto.name.trim(),
        website: dto.website?.trim() ?? null,
        industry: dto.industry?.trim() ?? null,
      }),
    );

    await this.seedDemoMentions(saved);
    await this.syncProfileCompetitorsText(tenantId);

    return this.toCompetitorResponse(saved);
  }

  async bulkCreate(
    tenantId: string,
    dto: BulkCreateCompetitorsDto,
  ): Promise<BulkCreateCompetitorsResponseDto> {
    const existing = await this.competitors.find({ where: { tenantId } });
    const existingNames = new Set(existing.map((item) => item.name.trim().toLowerCase()));

    const created: CompetitorResponseDto[] = [];
    let skipped = 0;

    for (const item of dto.items) {
      const name = item.name.trim();
      const key = name.toLowerCase();
      if (!name || existingNames.has(key)) {
        skipped += 1;
        continue;
      }

      const saved = await this.competitors.save(
        this.competitors.create({
          tenantId,
          name,
          website: item.website?.trim() ?? null,
          industry: item.industry?.trim() ?? null,
        }),
      );
      await this.seedDemoMentions(saved);
      existingNames.add(key);
      created.push(this.toCompetitorResponse(saved));
    }

    if (created.length > 0) {
      await this.syncProfileCompetitorsText(tenantId);
    }

    return { created, skipped };
  }

  async discover(
    tenantId: string,
    dto: DiscoverCompetitorsDto,
  ): Promise<DiscoverCompetitorsResponseDto> {
    const country = dto.country?.trim() ?? null;
    const city = dto.city?.trim() ?? null;

    if (dto.scope === 'country' && !country) {
      throw new BadRequestException({
        error: 'Indica el país para la búsqueda',
        code: 'BAD_REQUEST',
      });
    }
    if (dto.scope === 'city' && (!country || !city)) {
      throw new BadRequestException({
        error: 'Indica país y ciudad para la búsqueda',
        code: 'BAD_REQUEST',
      });
    }

    const discoveryContext = await this.buildDiscoveryContext(tenantId, dto);
    const rawItems = await this.discoveryAdapter.discover(discoveryContext);
    const items = filterIrrelevantCompetitors(discoveryContext, rawItems);

    if (items.length === 0) {
      throw new BadRequestException({
        error:
          'No se encontraron competidores relevantes para tu sector. Completa el onboarding o el Brand Brief y vuelve a intentar.',
        code: 'NO_RELEVANT_COMPETITORS',
      });
    }

    return {
      scope: discoveryContext.scope,
      country: discoveryContext.country ?? null,
      city: discoveryContext.city ?? null,
      items: items.map((item) => ({
        name: item.name,
        website: item.website ?? null,
        industry: item.industry ?? null,
        rationale: item.rationale ?? null,
      })),
    };
  }

  async buildCompetitorsText(tenantId: string): Promise<string> {
    const items = await this.competitors.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
    if (items.length === 0) {
      return '';
    }
    return items
      .map((item) => {
        const parts = [item.name];
        if (item.website) parts.push(item.website);
        if (item.industry) parts.push(item.industry);
        return parts.join(' — ');
      })
      .join('\n');
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const competitor = await this.findOwnedCompetitor(tenantId, id);
    await this.competitors.remove(competitor);
    await this.syncProfileCompetitorsText(tenantId);
  }

  async listMentions(
    tenantId: string,
    competitorId: string,
    query: ListMentionsQueryDto,
    page = 1,
    limit = 20,
  ): Promise<PaginatedMentionsResponseDto> {
    await this.findOwnedCompetitor(tenantId, competitorId);

    const qb = this.mentions
      .createQueryBuilder('mention')
      .where('mention.competitor_id = :competitorId', { competitorId })
      .orderBy('mention.mentioned_at', 'DESC', 'NULLS LAST')
      .addOrderBy('mention.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.sentiment) {
      qb.andWhere('mention.sentiment = :sentiment', {
        sentiment: query.sentiment,
      });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((item) => this.toMentionResponse(item)),
      total,
      page,
      limit,
    };
  }

  private async buildDiscoveryContext(
    tenantId: string,
    dto: DiscoverCompetitorsDto,
  ) {
    const country = dto.country?.trim() ?? null;
    const city = dto.city?.trim() ?? null;

    const profile = await this.profiles.findOne({ where: { tenantId } });
    const sections = profile
      ? await this.profileSections.find({ where: { profileId: profile.id } })
      : [];
    const values = this.profileSectionSync.resolveProfileValues(profile, sections);

    const interview = await this.interviews.findOne({
      where: { tenantId, agentType: 'brand_interview' },
      order: { updatedAt: 'DESC' },
    });

    const brandBriefExcerpt =
      interview?.brandBriefMarkdown?.trim().slice(0, 1200) ??
      null;

    if (!hasMinimalDiscoveryContext(values, brandBriefExcerpt)) {
      throw new BadRequestException({
        error:
          'Completa el perfil de empresa (onboarding) o el Brand Brief antes de buscar competidores con IA.',
        code: 'PROFILE_INCOMPLETE',
      });
    }

    const existing = await this.competitors.find({ where: { tenantId } });

    let productContext = null;
    if (dto.productId) {
      const product = await this.productService.findOwnedEntity(tenantId, dto.productId);
      productContext = toProductContext(product);
    }

    return {
      scope: dto.scope,
      country,
      city,
      companyName: values.companyName,
      industry: values.industry,
      industryLabel: formatIndustryLabel(values.industry),
      targetAudience: productContext?.targetAudience ?? values.targetAudienceDesc,
      website: values.website,
      brandVoice: values.brandVoice,
      objectives: values.objectives,
      productSummary: productSummaryForDiscovery(
        productContext,
        values,
        interview?.brandBrief ?? null,
      ),
      brandBriefExcerpt,
      existingCompetitorNames: existing.map((item) => item.name),
    };
  }

  private async syncProfileCompetitorsText(tenantId: string): Promise<void> {
    const text = await this.buildCompetitorsText(tenantId);
    await this.companyProfile.syncCompetitorsText(tenantId, text);
  }

  private async seedDemoMentions(competitor: CompetitorEntity): Promise<void> {
    const now = new Date();
    const samples: Array<{
      source: string;
      content: string;
      sentiment: MentionSentiment;
      daysAgo: number;
    }> = [
      {
        source: 'Google News',
        content: `${competitor.name} lanza nueva campaña digital en su sector.`,
        sentiment: 'neutral',
        daysAgo: 2,
      },
      {
        source: 'LinkedIn',
        content: `Usuarios destacan la propuesta de valor de ${competitor.name}.`,
        sentiment: 'positive',
        daysAgo: 5,
      },
      {
        source: 'Twitter/X',
        content: `Debate sobre precios competitivos de ${competitor.name}.`,
        sentiment: 'negative',
        daysAgo: 7,
      },
    ];

    await this.mentions.save(
      samples.map((sample) =>
        this.mentions.create({
          competitorId: competitor.id,
          source: sample.source,
          content: sample.content,
          sentiment: sample.sentiment,
          mentionedAt: new Date(now.getTime() - sample.daysAgo * 86400000),
        }),
      ),
    );
  }

  private async findOwnedCompetitor(
    tenantId: string,
    id: string,
  ): Promise<CompetitorEntity> {
    const competitor = await this.competitors.findOne({ where: { id, tenantId } });
    if (!competitor) {
      throw new NotFoundException('Competitor not found');
    }
    return competitor;
  }

  private toCompetitorResponse(entity: CompetitorEntity): CompetitorResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      website: entity.website,
      industry: entity.industry,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private toMentionResponse(entity: CompetitorMentionEntity): CompetitorMentionResponseDto {
    return {
      id: entity.id,
      competitorId: entity.competitorId,
      source: entity.source,
      content: entity.content,
      sentiment: entity.sentiment,
      mentionedAt: entity.mentionedAt?.toISOString() ?? null,
      createdAt: entity.createdAt.toISOString(),
    };
  }
}
