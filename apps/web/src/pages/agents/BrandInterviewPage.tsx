import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, ChevronLeft, History, Sparkles } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BrandInterviewHistory } from '@/components/agents/BrandInterviewHistory';
import { BrandProductOnboardingPanel } from '@/components/agents/BrandProductOnboardingPanel';
import { BrandInterviewChat } from '@/components/agents/BrandInterviewChat';
import { ProductContextBanner } from '@/components/products/ProductContextBanner';
import { DashboardShell, tenantNavigation } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { Button } from '@/components/atoms/Button';
import { Select } from '@/components/atoms/Select';
import { MarkdownEditor } from '@/components/molecules/MarkdownEditor';
import { toast } from '@/components/molecules/Sonner';
import { AiThinkingPanel } from '@/components/molecules/AiThinkingPanel';
import { createInterview, getInterview, listInterviews, retryBrandBrief, submitAnswer } from '@/services/agents';
import { listProducts, getProduct } from '@/services/products';
import { useResolvedProductId } from '@/hooks/useResolvedProductId';
import { useActiveProductStore } from '@/store/active-product';
import { ApiError } from '@/services/api';
import type { AgentInterview } from '@/types/agents';
import { getEffectiveInterviewStatus, hasBrandBriefResult, isLegacyManualInterview, isOnboardingSourcedInterview } from '@/utils/brandInterview';

function isProcessing(interview: AgentInterview): boolean {
  if (interview.status !== 'in_progress') return false;
  if (interview.currentStep >= interview.totalSteps) return true;
  return interview.messages.some((m) => m.metadata?.type === 'processing');
}

export default function BrandInterviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [answer, setAnswer] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const resolvedProductId = useResolvedProductId();
  const setActiveProduct = useActiveProductStore((s) => s.setActiveProduct);

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: () => listProducts({ status: 'active', limit: 100 }),
    enabled: !id,
  });
  const products = productsQuery.data?.items ?? [];

  useEffect(() => {
    if (resolvedProductId && !selectedProductId) setSelectedProductId(resolvedProductId);
    if (!selectedProductId && products.length > 0) {
      const primary = products.find((p) => p.isPrimary) ?? products[0];
      setSelectedProductId(primary.id);
      setActiveProduct(primary.id, primary.name);
    }
  }, [products, selectedProductId, resolvedProductId, setActiveProduct]);

  const interviewQuery = useQuery({
    queryKey: ['agent-interview', id],
    queryFn: () => getInterview(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data && isProcessing(data) ? 3000 : false;
    },
  });

  const interviewsQuery = useQuery({
    queryKey: ['agent-interviews'],
    queryFn: listInterviews,
    enabled: !id,
    select: (items) =>
      items
        .filter((item) => item.agentType === 'brand_interview')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  });

  const brandInterviews = interviewsQuery.data ?? [];
  const inProgressInterview = useMemo(() => {
    const candidate = brandInterviews.find((item) => item.status === 'in_progress');
    if (!candidate) return undefined;
    if (isLegacyManualInterview(candidate) && candidate.productId) {
      const product = products.find((p) => p.id === candidate.productId);
      if (product?.onboardingCompleted || product?.onboardingReady) return undefined;
    }
    return candidate;
  }, [brandInterviews, products]);

  const selectedProduct = useMemo(() => products.find((p) => p.id === selectedProductId), [products, selectedProductId]);
  const readyForBrief = Boolean(selectedProduct?.onboardingCompleted || selectedProduct?.onboardingReady);
  const needsOnboarding = Boolean(selectedProductId && selectedProduct && !readyForBrief);

  const activeInterview = id ? interviewQuery.data : undefined;

  const interviewProductQuery = useQuery({
    queryKey: ['product', activeInterview?.productId],
    queryFn: () => getProduct(activeInterview!.productId!),
    enabled: Boolean(id && activeInterview?.productId),
  });

  const createMutation = useMutation({
    mutationFn: () => createInterview('brand_interview', selectedProductId || undefined),
    onSuccess: (result) => {
      queryClient.setQueryData(['agent-interview', result.id], result);
      void queryClient.invalidateQueries({ queryKey: ['agent-interviews'] });
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      navigate(`/agents/brand-interview/${result.id}`, { replace: true });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        void interviewsQuery.refetch().then((r) => {
          const active = r.data?.find((item) => item.status === 'in_progress');
          if (active) navigate(`/agents/brand-interview/${active.id}`);
        });
        return;
      }
      toast.error(error instanceof ApiError ? error.message : 'Error al iniciar Brand Analyst');
    },
  });

  const manualMutation = useMutation({
    mutationFn: () => createInterview('brand_interview', selectedProductId || undefined),
    onSuccess: (result) => {
      queryClient.setQueryData(['agent-interview', result.id], result);
      void queryClient.invalidateQueries({ queryKey: ['agent-interviews'] });
      navigate(`/agents/brand-interview/${result.id}`, { replace: true });
    },
    onError: (error) => { toast.error(error instanceof ApiError ? error.message : 'No se pudo iniciar'); },
  });

  const answerMutation = useMutation({
    mutationFn: (text: string) => submitAnswer(activeInterview!.id, text),
    onSuccess: (result) => {
      queryClient.setQueryData(['agent-interview', result.id], result);
      void queryClient.invalidateQueries({ queryKey: ['agent-interviews'] });
      setAnswer('');
    },
    onError: (error) => { toast.error(error instanceof ApiError ? error.message : 'Error al enviar'); },
  });

  const retryMutation = useMutation({
    mutationFn: () => retryBrandBrief(activeInterview!.id),
    onSuccess: (result) => {
      queryClient.setQueryData(['agent-interview', result.id], result);
      void queryClient.invalidateQueries({ queryKey: ['agent-interviews'] });
      toast.success('Reintentando...');
    },
    onError: (error) => { toast.error(error instanceof ApiError ? error.message : 'No se pudo reintentar'); },
  });

  useEffect(() => {
    if (activeInterview && id && activeInterview.id !== id)
      navigate(`/agents/brand-interview/${activeInterview.id}`, { replace: true });
  }, [activeInterview?.id, id, navigate]);

  const handleSend = () => {
    const trimmed = answer.trim();
    if (!trimmed || answerMutation.isPending) return;
    answerMutation.mutate(trimmed);
  };

  const backLink = (
    <Link to="/agents">
      <Button variant="ghost" size="sm" className="gap-1.5">
        <ChevronLeft className="h-4 w-4" /> Volver
      </Button>
    </Link>
  );

  // Waiting for create
  if (!id && (createMutation.isPending || createMutation.isSuccess)) {
    return (
      <DashboardShell navigationOverride={tenantNavigation}>
        <AiThinkingPanel variant="centered" state="composing"
          title={readyForBrief ? 'Generando Brand Brief desde onboarding' : 'Preparando Brand Analyst'}
          description="La IA analiza tu producto y redacta el perfil de marca."
        />
      </DashboardShell>
    );
  }

  // Start screen — no interview yet
  if (!id) {
    const desc = selectedProductId
      ? needsOnboarding ? 'Configura tu producto analizando su página web.' : 'Genera el Brand Brief a partir del onboarding.'
      : 'Entrevista guiada para marcas sin producto concreto.';

    return (
      <DashboardShell navigationOverride={tenantNavigation}>
        <PageHeader title="Brand Analyst" description={desc} actions={backLink} />
        <div className="mx-auto mt-6 max-w-2xl space-y-6">
          {interviewsQuery.isLoading ? (
            <Card><div className="flex items-center gap-2 py-6 text-sm text-[var(--foreground-muted)]"><History className="h-4 w-4" /> Cargando historial...</div></Card>
          ) : (
            <BrandInterviewHistory interviews={brandInterviews} />
          )}

          <Card title={brandInterviews.length > 0 ? 'Brand Brief' : 'Brand Analyst'}>
            <div className="flex flex-col items-center gap-4 py-4 text-center sm:py-6">
              {brandInterviews.length === 0 && !needsOnboarding && (
                <div className="flex h-16 w-16 items-center justify-center rounded-[var(--radius-md)] border border-[var(--accent)]/20 bg-[var(--accent)]/10 shadow-sm">
                  <Bot className="h-8 w-8 text-[var(--brand)]" />
                </div>
              )}
              <p className="max-w-md text-sm leading-relaxed text-[var(--foreground-muted)]">
                {selectedProductId ? (readyForBrief ? (brandInterviews.length > 0 ? 'Regenera el Brand Brief.' : 'Usaremos los datos del onboarding.') : 'Cargando...')
                  : brandInterviews.length > 0 ? 'Inicia otra ronda.' : 'Selecciona un producto o usa marca general.'}
              </p>
              {!inProgressInterview && products.length > 0 && (
                <div className="w-full max-w-sm text-left">
                  <Select label="Producto" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}
                    placeholder="Marca general (entrevista manual)"
                    options={products.map((p) => ({ value: p.id, label: `${p.name}${p.onboardingCompleted ? ' · listo' : p.onboardingReady ? ' · datos completos' : ''}` }))}
                  />
                  {selectedProduct?.onboardingCompletionPercentage != null && (
                    <p className="mt-1 text-[11px] text-[var(--foreground-muted)]">Onboarding: {selectedProduct.onboardingCompletionPercentage}%</p>
                  )}
                </div>
              )}
              {inProgressInterview ? (
                <Link to={`/agents/brand-interview/${inProgressInterview.id}`}>
                  <Button className="gap-2"><Sparkles className="h-4 w-4" /> Continuar</Button>
                </Link>
              ) : readyForBrief && selectedProductId ? (
                <Button size="lg" loading={createMutation.isPending} onClick={() => createMutation.mutate()} className="gap-2">
                  <Sparkles className="h-5 w-5" /> Generar Brand Brief
                </Button>
              ) : !selectedProductId ? (
                <Button size="lg" loading={createMutation.isPending} onClick={() => createMutation.mutate()} className="gap-2">
                  <Sparkles className="h-5 w-5" /> Iniciar entrevista
                </Button>
              ) : null}
            </div>
          </Card>

          {needsOnboarding && selectedProductId && !inProgressInterview && (
            <div className="space-y-4">
              <BrandProductOnboardingPanel productId={selectedProductId} generatingBrief={createMutation.isPending} onGenerateBrief={() => createMutation.mutate()} />
              <Card title="Alternativa" subtitle="Si prefieres no usar la web del producto">
                <p className="mb-4 text-sm text-[var(--foreground-muted)]">Puedes responder 6 preguntas manualmente.</p>
                <Button variant="outline" className="gap-2" loading={manualMutation.isPending} onClick={() => manualMutation.mutate()}>
                  <Sparkles className="h-4 w-4" /> Entrevista manual
                </Button>
              </Card>
            </div>
          )}
        </div>
      </DashboardShell>
    );
  }

  // Loading interview
  if (interviewQuery.isLoading) {
    return (
      <DashboardShell navigationOverride={tenantNavigation}>
        <AiThinkingPanel variant="centered" state="working" title="Cargando entrevista" description="Recuperando mensajes." />
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

  // Active interview
  const status = getEffectiveInterviewStatus(activeInterview);
  const isInterviewProcessing = isProcessing(activeInterview);
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';
  const fromOnboarding = isOnboardingSourcedInterview(activeInterview);
  const interviewProductReady = Boolean(interviewProductQuery.data?.onboardingCompleted || interviewProductQuery.data?.onboardingReady);
  const showBrief = hasBrandBriefResult(activeInterview) && isCompleted;
  const isSending = answerMutation.isPending;
  const canAnswer = activeInterview.status === 'in_progress' && !isInterviewProcessing && !isSending && !fromOnboarding && !(isLegacyManualInterview(activeInterview) && interviewProductReady);
  const stepProgress = Math.min(100, Math.round((activeInterview.currentStep / activeInterview.totalSteps) * 100));

  return (
    <DashboardShell navigationOverride={tenantNavigation}>
      <PageHeader
        title="Brand Analyst"
        description={
          activeInterview.productName
            ? fromOnboarding ? `Brand Brief de ${activeInterview.productName}` : `Entrevista — paso ${Math.min(activeInterview.currentStep + 1, activeInterview.totalSteps)} de ${activeInterview.totalSteps}`
            : `Paso ${Math.min(activeInterview.currentStep + 1, activeInterview.totalSteps)} de ${activeInterview.totalSteps}`
        }
        actions={<Link to="/agents"><Button variant="ghost" size="sm" className="gap-1.5"><ChevronLeft className="h-4 w-4" /> Agentes</Button></Link>}
      />

      {activeInterview?.productId && <ProductContextBanner productId={activeInterview.productId} productName={activeInterview.productName} />}

      <BrandInterviewChat
        interview={activeInterview}
        isProcessing={isInterviewProcessing}
        isCompleted={isCompleted}
        isFailed={isFailed}
        isSending={isSending}
        canAnswer={canAnswer}
        stepProgress={stepProgress}
        answer={answer}
        onAnswerChange={setAnswer}
        onSend={handleSend}
        onRetry={() => retryMutation.mutate()}
        retryPending={retryMutation.isPending}
      />

      {showBrief && (
        <div className="mx-auto mt-3 max-w-2xl">
          <Card title="Brand Brief" subtitle="Resultado de tu entrevista">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-[var(--foreground-muted)]">
                Generado el {new Date(activeInterview.updatedAt).toLocaleString('es-MX', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
              <Link to="/onboarding" className="text-xs font-medium text-[var(--primary)] hover:underline">Ver perfil de empresa</Link>
            </div>
            <MarkdownEditor value={activeInterview.brandBriefMarkdown!} readOnly minHeight="420px" />
          </Card>
        </div>
      )}
    </DashboardShell>
  );
}
