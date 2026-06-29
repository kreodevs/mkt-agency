import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, ChevronLeft, Send, Sparkles } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { DashboardShell, tenantNavigation } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { Button } from '@/components/atoms/Button';
import { toast } from '@/components/molecules/Sonner';
import { createInterview, getInterview, submitAnswer } from '@/services/agents';
import { ApiError } from '@/services/api';

export default function BrandInterviewPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [answer, setAnswer] = useState('');
  const [isNew, setIsNew] = useState(!id);

  const interviewQuery = useQuery({
    queryKey: ['agent-interview', id],
    queryFn: () => getInterview(id!),
    enabled: !!id && !isNew,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      return data.status === 'in_progress' &&
        data.messages.some((m) => m.metadata?.type === 'processing')
        ? 3000
        : false;
    },
  });

  const activeInterview = id ? interviewQuery.data : undefined;

  const createMutation = useMutation({
    mutationFn: () => createInterview('brand_interview'),
    onSuccess: (result) => {
      queryClient.setQueryData(['agent-interview', result.id], result);
      window.history.replaceState(null, '', `/agents/brand-interview/${result.id}`);
      setIsNew(false);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Error al iniciar entrevista');
    },
  });

  const answerMutation = useMutation({
    mutationFn: (answerText: string) => submitAnswer(activeInterview!.id, answerText),
    onSuccess: (result) => {
      queryClient.setQueryData(['agent-interview', result.id], result);
      setAnswer('');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Error al enviar respuesta');
    },
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeInterview?.messages]);

  const handleSend = () => {
    const trimmed = answer.trim();
    if (!trimmed || answerMutation.isPending) return;
    answerMutation.mutate(trimmed);
  };

  const backButton = (
    <Link to="/agents">
      <Button variant="ghost" size="sm" className="gap-1.5">
        <ChevronLeft className="h-4 w-4" />
        Volver
      </Button>
    </Link>
  );

  // Starting state — no interview yet
  if (isNew) {
    return (
      <DashboardShell navigationOverride={tenantNavigation}>
        <PageHeader
          title="Brand Analyst"
          description="Entrevista guiada para entender tu marca y generar un Brand Brief profesional."
          actions={backButton}
        />

        <Card className="mx-auto mt-6 max-w-xl text-center">
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
              <Bot className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-[var(--foreground)]">
              Brand Analyst
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-[var(--foreground-muted)]">
              Te haré 6 preguntas sobre tu empresa, audiencia, competencia y objetivos.
              Al finalizar, generaré un Brand Brief completo y actualizaré tu perfil de empresa.
            </p>
            <Button
              size="lg"
              loading={createMutation.isPending}
              onClick={() => createMutation.mutate()}
              className="mt-4 gap-2"
            >
              <Sparkles className="h-5 w-5" />
              Iniciar entrevista
            </Button>
          </div>
        </Card>
      </DashboardShell>
    );
  }

  // Loading state
  if (interviewQuery.isLoading) {
    return (
      <DashboardShell navigationOverride={tenantNavigation}>
        <div className="py-20 text-center text-[var(--foreground-muted)]">
          Cargando entrevista...
        </div>
      </DashboardShell>
    );
  }

  // Error state
  if (!activeInterview) {
    return (
      <DashboardShell navigationOverride={tenantNavigation}>
        <div className="py-20 text-center">
          <p className="text-[var(--destructive)]">No se encontró la entrevista</p>
          <Link to="/agents/brand-interview" className="mt-4 inline-block">
            <Button variant="outline">Iniciar nueva</Button>
          </Link>
        </div>
      </DashboardShell>
    );
  }

  const isProcessing = activeInterview.messages.some((m) => m.metadata?.type === 'processing');
  const isCompleted = activeInterview.status === 'completed';
  const isFailed = activeInterview.status === 'failed';
  const canAnswer =
    activeInterview.status === 'in_progress' &&
    !isProcessing &&
    !answerMutation.isPending;

  return (
    <DashboardShell navigationOverride={tenantNavigation}>
      <PageHeader
        title="Brand Analyst"
        description={`Paso ${activeInterview.currentStep} de ${activeInterview.totalSteps}`}
        actions={
          <Link to="/agents">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ChevronLeft className="h-4 w-4" />
              Agentes
            </Button>
          </Link>
        }
      />

      <Card className="mx-auto mt-4 flex max-w-2xl flex-col overflow-hidden" style={{ height: '70vh' }}>
        {/* Messages */}
        <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-6">
          {activeInterview.messages.map((msg) => {
            const isAgent = msg.role === 'agent';
            const isSystem = msg.role === 'system';
            const isError = msg.metadata?.type === 'error';

            if (isSystem && isError) {
              return (
                <div
                  key={msg.id}
                  className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  {msg.content}
                </div>
              );
            }

            if (isSystem) return null;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isAgent ? '' : 'flex-row-reverse'}`}
              >
                {isAgent && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    isAgent
                      ? 'rounded-bl-sm bg-[var(--secondary)] text-[var(--foreground)]'
                      : 'rounded-br-sm bg-[var(--primary)] text-[var(--primary-foreground)]'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}

          {isProcessing && (
            <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
              <div className="flex h-8 w-8 items-center justify-center">
                <Sparkles className="h-4 w-4 animate-pulse text-violet-500" />
              </div>
              Analizando respuestas...
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Brand Brief (completed) */}
        {isCompleted && activeInterview.brandBrief && (
          <div className="border-t border-[var(--border)] bg-[var(--background-secondary)] p-6">
            <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-[var(--primary)]">
              📄 Brand Brief generado
            </h3>
            <pre className="max-h-panel-sm overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-[var(--card)] p-4 text-xs text-[var(--foreground-muted)]">
              {JSON.stringify(activeInterview.brandBrief, null, 2)}
            </pre>
            <p className="mt-3 text-xs text-[var(--foreground-subtle)]">
              Los campos clave se actualizaron en tu perfil de empresa.
            </p>
          </div>
        )}

        {/* Error info */}
        {isFailed && (
          <div className="border-t border-[var(--border)] p-4 text-center text-sm text-[var(--destructive)]">
            {activeInterview.errorMessage ?? 'Error al generar el Brand Brief.'}
          </div>
        )}

        {/* Input */}
        <div className="flex items-center gap-2 border-t border-[var(--border)] p-4">
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              isCompleted
                ? 'Entrevista completada'
                : isProcessing
                  ? 'Analizando respuestas...'
                  : 'Escribe tu respuesta...'
            }
            disabled={!canAnswer}
            className="h-10 flex-1 rounded-full border border-[var(--border)] bg-[var(--input)] px-4 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!canAnswer || !answer.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </Card>
    </DashboardShell>
  );
}