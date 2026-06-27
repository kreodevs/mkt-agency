import { InterviewContext } from './interview.context';

export interface InterviewAdapterPort {
  generateNextQuestion(context: InterviewContext): Promise<string>;
  generateBrandBrief(context: InterviewContext): Promise<Record<string, unknown>>;
}

export const INTERVIEW_ADAPTER = Symbol('INTERVIEW_ADAPTER');