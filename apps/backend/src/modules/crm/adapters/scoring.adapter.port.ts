import { LeadEntity } from '../infrastructure/typeorm/lead.entity';
import { LeadInteractionEntity } from '../infrastructure/typeorm/lead-interaction.entity';

export interface LeadScoringContext {
  lead: LeadEntity;
  interactions: LeadInteractionEntity[];
}

export interface ScoringAdapterPort {
  score(context: LeadScoringContext): Promise<number>;
}

export const SCORING_ADAPTER = Symbol('SCORING_ADAPTER');
