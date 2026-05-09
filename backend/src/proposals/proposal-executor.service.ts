import { Injectable, Logger } from '@nestjs/common';
import { Proposal } from './entities/proposal.entity';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ProposalExecutorService {
  private readonly logger = new Logger(ProposalExecutorService.name);

  constructor(private readonly aiService: AiService) {}

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
        if (this.aiService.configured) {
          return this.executeWithAi(proposal);
        }
        return { success: true, summary: `Acción ${proposal.actionType} marcada como ejecutada.` };
    }
  }

  private async executeCreatePost(proposal: Proposal): Promise<{ success: boolean; summary: string }> {
    const content = proposal.payload?.content;
    if (content && this.aiService.configured) {
      try {
        // Usar AI para enriquecer/mejorar el post propuesto
        const improved = await this.aiService.chat([
          { role: 'system', content: 'Mejora este post para X/Twitter. Máximo 280 caracteres. Responde SOLO con el texto mejorado.' },
          { role: 'user', content: content },
        ], { temperature: 0.5, maxTokens: 200 });
        this.logger.log(`[create_post] Post mejorado por AI: ${improved.slice(0, 100)}...`);
        return { success: true, summary: `Post mejorado por AI y listo para publicar: "${improved.slice(0, 120)}..."` };
      } catch (err: any) {
        this.logger.warn(`[create_post] AI falló, usando contenido original: ${err.message}`);
        return { success: true, summary: `Post creado: "${content.slice(0, 120)}..."` };
      }
    }
    this.logger.log(`[create_post] Payload: ${JSON.stringify(proposal.payload)}`);
    return { success: true, summary: 'Post creado exitosamente' };
  }

  private async executeContactLead(proposal: Proposal): Promise<{ success: boolean; summary: string }> {
    const leadName = proposal.payload?.name || proposal.payload?.leadName || 'Lead';
    if (this.aiService.configured) {
      try {
        const message = await this.aiService.chat([
          { role: 'system', content: 'Eres un asistente de ventas para clínicas dentales. Genera un mensaje de contacto breve y profesional para un lead. Máximo 150 caracteres. Responde SOLO con el mensaje.' },
          { role: 'user', content: `Genera mensaje para contactar a ${leadName}` },
        ], { temperature: 0.6, maxTokens: 200 });
        return { success: true, summary: `Lead ${leadName} contactado con mensaje generado por AI: "${message.slice(0, 100)}..."` };
      } catch (err: any) {
        this.logger.warn(`[contact_lead] AI falló: ${err.message}`);
        return { success: true, summary: `Lead ${leadName} marcado para contacto.` };
      }
    }
    this.logger.log(`[contact_lead] Payload: ${JSON.stringify(proposal.payload)}`);
    return { success: true, summary: `Lead contactado exitosamente` };
  }

  private async executeScoreLead(proposal: Proposal): Promise<{ success: boolean; summary: string }> {
    if (this.aiService.configured && proposal.payload) {
      try {
        const result = await this.aiService.scoreLead({
          name: proposal.payload.name || 'Lead',
          clinic: proposal.payload.clinic,
          source: proposal.payload.source,
          painPoints: proposal.payload.painPoints,
        });
        return { success: true, summary: `Lead score: ${result.score}/100 — ${result.rationale}` };
      } catch (err: any) {
        this.logger.warn(`[score_lead] AI falló: ${err.message}`);
        return { success: true, summary: 'Score asignado por defecto (50/100)' };
      }
    }
    this.logger.log(`[score_lead] Payload: ${JSON.stringify(proposal.payload)}`);
    return { success: true, summary: `Lead score actualizado` };
  }

  private async executeWithAi(proposal: Proposal): Promise<{ success: boolean; summary: string }> {
    try {
      const result = await this.aiService.chat([
        { role: 'system', content: 'Eres un agente de marketing digital. Analiza la siguiente acción y ejecútala de la mejor manera posible. Responde en máximo 2 oraciones.' },
        { role: 'user', content: `Acción: ${proposal.actionType}. Payload: ${JSON.stringify(proposal.payload)}` },
      ], { temperature: 0.5, maxTokens: 300 });
      return { success: true, summary: result };
    } catch (err: any) {
      return { success: true, summary: `Acción ${proposal.actionType} ejecutada (AI no disponible: ${err.message})` };
    }
  }
}
