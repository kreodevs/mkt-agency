import { useRef, useEffect } from 'react';
import { Bot, Send } from 'lucide-react';
import type { AgentInterview } from '@/types/agents';
import { AiThinkingPanel } from '@/components/molecules/AiThinkingPanel';
import { Button } from '@/components/atoms/Button';
import { Progress } from '@/components/molecules/Progress';

interface BrandInterviewChatProps {
  interview: AgentInterview;
  isProcessing: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  isSending: boolean;
  canAnswer: boolean;
  stepProgress: number;
  answer: string;
  onAnswerChange: (value: string) => void;
  onSend: () => void;
  onRetry: () => void;
  retryPending: boolean;
}

export function BrandInterviewChat({
  interview,
  isProcessing,
  isCompleted,
  isFailed,
  isSending,
  canAnswer,
  stepProgress,
  answer,
  onAnswerChange,
  onSend,
  onRetry,
  retryPending,
}: BrandInterviewChatProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [interview.messages, isProcessing, isSending]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const fromOnboarding = interview.messages.length === 0 && interview.status === 'in_progress';

  return (
    <div className="mx-auto mt-4 max-w-2xl space-y-3">
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-[var(--spacing-md)] py-[var(--spacing-md)]">
        <div className="mb-2 flex items-center justify-between text-xs text-[var(--foreground-muted)]">
          <span>
            {fromOnboarding
              ? isProcessing ? 'Generando Brand Brief desde onboarding' : isCompleted ? 'Brand Brief generado' : 'Contexto del onboarding'
              : isProcessing ? 'Analizando respuestas' : isCompleted ? 'Entrevista completada' : `${interview.currentStep} de ${interview.totalSteps} preguntas respondidas`}
          </span>
          <span className="font-medium tabular-nums text-[var(--foreground)]">
            {isProcessing ? '…' : `${stepProgress}%`}
          </span>
        </div>
        <Progress value={isProcessing ? 100 : stepProgress} className={isProcessing ? '[&>div]:animate-pulse' : undefined} />
      </div>

      <div className="flex max-w-2xl flex-col overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)]" style={{ height: '62vh' }}>
        <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-6">
          {interview.messages.map((msg) => {
            const isAgent = msg.role === 'agent';
            const isSystem = msg.role === 'system';
            const isError = msg.metadata?.type === 'error';

            if (isSystem && isError) {
              if (isCompleted && interview.brandBriefMarkdown) return null;
              return (
                <div key={msg.id} className="rounded-lg border border-[var(--destructive)]/30 bg-[var(--destructive)]/5 p-4 text-sm text-[var(--destructive)]">
                  {msg.content}
                </div>
              );
            }
            if (isSystem) return null;

            return (
              <div key={msg.id} className={`flex gap-3 ${isAgent ? '' : 'flex-row-reverse'}`}>
                {isAgent && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/10">
                    <Bot className="h-4 w-4 text-[var(--brand)]" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${isAgent ? 'rounded-bl-sm bg-[var(--secondary)] text-[var(--foreground)]' : 'rounded-br-sm bg-[var(--primary)] text-[var(--primary-foreground)]'}`}>
                  {msg.content}
                </div>
              </div>
            );
          })}

          {(isProcessing || isSending) && (
            <AiThinkingPanel
              variant="inline"
              state={isSending ? 'listening' : 'composing'}
              title={isSending ? 'Enviando tu respuesta…' : 'Generando Brand Brief'}
              description={isSending ? 'Un momento...' : 'La IA analiza tus respuestas.'}
            />
          )}

          <div ref={chatEndRef} />
        </div>

        {isFailed && (
          <div className="border-t border-[var(--border)] p-4 text-center">
            <p className="text-sm text-[var(--destructive)]">{interview.errorMessage ?? 'Error al generar el Brand Brief.'}</p>
            {!isCompleted && (
              <Button type="button" variant="outline" size="sm" className="mt-3" loading={retryPending} onClick={onRetry}>
                Reintentar generación
              </Button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 border-t border-[var(--border)] p-4">
          <input
            type="text"
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isCompleted ? 'Entrevista completada' : isSending ? 'Enviando...' : isProcessing ? 'Generando...' : 'Escribe tu respuesta...'}
            disabled={!canAnswer}
            className="h-10 flex-1 rounded-full border border-[var(--border)] bg-[var(--input)] px-4 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button
            type="button"
            onClick={onSend}
            disabled={!canAnswer || !answer.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:bg-[var(--muted)] disabled:text-[var(--foreground-muted)]"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
