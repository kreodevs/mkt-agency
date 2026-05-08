import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead, LeadStage } from './entities/lead.entity';
import { CreateLeadDto, UpdateLeadStageDto } from './dto/create-lead.dto';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepo: Repository<Lead>,
  ) {}

  async create(tenantId: string, productId: string, dto: CreateLeadDto): Promise<Lead> {
    const lead = this.leadRepo.create({ ...dto, tenantId, productId } as any);
    return this.leadRepo.save(lead) as any;
  }

  async findAll(tenantId: string, productId?: string): Promise<Lead[]> {
    const where: any = { tenantId };
    if (productId) where.productId = productId;
    return this.leadRepo.find({ where, order: { score: 'DESC' } });
  }

  async findOne(id: string): Promise<Lead> {
    const lead = await this.leadRepo.findOne({ where: { id } });
    if (!lead) throw new NotFoundException('Lead no encontrado');
    return lead;
  }

  async updateStage(id: string, dto: UpdateLeadStageDto): Promise<Lead> {
    await this.leadRepo.update(id, { stage: dto.stage as LeadStage });
    return this.findOne(id);
  }

  async updateScore(id: string, score: number): Promise<Lead> {
    await this.leadRepo.update(id, { score });
    return this.findOne(id);
  }

  async update(id: string, data: Partial<Lead>): Promise<Lead> {
    await this.leadRepo.update(id, data);
    return this.findOne(id);
  }
}