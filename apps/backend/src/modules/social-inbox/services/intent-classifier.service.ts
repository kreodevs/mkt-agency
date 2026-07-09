import { Injectable } from '@nestjs/common';
import { LlmClient } from '../../../shared/ai/llm.client';
import type { InteractionIntent } from '../domain/interaction-intent.constants';

export interface ClassificationResult {
  intent: InteractionIntent;
  sentiment: 'positive' | 'neutral' | 'negative';
  suggestedReply?: string;
  purchaseSignals: string[];
}

interface LlmClassification {
  intent: InteractionIntent;
  sentiment: 'positive' | 'neutral' | 'negative';
  suggestedReply?: string;
  purchaseSignals?: string[];
}

const SPAM_PATTERNS = [/ganar dinero/i, /crypto/i, /http:\/\//i, /https:\/\//i, /bot/i];
const PROSPECT_PATTERNS = [
  /precio/i,
  /cu[aá]nto cuesta/i,
  /info/i,
  /informaci[oó]n/i,
  /comprar/i,
  /cotiz/i,
  /whatsapp/i,
  /tel[eé]fono/i,
  /agendar/i,
  /cita/i,
  /demo/i,
];
const SUPPORT_PATTERNS = [
  /no funciona/i,
  /problema/i,
  /error/i,
  /ayuda/i,
  /soporte/i,
  /reclamo/i,
  /devol/i,
];

@Injectable()
export class IntentClassifierService {
  constructor(private readonly llm: LlmClient) {}

  async classify(message: string, tenantId?: string): Promise<ClassificationResult> {
    const ruleBased = this.classifyWithRules(message);
    if (ruleBased.intent !== 'brand' || ruleBased.purchaseSignals.length > 0) {
      return ruleBased;
    }

    try {
      const result = await this.llm.chatJson<LlmClassification>(
        'Clasifica interacciones sociales de marca. Responde JSON: {"intent":"support|spam|brand|prospect","sentiment":"positive|neutral|negative","suggestedReply":"...","purchaseSignals":[]}. intent=prospect si hay intención de compra.',
        message,
        { taskType: 'lead_scoring', tenantId },
      );
      if (result?.intent && result.intent !== 'pending') {
        return {
          intent: result.intent,
          sentiment: result.sentiment ?? 'neutral',
          suggestedReply: result.suggestedReply,
          purchaseSignals: result.purchaseSignals ?? [],
        };
      }
    } catch {
      // use rule fallback
    }

    return ruleBased;
  }

  private classifyWithRules(message: string): ClassificationResult {
    const text = message.trim();
    if (!text || text.length < 2) {
      return { intent: 'spam', sentiment: 'neutral', purchaseSignals: [] };
    }

    if (SPAM_PATTERNS.some((p) => p.test(text))) {
      return { intent: 'spam', sentiment: 'negative', purchaseSignals: [] };
    }

    const purchaseSignals = PROSPECT_PATTERNS.filter((p) => p.test(text)).map((p) => p.source);
    if (purchaseSignals.length > 0) {
      return {
        intent: 'prospect',
        sentiment: 'positive',
        suggestedReply: '¡Gracias por escribir! Te contacto por DM con la información.',
        purchaseSignals,
      };
    }

    if (SUPPORT_PATTERNS.some((p) => p.test(text))) {
      return {
        intent: 'support',
        sentiment: 'negative',
        suggestedReply: 'Lamento el inconveniente. Escríbenos por DM y te ayudamos enseguida.',
        purchaseSignals: [],
      };
    }

    return {
      intent: 'brand',
      sentiment: 'neutral',
      suggestedReply: '¡Gracias por tu mensaje! Valoramos tu opinión.',
      purchaseSignals: [],
    };
  }
}
