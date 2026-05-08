import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeoRanking } from './entities/seo-ranking.entity';
import { CreateRankingDto } from './dto/create-ranking.dto';

@Injectable()
export class SeoRankingsService {
  constructor(
    @InjectRepository(SeoRanking)
    private readonly seoRankingRepo: Repository<SeoRanking>,
  ) {}

  async create(tenantId: string, dto: CreateRankingDto): Promise<SeoRanking> {
    const ranking = this.seoRankingRepo.create({ ...dto, tenantId } as any);
    return this.seoRankingRepo.save(ranking) as any;
  }

  async findAll(
    tenantId: string,
    filters?: {
      productId?: string;
      keyword?: string;
      city?: string;
      competitorId?: string;
    },
  ): Promise<SeoRanking[]> {
    const where: any = { tenantId };
    if (filters?.productId) where.productId = filters.productId;
    if (filters?.keyword) where.keyword = filters.keyword;
    if (filters?.city) where.city = filters.city;
    if (filters?.competitorId) where.competitorId = filters.competitorId;
    return this.seoRankingRepo.find({
      where,
      order: { date: 'DESC' },
    });
  }

  async findOne(id: string): Promise<SeoRanking> {
    const ranking = await this.seoRankingRepo.findOne({ where: { id } });
    if (!ranking) throw new NotFoundException('Ranking SEO no encontrado');
    return ranking;
  }

  async getLatest(tenantId: string, productId?: string): Promise<SeoRanking[]> {
    const qb = this.seoRankingRepo
      .createQueryBuilder('sr')
      .where('sr.tenantId = :tenantId', { tenantId });

    if (productId) {
      qb.andWhere('sr.productId = :productId', { productId });
    }

    // Subquery: obtener el último id por cada combinación keyword+city
    const subQb = this.seoRankingRepo
      .createQueryBuilder('inner')
      .select('DISTINCT ON (inner.keyword, COALESCE(inner.city, \'\')) inner.id')
      .where('inner.tenantId = :tenantId', { tenantId });

    if (productId) {
      subQb.andWhere('inner.productId = :productId', { productId });
    }

    subQb.orderBy(
      'inner.keyword, COALESCE(inner.city, \'\'), inner.date',
      'DESC',
    );

    qb.andWhere(`sr.id IN (${subQb.getQuery()})`)
      .setParameters(subQb.getParameters())
      .orderBy('sr.keyword, COALESCE(sr.city, \'\')');

    return qb.getMany();
  }

  async update(id: string, data: Partial<CreateRankingDto>): Promise<SeoRanking> {
    await this.seoRankingRepo.update(id, data as any);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const ranking = await this.findOne(id);
    await this.seoRankingRepo.remove(ranking);
  }
}
