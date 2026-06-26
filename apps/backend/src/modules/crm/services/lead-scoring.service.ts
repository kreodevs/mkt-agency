import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import {
  SCORING_ADAPTER,
  ScoringAdapterPort,
} from '../adapters/scoring.adapter.port';
import { LeadInteractionEntity } from '../infrastructure/typeorm/lead-interaction.entity';
import { LeadEntity } from '../infrastructure/typeorm/lead.entity';

@Injectable()
export class LeadScoringService {
  constructor(
    @InjectRepository(LeadEntity)
    private readonly leads: Repository<LeadEntity>,
    @InjectRepository(LeadInteractionEntity)
    private readonly interactions: Repository<LeadInteractionEntity>,
    @Inject(SCORING_ADAPTER)
    private readonly adapter: ScoringAdapterPort,
  ) {}

  async recalculate(leadId: string, manager?: EntityManager): Promise<number> {
    const leadRepo = manager ? manager.getRepository(LeadEntity) : this.leads;
    const interactionRepo = manager
      ? manager.getRepository(LeadInteractionEntity)
      : this.interactions;

    const lead = await leadRepo.findOne({ where: { id: leadId } });
    if (!lead) {
      return 0;
    }

    const interactions = await interactionRepo.find({
      where: { leadId },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    const score = await this.adapter.score({ lead, interactions });
    lead.score = score;
    await leadRepo.save(lead);
    return score;
  }
}
