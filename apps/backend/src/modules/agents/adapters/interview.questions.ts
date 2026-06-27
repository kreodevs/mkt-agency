import { AgentType } from '../domain/agent-interview.entity';

export interface InterviewQuestion {
  step: number;
  key: string;
  question: string;
  hint: string;
}

export const INTERVIEW_QUESTIONS: Record<AgentType, InterviewQuestion[]> = {
  brand_interview: [
    {
      step: 1,
      key: 'companyName',
      question:
        'Cuéntame sobre tu empresa: ¿cuál es su nombre y a qué se dedican? Describe brevemente el producto o servicio principal.',
      hint: 'Nombre comercial y giro del negocio',
    },
    {
      step: 2,
      key: 'industry',
      question:
        '¿En qué industria o sector compite tu empresa? ¿Hay algún nicho específico dentro de ese mercado?',
      hint: 'Sector industrial y nicho',
    },
    {
      step: 3,
      key: 'targetAudienceDesc',
      question:
        'Describe a tu cliente ideal: ¿quién compra tu producto? ¿Qué tamaño tienen esas empresas? ¿En qué zona geográfica están?',
      hint: 'Cliente ideal y segmento',
    },
    {
      step: 4,
      key: 'brandVoice',
      question:
        '¿Cómo describirías la personalidad de tu marca? ¿Qué tono quieres proyectar (profesional, divertido, innovador, serio)? ¿Hay palabras o conceptos clave que siempre deben estar presentes?',
      hint: 'Tono y personalidad de marca',
    },
    {
      step: 5,
      key: 'competitors',
      question:
        '¿Quiénes son tus principales competidores? ¿Qué los diferencia de ti? ¿Hay algo que el mercado esté pidiendo que ellos no estén resolviendo bien?',
      hint: 'Competencia y pains del mercado',
    },
    {
      step: 6,
      key: 'objectives',
      question:
        'Para cerrar, ¿cuáles son tus principales objetivos de marketing a corto y mediano plazo? ¿Hay algo más que deba saber sobre tu marca para entenderla mejor?',
      hint: 'Objetivos de marketing y notas adicionales',
    },
  ],
};

export function getInterviewQuestions(agentType: AgentType): InterviewQuestion[] {
  return INTERVIEW_QUESTIONS[agentType] ?? [];
}

export function getInterviewQuestion(agentType: AgentType, step: number): InterviewQuestion | undefined {
  return INTERVIEW_QUESTIONS[agentType]?.find((q) => q.step === step);
}