import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from './entities/campaign.entity';
import { Keyword } from './entities/keyword.entity';
import { CreateCampaignDto } from './dto/create-campaign.dto';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
    @InjectRepository(Keyword)
    private readonly keywordRepo: Repository<Keyword>,
  ) {}

  async create(tenantId: string, productId: string, dto: CreateCampaignDto): Promise<Campaign> {
    const campaign = this.campaignRepo.create({ ...dto, tenantId, productId } as any);
    return this.campaignRepo.save(campaign) as any;
  }

  async findAll(tenantId: string, productId?: string): Promise<Campaign[]> {
    const where: any = { tenantId };
    if (productId) where.productId = productId;
    return this.campaignRepo.find({ where, relations: ['keywords'] });
  }

  async findOne(id: string): Promise<Campaign> {
    const campaign = await this.campaignRepo.findOne({ where: { id }, relations: ['keywords'] });
    if (!campaign) throw new NotFoundException('Campaña no encontrada');
    return campaign;
  }

  async update(id: string, data: Partial<Campaign>): Promise<Campaign> {
    await this.campaignRepo.update(id, data);
    return this.findOne(id);
  }

  async addKeyword(campaignId: string, text: string, cpc?: number): Promise<Keyword> {
    const keyword = this.keywordRepo.create({ campaignId, text, cpc });
    return this.keywordRepo.save(keyword) as any;
  }

  async pauseKeyword(id: string): Promise<Keyword> {
    await this.keywordRepo.update(id, { status: 'paused' as any });
    const kw = await this.keywordRepo.findOne({ where: { id } });
    if (!kw) throw new NotFoundException('Keyword no encontrada');
    return kw;
  }
}
