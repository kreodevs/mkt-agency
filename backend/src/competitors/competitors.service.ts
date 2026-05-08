import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Competitor } from './entities/competitor.entity';
import { CompetitorMention } from './entities/competitor-mention.entity';
import { CreateCompetitorDto } from './dto/create-competitor.dto';
import { CreateMentionDto } from './dto/create-mention.dto';

@Injectable()
export class CompetitorsService {
  constructor(
    @InjectRepository(Competitor)
    private readonly competitorRepo: Repository<Competitor>,
    @InjectRepository(CompetitorMention)
    private readonly mentionRepo: Repository<CompetitorMention>,
  ) {}

  async create(tenantId: string, productId: string, dto: CreateCompetitorDto): Promise<Competitor> {
    const competitor = this.competitorRepo.create({ ...dto, tenantId, productId } as any);
    return this.competitorRepo.save(competitor) as any;
  }

  async findAll(tenantId: string, productId?: string): Promise<Competitor[]> {
    const where: any = { tenantId };
    if (productId) where.productId = productId;
    return this.competitorRepo.find({ where, order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Competitor> {
    const competitor = await this.competitorRepo.findOne({ where: { id } });
    if (!competitor) throw new NotFoundException('Competidor no encontrado');
    return competitor;
  }

  async update(id: string, data: Partial<Competitor>): Promise<Competitor> {
    await this.competitorRepo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.competitorRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Competidor no encontrado');
  }

  async createMention(competitorId: string, dto: CreateMentionDto): Promise<CompetitorMention> {
    await this.findOne(competitorId);
    const mention = this.mentionRepo.create({ ...dto, competitorId, date: dto.date || new Date() } as any);
    return this.mentionRepo.save(mention) as any;
  }

  async getMentions(competitorId: string): Promise<CompetitorMention[]> {
    await this.findOne(competitorId);
    return this.mentionRepo.find({
      where: { competitorId },
      order: { date: 'DESC' },
    });
  }
}
