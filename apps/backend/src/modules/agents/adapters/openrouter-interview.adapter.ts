import { Injectable } from '@nestjs/common';
import { LlmClient } from '../../../shared/ai/llm.client';
import { InterviewAdapterPort } from './interview.adapter.port';
import { InterviewContext } from './interview.context';
import { getInterviewQuestion } from './interview.questions';

@Injectable()
export class OpenRouterInterviewAdapter implements InterviewAdapterPort {
  constructor(private readonly llm: LlmClient) {}

  async generateNextQuestion(context: InterviewContext): Promise<string> {
    const question = getInterviewQuestion(context.agentType, context.currentStep + 1);
    if (!question) {
      return 'Gracias por compartir toda esta información. Estoy procesando el análisis de tu marca...';
    }

    const previousAnswers = Object.entries(context.answers)
      .filter(([, v]) => v)
      .map(([k, v]) => `  - ${k}: ${String(v)}`)
      .join('\n');

    const systemPrompt =
      'Eres un consultor de marketing senior realizando una entrevista de branding. ' +
      'Debes sonar natural, empático y profesional. Habla en español neutro. ' +
      'NO saludes como si fuera la primera vez si ya hay respuestas previas. ' +
      'Si el usuario ya respondió algo antes, haz referencia a ello para dar continuidad. ' +
      'Responde SOLO con la pregunta, sin introducciones ni markdown. ' +
      'Máximo 2 párrafos. Sé conversacional, no parezcas un formulario.';

    const userPrompt = JSON.stringify({
      task: 'Generar la siguiente pregunta de la entrevista de marca.',
      context: {
        companyProfile: context.profile,
        focusProduct: context.product,
        previouslyAnswered: previousAnswers
          ? `Respuestas previas del usuario:\n${previousAnswers}`
          : 'Primera pregunta de la entrevista.',
        nextQuestion: question.question,
        nextQuestionHint: question.hint,
      },
      instructions:
        context.product
          ? `Toma la pregunta base y adáptala con un tono natural. La entrevista está enfocada en el producto/servicio "${context.product.name}" — conecta las preguntas con ese contexto cuando aplique.`
          : 'Toma la pregunta base y adáptala con un tono natural y conversacional. Si tienes respuestas previas, conéctalas.',
      step: context.currentStep + 1,
      totalSteps: context.totalSteps,
    });

    return this.llm.chatJson<string>(systemPrompt, userPrompt, {
      taskType: 'brand_interview',
      temperature: 0.8,
    });
  }

  async generateBrandBrief(context: InterviewContext): Promise<Record<string, unknown>> {
    const answersText = Object.entries(context.answers)
      .filter(([, v]) => v)
      .map(([k, v]) => `"${k}": "${String(v).replace(/"/g, "'")}"`)
      .join(',\n');

    const systemPrompt =
      'Eres un estratega de marketing senior. Analiza las respuestas de una entrevista de branding ' +
      'y genera un Brand Brief profesional en español. Responde SOLO con un objeto JSON válido.';

    const userPrompt = JSON.stringify({
      task: context.product
        ? `Generar un Brand Brief enfocado en el producto/servicio "${context.product.name}".`
        : 'Generar un Brand Brief estructurado a partir de las respuestas de la entrevista.',
      answers: `{\n${answersText}\n}`,
      profile: context.profile,
      focusProduct: context.product,
      outputFormat: {
        companyName: 'Nombre de la empresa',
        industry: 'Industria o sector',
        targetAudienceDesc: 'Descripción detallada del público objetivo, tamaño, geografía',
        brandVoice: 'Tono y personalidad de marca, palabras clave',
        competitors: 'Lista de competidores y análisis de sus debilidades / oportunidades de mercado',
        objectives: 'Objetivos de marketing claros y medibles',
        marketPains: 'Análisis de los pains del mercado detectados',
        visualDirection: 'Sugerencia de dirección visual basada en la personalidad de marca',
        keyMessages: 'Array de 3-5 mensajes clave que la marca debe comunicar siempre',
      },
    });

    return this.llm.chatJson<Record<string, unknown>>(systemPrompt, userPrompt, {
      taskType: 'brand_interview',
      temperature: 0.5,
    });
  }
}