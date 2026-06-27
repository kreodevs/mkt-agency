import { Injectable } from '@nestjs/common';
import { InterviewAdapterPort } from './interview.adapter.port';
import { InterviewContext } from './interview.context';
import { getInterviewQuestion } from './interview.questions';

@Injectable()
export class StubInterviewAdapter implements InterviewAdapterPort {
  async generateNextQuestion(context: InterviewContext): Promise<string> {
    const question = getInterviewQuestion(context.agentType, context.currentStep + 1);
    if (!question) {
      return '¡Excelente! He reunido suficiente información. Procederé a generar el Brand Brief.';
    }
    return `${question.question}\n\n💡 ${question.hint}`;
  }

  async generateBrandBrief(context: InterviewContext): Promise<Record<string, unknown>> {
    return {
      companyName: context.answers.companyName ?? context.profile.companyName ?? '',
      industry: context.answers.industry ?? context.profile.industry ?? '',
      targetAudienceDesc:
        context.answers.targetAudienceDesc ?? context.profile.targetAudienceDesc ?? '',
      brandVoice: context.answers.brandVoice ?? context.profile.brandVoice ?? '',
      competitors: context.answers.competitors ?? context.profile.competitors ?? '',
      objectives: context.answers.objectives ?? context.profile.objectives ?? '',
      marketPains:
        'Análisis pendiente — conecta un proveedor LLM para generar el Brand Brief con IA.',
      visualDirection:
        'Basada en respuestas de la entrevista — disponible al completar con IA.',
      keyMessages: ['Mensaje pendiente de generar con IA'],
    };
  }
}