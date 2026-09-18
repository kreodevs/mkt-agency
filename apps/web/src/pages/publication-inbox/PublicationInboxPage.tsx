import { useEffect, useMemo, useRef, useState } from 'react';
import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays, ClipboardCheck, Layers, PartyPopper, Send, Trash2, Users, XCircle,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { InboxItemCard } from '@/components/publication-inbox/InboxItemCard';
import { InboxNotificationList } from '@/components/publication-inbox/InboxNotificationList';
import { InboxSidebar } from '@/components/publication-inbox/InboxSidebar';
import {
  InboxRejectFollowUpDialog, type InboxRejectFollowUpContext,
} from '@/components/publication-inbox/InboxRejectFollowUpDialog';
import { InboxPurgeDialog } from '@/components/publication-inbox/InboxPurgeDialog';
import { InboxContentDeleteDialog } from '@/components/publication-inbox/InboxContentDeleteDialog';
import { TodayPublishPanel } from '@/components/publication-inbox/TodayPublishPanel';
import { SohoResultsBanner } from '@/components/publication-inbox/SohoResultsBanner';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';
import { EmptyState } from '@/components/molecules/EmptyState';
import { PageHeader } from '@/components/molecules/PageHeader';
import { StatsCard } from '@/components/molecules/StatsCard';
import { InboxPageSkeleton } from '@/components/molecules/PageSkeleton';
import { AiThinkingPanel } from '@/components/molecules/AiThinkingPanel';
import { StaggerGroup } from '@/components/molecules/Reveal';
import { toast } from '@/components/molecules/Sonner';
import { useInboxKeyboardHints } from '@/hooks/useInboxKeyboardHints';
import { useInboxNewContentIds } from '@/hooks/useInboxNewContentIds';
import { useSohoBrowserNotifications } from '@/hooks/useSohoBrowserNotifications';
import { clearNewInboxContentId } from '@/lib/inbox-new-items';
import { excludeTodayFromPending, getTodayContentIds } from '@/lib/inbox-today.util';
import { sortInboxItemsNewestFirst } from '@/lib/inbox-sort.util';
import {
  bulkApproveInbox, bulkDeleteInboxContents, getPublicationInbox, getSohoSummary,
  markAllNotificationsRead, markNotificationRead,
} from '@/services/publication-inbox';
import { useActiveProductStore } from '@/store/active-product';
import { useAdvancedNav, useCopilotUiStore } from '@/store/copilot-ui';
import { useOperatingProfile } from '@/hooks/useOperatingProfile';
import {
  inboxNeedsHealSync, inboxQueryKey, isCopilotPrepareWeekMutation, syncInboxAfterGeneration,
} from '@/lib/inbox-sync.util';

export default function PublicationInboxPage() {
  const queryClient = useQueryClient();
  const advancedNav = useAdvancedNav();
  const { isSoho } = useOperatingProfile();
  const advancedGuideDismissed = useCopilotUiStore((s) => s.advancedGuideDismissed);
  const dismissAdvancedGuide = useCopilotUiStore((s) => s.dismissAdvancedGuide);
  const sohoMode = !advancedNav;
  const showCopilotAgents = sohoMode || isSoho;
  const [searchParams, setSearchParams] = useSearchParams();
  const activeProductId = useActiveProductStore((s) => s.productId);
  const setActiveProduct = useActiveProductStore((s) => s.setActiveProduct);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rejectFollowUp, setRejectFollowUp] = useState<InboxRejectFollowUpContext | null>(null);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const welcome = searchParams.get('welcome') === '1';
  const urlProductId = searchParams.get('productId');

  useEffect(() => {
    if (urlProductId) setActiveProduct(urlProductId);
  }, [urlProductId, setActiveProduct]);

  const prepareWeekInFlight = useIsMutating({
    predicate: (mutation) => isCopilotPrepareWeekMutation(mutation.options.mutationKey),
  }) > 0;
  const wasPreparingRef = useRef(false);

  const inboxQuery = useQuery({
    queryKey: inboxQueryKey(activeProductId),
    queryFn: () => getPublicationInbox(activeProductId ?? undefined),
    refetchInterval: (query) => {
      if (prepareWeekInFlight) return 3000;
      if (inboxNeedsHealSync(query.state.data, activeProductId)) return 3000;
      return false;
    },
  });

  useEffect(() => {
    if (wasPreparingRef.current && !prepareWeekInFlight) {
      void syncInboxAfterGeneration(queryClient, activeProductId, 1);
    }
    wasPreparingRef.current = prepareWeekInFlight;
  }, [prepareWeekInFlight, queryClient, activeProductId]);

  useEffect(() => {
    if (!welcome) return;
    void queryClient.refetchQueries({ queryKey: ['publication-inbox'] });
    void queryClient.refetchQueries({ queryKey: ['soho-summary'] });
  }, [welcome, queryClient]);

  useEffect(() => {
    if (inboxQuery.isSuccess && window.location.hash === '#inbox-notifications') {
      document.getElementById('inbox-notifications')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [inboxQuery.isSuccess]);

  const sohoSummaryQuery = useQuery({
    queryKey: ['soho-summary', activeProductId],
    queryFn: () => getSohoSummary(activeProductId ?? undefined),
  });

  const bulkApproveMutation = useMutation({
    mutationFn: (ids: string[]) => bulkApproveInbox(ids),
    onSuccess: (result, ids) => {
      ids.forEach((contentId) => clearNewInboxContentId(activeProductId, contentId));
      void queryClient.invalidateQueries({ queryKey: ['publication-inbox'] });
      void queryClient.invalidateQueries({ queryKey: ['calendar'] });
      setSelectedIds(new Set());
      if (result.approved > 0) toast.success(`${result.approved} publicación(es) aprobada(s)`);
      if (result.failed.length > 0) toast.error(`${result.failed.length} no se pudieron aprobar`);
    },
    onError: () => toast.error('No se pudo aprobar en lote'),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => bulkDeleteInboxContents(ids),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['publication-inbox'] });
      void queryClient.invalidateQueries({ queryKey: ['calendar'] });
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      if (result.deleted > 0) toast.success(`${result.deleted} publicación(es) eliminada(s)`);
      if (result.failed.length > 0) toast.error(`${result.failed.length} no se pudieron eliminar`);
    },
    onError: () => toast.error('No se pudo eliminar en lote'),
  });

  const dismissWelcome = () => {
    searchParams.delete('welcome');
    setSearchParams(searchParams, { replace: true });
  };

  const data = inboxQuery.data;
  const pending = data?.pendingApproval ?? [];
  const ready = data?.readyToPublish ?? [];
  const upcoming = data?.upcoming ?? [];
  const rejected = data?.rejected ?? [];
  const notifications = data?.notifications ?? [];
  const todayIds = useMemo(() => getTodayContentIds(pending, ready), [pending, ready]);
  const pendingRest = useMemo(
    () => sortInboxItemsNewestFirst(excludeTodayFromPending(pending, todayIds)),
    [pending, todayIds],
  );
  const newContentIds = useInboxNewContentIds(activeProductId);

  useSohoBrowserNotifications(notifications, sohoMode);
  useInboxKeyboardHints(sohoMode);

  const allPendingSelected = useMemo(
    () => pendingRest.length > 0 && pendingRest.every((item) => selectedIds.has(item.contentId)),
    [pendingRest, selectedIds],
  );

  const toggleSelect = (contentId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(contentId)) next.delete(contentId);
      else next.add(contentId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allPendingSelected) { setSelectedIds(new Set()); return; }
    setSelectedIds(new Set(pendingRest.map((item) => item.contentId)));
  };

  const handleMarkRead = (id: string) => {
    void markNotificationRead(id).then(() => queryClient.invalidateQueries({ queryKey: ['publication-inbox'] }));
  };

  const handleMarkAllRead = () => {
    void markAllNotificationsRead().then(() => {
      queryClient.invalidateQueries({ queryKey: ['publication-inbox'] });
      toast.message('Notificaciones marcadas como leídas');
    });
  };

  if (inboxQuery.isLoading) {
    return (
      <DashboardShell>
        <PageHeader title={sohoMode ? 'Tu copiloto de marketing' : 'Tu bandeja'} description="Preparar · Revisar · Publicar" />
        <InboxPageSkeleton />
      </DashboardShell>
    );
  }

  const summary = sohoSummaryQuery.data;

  return (
    <DashboardShell>
      <PageHeader
        eyebrow={sohoMode ? 'Modo copiloto' : 'Bandeja editorial'}
        title={sohoMode ? 'Tu copiloto de marketing' : 'Tu bandeja'}
        description="Preparar · Revisar · Publicar — el copiloto orquesta; tú apruebas y publicas"
        actions={
          <div className="flex flex-wrap items-center gap-[var(--spacing-sm)]">
            {!sohoMode && (
              <Button type="button" variant="outline" size="sm" className="gap-1.5 text-[var(--destructive)]"
                onClick={() => setPurgeOpen(true)}>
                <Trash2 className="h-4 w-4" /> Limpiar contenido
              </Button>
            )}
            <Link to="/calendario">
              <Button type="button" variant="outline" size="sm" className="gap-1.5">
                <CalendarDays className="h-4 w-4" /> Calendario
              </Button>
            </Link>
          </div>
        }
      />

      {sohoMode && (
        <div className="page-hero mb-[var(--spacing-lg)]">
          <div className="relative flex flex-col gap-[var(--spacing-sm)] pl-[var(--spacing-md)]">
            <p className="type-detail-xs font-semibold uppercase tracking-wider text-[var(--brand)]">Flujo diario</p>
            <p className="type-ui-sans-medium max-w-2xl text-[var(--foreground)]">Prepara la semana con IA, aprueba borradores y publica.</p>
            <p className="type-body-serif-s max-w-xl text-[var(--foreground-muted)]">El copiloto descubre competidores, genera copy y visuales.</p>
          </div>
        </div>
      )}

      {advancedNav && !advancedGuideDismissed && (
        <div className="mb-[var(--spacing-lg)] flex items-start gap-[var(--spacing-md)] rounded-[var(--radius-md)] border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-[var(--spacing-md)]">
          <Layers className="mt-0.5 h-5 w-5 shrink-0 text-[var(--primary)]" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-[var(--foreground)]">Vista completa activada</p>
            <p className="mt-[var(--spacing-xs)] text-[var(--foreground-muted)]">Tu flujo diario sigue en Inicio.</p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={dismissAdvancedGuide}>Entendido</Button>
        </div>
      )}

      {prepareWeekInFlight && (
        <div className="mb-[var(--spacing-lg)]">
          <AiThinkingPanel state="weaving" title="Tu copiloto está generando publicaciones"
            description="Aparecerán en «Por aprobar» en unos momentos." />
        </div>
      )}

      {summary && sohoMode && <SohoResultsBanner leadsToday={summary.leadsToday} leadsThisWeek={summary.leadsThisWeek} attributedLeadsThisWeek={summary.attributedLeadsThisWeek} />}

      {welcome && (
        <div className="mb-[var(--spacing-lg)] flex items-start gap-[var(--spacing-md)] rounded-[var(--radius-md)] border border-[var(--success)]/30 bg-[var(--success)]/5 p-[var(--spacing-md)]">
          <PartyPopper className="mt-0.5 h-5 w-5 shrink-0 text-[var(--success)]" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-[var(--success)]">¡Tu semana está lista!</p>
            <p className="mt-[var(--spacing-xs)] text-[var(--foreground-muted)]">
              Las más recientes están arriba; las recién generadas llevan la etiqueta «Nuevo».
            </p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={dismissWelcome}>Entendido</Button>
        </div>
      )}

      <InboxNotificationList notifications={notifications} onMarkRead={handleMarkRead} onMarkAllRead={handleMarkAllRead} />

      {!(sohoMode && summary) && (
        <div className="mb-[var(--spacing-lg)] grid gap-[var(--spacing-md)] sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Por aprobar" value={data?.stats.pendingCount ?? 0} icon={<ClipboardCheck className="h-5 w-5" />} iconTone="warning" />
          <StatsCard title="Listas para publicar" value={data?.stats.readyCount ?? 0} icon={<Send className="h-5 w-5" />} iconTone="success" />
          <StatsCard title="Rechazadas" value={data?.stats.rejectedCount ?? 0} icon={<XCircle className="h-5 w-5" />} iconTone="warning" />
          <StatsCard title="Contactos hoy" value={summary?.leadsToday ?? 0} description={summary ? `${summary.leadsThisWeek} esta semana` : undefined} icon={<Users className="h-5 w-5" />} iconTone="primary" />
        </div>
      )}

      <div className="grid gap-[var(--spacing-lg)] lg:grid-cols-3">
        <div className="space-y-[var(--spacing-lg)] lg:col-span-2 lg:order-1">
          <TodayPublishPanel pending={pending} ready={ready} strategyFocus={summary?.strategyFocus} />

          <Card id="inbox-pending" className="scroll-mt-24"
            title={todayIds.size > 0 ? 'Resto por aprobar' : 'Por aprobar'}
            subtitle={`${pendingRest.length} pieza(s) — más recientes arriba`}
          >
            {pendingRest.length === 0 ? (
              <EmptyState compact title={todayIds.size > 0 ? 'Nada más pendiente' : 'Sin pendientes'}
                description={todayIds.size > 0 ? 'Las piezas de hoy están arriba.' : 'No hay publicaciones pendientes.'} />
            ) : (
              <div className="space-y-[var(--spacing-md)]">
                {!sohoMode && (
                  <div className="flex flex-wrap items-center justify-between gap-[var(--spacing-sm)]">
                    <label className="flex items-center gap-[var(--spacing-sm)] text-xs text-[var(--foreground-muted)]">
                      <input type="checkbox" className="h-4 w-4 rounded-[var(--radius-sm)] border-[var(--border)]"
                        checked={allPendingSelected} onChange={toggleSelectAll} />
                      Seleccionar todas
                    </label>
                    <Button type="button" size="sm" disabled={selectedIds.size === 0 || bulkApproveMutation.isPending}
                      onClick={() => bulkApproveMutation.mutate([...selectedIds])}>
                      Aprobar ({selectedIds.size})
                    </Button>
                    <Button type="button" size="sm" variant="outline" className="text-[var(--destructive)]"
                      disabled={selectedIds.size === 0 || bulkDeleteMutation.isPending}
                      onClick={() => setBulkDeleteOpen(true)}>
                      Eliminar ({selectedIds.size})
                    </Button>
                  </div>
                )}
                <StaggerGroup className="space-y-[var(--spacing-md)]" stagger={80} variant="fade-up">
                  {pendingRest.map((item) => (
                    <InboxItemCard
                      key={item.contentId}
                      item={item}
                      isNew={newContentIds.has(item.contentId)}
                      selectable={!sohoMode}
                      selected={selectedIds.has(item.contentId)}
                      onToggleSelect={toggleSelect}
                      showApproval
                      showEditorLink={advancedNav}
                      sohoMode
                      onRejected={setRejectFollowUp}
                    />
                  ))}
                </StaggerGroup>
              </div>
            )}
          </Card>

          {rejected.length > 0 && (
            <Card title="Rechazadas" subtitle={`${rejected.length} pieza(s)`}>
              <StaggerGroup className="space-y-[var(--spacing-md)]" stagger={80} variant="fade-up">
                {rejected.map((item) => (
                  <InboxItemCard key={item.contentId} item={item} sohoMode onRejected={setRejectFollowUp} />
                ))}
              </StaggerGroup>
            </Card>
          )}

          {upcoming.length > 0 && (
            <Card title="Próximas" subtitle="Programadas a futuro">
              <StaggerGroup className="space-y-[var(--spacing-md)]" stagger={80} variant="fade-up">
                {upcoming.map((item) => <InboxItemCard key={item.contentId} item={item} sohoMode />)}
              </StaggerGroup>
            </Card>
          )}
        </div>

        <InboxSidebar productId={activeProductId} showCopilotAgents={showCopilotAgents} advancedNav={advancedNav} readyItems={ready} />
      </div>

      <InboxRejectFollowUpDialog context={rejectFollowUp} onClose={() => setRejectFollowUp(null)} />
      <InboxPurgeDialog open={purgeOpen} productId={activeProductId} onClose={() => setPurgeOpen(false)} />
      <InboxContentDeleteDialog open={bulkDeleteOpen} title="Eliminar seleccionadas"
        description={`¿Eliminar ${selectedIds.size} publicación(es)?`}
        loading={bulkDeleteMutation.isPending} onClose={() => setBulkDeleteOpen(false)}
        onConfirm={() => bulkDeleteMutation.mutate([...selectedIds])} />
    </DashboardShell>
  );
}
