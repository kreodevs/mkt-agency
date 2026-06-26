import { Injectable } from '@nestjs/common';
import type { ScoringAdapterPort, LeadScoringContext } from './scoring.adapter.port';

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'live.com',
]);

@Injectable()
export class StubScoringAdapter implements ScoringAdapterPort {
  async score(context: LeadScoringContext): Promise<number> {
    const { lead, interactions } = context;
    let score = 15;

    if (lead.name) score += 10;
    if (lead.phone) score += 15;
    if (lead.company) score += 15;

    const domain = lead.email.split('@')[1]?.toLowerCase();
    if (domain && !FREE_EMAIL_DOMAINS.has(domain)) {
      score += 15;
    }

    score += Math.min(25, interactions.length * 5);

    if (lead.stage === 'qualified') score += 10;
    if (lead.stage === 'proposal') score += 15;
    if (lead.stage === 'customer') score += 20;

    return Math.min(100, Math.max(0, score));
  }
}
