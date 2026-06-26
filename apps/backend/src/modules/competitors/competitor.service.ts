import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { MentionSentiment } from './domain/competitor.constants';
import { CreateCompetitorDto, ListMentionsQueryDto } from './dto/competitor.request.dto';
import {
  CompetitorListResponseDto,
  CompetitorMentionResponseDto,
  CompetitorResponseDto,
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

    return this.toCompetitorResponse(saved);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const competitor = await this.findOwnedCompetitor(tenantId, id);
    await this.competitors.remove(competitor);
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
