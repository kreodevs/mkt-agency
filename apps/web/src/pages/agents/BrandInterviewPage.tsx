import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, ChevronLeft, FileText, History, Send, Sparkles } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BrandInterviewHistory } from '@/components/agents/BrandInterviewHistory';
import { DashboardShell, tenantNavigation } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { Button } from '@/components/atoms/Button';
import { MarkdownEditor } from '@/components/molecules/MarkdownEditor';
import { toast } from '@/components/molecules/Sonner';
import { Progress } from '@/components/molecules/Progress';
import { createInterview, getInterview, listInterviews, submitAnswer } from '@/services/agents';
import { ApiError } from '@/services/api';
import type { AgentInterview } from '@/types/agents';

function isInterviewProcessing(interview: AgentInterview): boolean {
  if (interview.status !== 'in_progress') return false;
  if (interview.currentStep >= interview.totalSteps) return true;
  return interview.messages.some((m) => m.metadata?.type === 'processing');
}

export default function BrandInterviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [answer, setAnswer] = useState('');

  const interviewQuery = useQuery({
    queryKey: ['agent-interview', id],
    queryFn: () => getInterview(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      return isInterviewProcessing(data) ? 3000 : false;
    },
  });

  const interviewsQuery = useQuery({
    queryKey: ['agent-interviews', 'brand_interview'],
    queryFn: listInterviews,
    enabled: !id,
    select: (items) =>
      items
        .filter((item) => item.agentType === 'brand_interview')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  });

  const brandInterviews = interviewsQuery.data ?? [];
  const inProgressInterview = useMemo(
    () => brandInterviews.find((item) => item.status === 'in_progress'),
    [brandInterviews],
  );
  const lastCompletedInterview = useMemo(
    () => brandInterviews.find((item) => item.status === 'completed'),
    [brandInterviews],
  );

  const activeInterview = id ? interviewQuery.data : undefined;

  const createMutation = useMutation({
    mutationFn: () => createInterview('brand_interview'),
    onSuccess: (result) => {
      queryClient.setQueryData(['agent-interview', result.id], result);
      void queryClient.invalidateQueries({ queryKey: ['agent-interviews', 'brand_interview'] });
      navigate(`/agents/brand-interview/${result.id}`, { replace: true });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        void interviewsQuery.refetch().then((result) => {
          const active = result.data?.find((item) => item.status === 'in_progress');
          if (active) {
            navigate(`/agents/brand-interview/${active.id}`);
            return;
          }
        });
      }
      toast.error(error instanceof ApiError ? error.message : 'Error al iniciar entrevista');
    },
  });

  const answerMutation = useMutation({
    mutationFn: (answerText: string) => submitAnswer(activeInterview!.id, answerText),
    onSuccess: (result) => {
      queryClient.setQueryData(['agent-interview', result.id], result);
      void queryClient.invalidateQueries({ queryKey: ['agent-interviews', 'brand_interview'] });
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

  if (!id && (createMutation.isPending || createMutation.isSuccess)) {
    return (
      <DashboardShell navigationOverride={tenantNavigation}>
        <div className="py-20 text-center text-[var(--foreground-muted)]">
          Preparando entrevista...
        </div>
      </DashboardShell>
    );
  }

  // Starting state — no interview yet
  if (!id) {
    return (
      <DashboardShell navigationOverride={tenantNavigation}>
        <PageHeader
          title="Brand Analyst"
          description="Entrevista guiada para entender tu marca y generar un Brand Brief profesional."
          actions={backButton}
        />

        <div className="mx-auto mt-6 max-w-2xl space-y-6">
          {(inProgressInterview || lastCompletedInterview) && (
            <Card title="Tus entrevistas" subtitle="Acceso rápido">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {inProgressInterview && (
                  <Link to={`/agents/brand-interview/${inProgressInterview.id}`}>
                    <Button className="w-full gap-2 sm:w-auto">
                      <Sparkles className="h-4 w-4" />
                      Continuar entrevista en progreso
                    </Button>
                  </Link>
                )}
                {lastCompletedInterview && (
                  <Link to={`/agents/brand-interview/${lastCompletedInterview.id}`}>
                    <Button variant="outline" className="w-full gap-2 sm:w-auto">
                      <FileText className="h-4 w-4" />
                      Ver mi última entrevista
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          )}

          <Card className="text-center">
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-[var(--foreground)]">
                {inProgressInterview ? 'Nueva entrevista' : 'Brand Analyst'}
              </h2>
              <p className="max-w-sm text-sm leading-relaxed text-[var(--foreground-muted)]">
                Te haré 6 preguntas sobre tu empresa, audiencia, competencia y objetivos.
                Al finalizar, generaré un Brand Brief en markdown y actualizaré tu perfil de empresa.
              </p>
              <Button
                size="lg"
                loading={createMutation.isPending}
                disabled={!!inProgressInterview}
                onClick={() => createMutation.mutate()}
                className="mt-2 gap-2"
              >
                <Sparkles className="h-5 w-5" />
                Iniciar entrevista
              </Button>
              {inProgressInterview && (
                <p className="text-xs text-[var(--foreground-muted)]">
                  Ya tienes una entrevista activa. Continúala arriba o complétala antes de iniciar otra.
                </p>
              )}
            </div>
          </Card>

          {interviewsQuery.isLoading ? (
            <Card>
              <div className="flex items-center gap-2 py-6 text-sm text-[var(--foreground-muted)]">
                <History className="h-4 w-4" />
                Cargando historial...
              </div>
            </Card>
          ) : (
            <BrandInterviewHistory interviews={brandInterviews} />
          )}
        </div>
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
  if (interviewQuery.isError || !activeInterview) {
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

  const isProcessing = isInterviewProcessing(activeInterview);
  const isCompleted = activeInterview.status === 'completed';
  const isFailed = activeInterview.status === 'failed';
  const isSending = answerMutation.isPending;
  const canAnswer =
    activeInterview.status === 'in_progress' &&
    !isProcessing &&
    !isSending;
  const stepProgress = Math.min(
    100,
    Math.round((activeInterview.currentStep / activeInterview.totalSteps) * 100),
  );

  return (
    <DashboardShell navigationOverride={tenantNavigation}>
      <PageHeader
        title="Brand Analyst"
        description={
          isProcessing
            ? 'Generando tu Brand Brief con IA...'
            : isSending
              ? 'Enviando respuesta...'
              : `Paso ${Math.min(activeInterview.currentStep + 1, activeInterview.totalSteps)} de ${activeInterview.totalSteps}`
        }
        actions={
          <Link to="/agents">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ChevronLeft className="h-4 w-4" />
              Agentes
            </Button>
          </Link>
        }
      />

      <div className="mx-auto mt-4 max-w-2xl space-y-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3">
          <div className="mb-2 flex items-center justify-between text-xs text-[var(--foreground-muted)]">
            <span>
              {isProcessing
                ? 'Analizando respuestas y redactando el brief'
                : isCompleted
                  ? 'Entrevista completada'
                  : `${activeInterview.currentStep} de ${activeInterview.totalSteps} preguntas respondidas`}
            </span>
            <span className="font-medium tabular-nums text-[var(--foreground)]">
              {isProcessing ? '…' : `${stepProgress}%`}
            </span>
          </div>
          <Progress
            value={isProcessing ? 100 : stepProgress}
            className={isProcessing ? '[&>div]:animate-pulse' : undefined}
          />
        </div>

      <Card className="flex max-w-2xl flex-col overflow-hidden" style={{ height: '62vh' }}>
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

          {(isProcessing || isSending) && (
            <div className="flex items-start gap-3 rounded-xl border border-violet-500/25 bg-violet-500/5 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
                <Sparkles className="h-4 w-4 animate-pulse text-white" />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {isSending ? 'Enviando tu respuesta...' : 'Generando Brand Brief'}
                </p>
                <p className="text-xs leading-relaxed text-[var(--foreground-muted)]">
                  {isSending
                    ? 'Un momento mientras registro tu respuesta.'
                    : 'La IA está analizando tus respuestas y actualizando tu perfil de marca. Suele tardar unos segundos.'}
                </p>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {isFailed && (
          <div className="border-t border-[var(--border)] p-4 text-center text-sm text-[var(--destructive)]">
            {activeInterview.errorMessage ?? 'Error al generar el Brand Brief.'}
          </div>
        )}

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
                : isSending
                  ? 'Enviando respuesta...'
                  : isProcessing
                    ? 'Generando Brand Brief...'
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

      {isCompleted && activeInterview.brandBriefMarkdown && (
        <Card title="Brand Brief" subtitle="Resultado de tu entrevista">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-[var(--foreground-muted)]">
              Generado el{' '}
              {new Date(activeInterview.updatedAt).toLocaleString('es-MX', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <Link
              to="/onboarding"
              className="text-xs font-medium text-[var(--primary)] hover:underline"
            >
              Ver perfil de empresa actualizado
            </Link>
          </div>
          <MarkdownEditor value={activeInterview.brandBriefMarkdown} readOnly minHeight="420px" />
        </Card>
      )}
      </div>
    </DashboardShell>
  );
}