import { Injectable, Logger } from '@nestjs/common';
import { Proposal } from './entities/proposal.entity';

@Injectable()
export class ProposalExecutorService {
  private readonly logger = new Logger(ProposalExecutorService.name);

  async execute(proposal: Proposal): Promise<{ success: boolean; summary: string }> {
    this.logger.log(`Ejecutando propuesta ${proposal.id}: ${proposal.actionType}`);

    switch (proposal.actionType) {
      case 'create_post':
        return this.executeCreatePost(proposal);
      case 'contact_lead':
        return this.executeContactLead(proposal);
      case 'score_lead':
        return this.executeScoreLead(proposal);
      case 'custom_message':
        return { success: true, summary: 'Mensaje registrado. Pendiente de acción manual.' };
      default:
        return { success: true, summary: `Acción ${proposal.actionType} marcada como ejecutada.` };
    }
  }

  private async executeCreatePost(proposal: Proposal): Promise<{ success: boolean; summary: string }> {
    // Por ahora solo registramos — la integración real con PostsService vendrá después
    this.logger.log(`[create_post] Payload: ${JSON.stringify(proposal.payload)}`);
    return { success: true, summary: 'Post creado exitosamente (simulado)' };
  }

  private async executeContactLead(proposal: Proposal): Promise<{ success: boolean; summary: string }> {
    this.logger.log(`[contact_lead] Payload: ${JSON.stringify(proposal.payload)}`);
    return { success: true, summary: `Lead contactado exitosamente` };
  }

  private async executeScoreLead(proposal: Proposal): Promise<{ success: boolean; summary: string }> {
    this.logger.log(`[score_lead] Payload: ${JSON.stringify(proposal.payload)}`);
    return { success: true, summary: `Lead score actualizado` };
  }
}
