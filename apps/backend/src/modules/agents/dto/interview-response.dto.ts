export interface InterviewMessageDto {
  id: string;
  role: 'agent' | 'user' | 'system';
  content: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface InterviewResponseDto {
  id: string;
  agentType: string;
  status: string;
  currentStep: number;
  totalSteps: number;
  messages: InterviewMessageDto[];
  brandBrief: Record<string, unknown> | null;
  brandBriefMarkdown: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}