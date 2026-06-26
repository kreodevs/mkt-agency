import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ProposalEntity } from '../infrastructure/typeorm/proposal.entity';

@Injectable()
export class ProposalSignatureService {
  compute(proposal: ProposalEntity): string {
    const payload = `${JSON.stringify(proposal.content)}|${proposal.id}`;
    return createHash('sha256').update(payload, 'utf8').digest('hex');
  }
}
