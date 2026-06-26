import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { LeadEntity } from '../infrastructure/typeorm/lead.entity';
import { DeleteLeadCommand } from './delete-lead.command';

@Injectable()
export class DeleteLeadHandler {
  constructor(
    @InjectRepository(LeadEntity)
    private readonly leads: Repository<LeadEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async execute(command: DeleteLeadCommand): Promise<void> {
    const lead = await this.leads.findOne({
      where: { id: command.leadId, tenantId: command.tenantId },
    });

    if (!lead) {
      throw new NotFoundException({
        error: 'Lead not found',
        code: 'NOT_FOUND',
      });
    }

    const hasSigned = await this.hasSignedProposals(lead.id);
    if (hasSigned) {
      throw new ConflictException({
        error: 'Lead has signed proposals and cannot be deleted',
        code: 'LEAD_HAS_SIGNED_PROPOSALS',
      });
    }

    await this.leads.remove(lead);
  }

  private async hasSignedProposals(leadId: string): Promise<boolean> {
    try {
      const rows = (await this.dataSource.query(
        `SELECT 1 FROM proposals
         WHERE lead_id = $1 AND signature_hash IS NOT NULL
         LIMIT 1`,
        [leadId],
      )) as unknown[];

      return rows.length > 0;
    } catch {
      return false;
    }
  }
}
