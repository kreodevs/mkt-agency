import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CalendarDays,
  CheckCheck,
  ClipboardCheck,
  FolderOpen,
  Layers,
  PartyPopper,
  Send,
  Users,
  XCircle,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { CopilotStatusPanel } from '@/components/copilot/CopilotStatusPanel';
import { InboxItemCard } from '@/components/publication-inbox/InboxItemCard';
import {
  InboxRejectFollowUpDialog,
  type InboxRejectFollowUpContext,
} from '@/components/publication-inbox/InboxRejectFollowUpDialog';
import { InboxKitPanel } from '@/components/publication-inbox/InboxKitPanel';
import { SohoResultsBanner } from '@/components/publication-inbox/SohoResultsBanner';
import { TodayPublishPanel } from '@/components/publication-inbox/TodayPublishPanel';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';
import { EmptyState } from '@/components/molecules/EmptyState';
import { PageHeader } from '@/components/molecules/PageHeader';
import { StatsCard } from '@/components/molecules/StatsCard';
import { InboxPageSkeleton } from '@/components/molecules/PageSkeleton';
import { toast } from '@/components/molecules/Sonner';
import { useSohoBrowserNotifications } from '@/hooks/useSohoBrowserNotifications';
import { useInboxKeyboardHints } from '@/hooks/useInboxKeyboardHints';
import {
  excludeTodayFromPending,
  getTodayContentIds,
} from '@/lib/inbox-today.util';
import {
  bulkApproveInbox,
  getPublicationInbox,
  getSohoSummary,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/publication-inbox';
import { useActiveProductStore } from '@/store/active-product';
import { LIBRARY_ROUTE } from '@/lib/tenant-navigation';
import { useAdvancedNav, useCopilotUiStore } from '@/store/copilot-ui';

export default function PublicationInboxPage() {
  const queryClient = useQueryClient();
  const advancedNav = useAdvancedNav();
  const advancedGuideDismissed = useCopilotUiStore((s) => s.advancedGuideDismissed);
  const dismissAdvancedGuide = useCopilotUiStore((s) => s.dismissAdvancedGuide);
  const sohoMode = !advancedNav;
  const [searchParams, setSearchParams] = useSearchParams();
  const activeProductId = useActiveProductStore((s) => s.productId);
  const setActiveProduct = useActiveProductStore((s) => s.setActiveProduct);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rejectFollowUp, setRejectFollowUp] = useState<InboxRejectFollowUpContext | null>(null);
  const welcome = searchParams.get('welcome') === '1';
  const urlProductId = searchParams.get('productId');

  useEffect(() => {
    if (urlProductId) {
      setActiveProduct(urlProductId);
    }
  }, [urlProductId, setActiveProduct]);

  const inboxQuery = useQuery({
    queryKey: ['publication-inbox', activeProductId],
    queryFn: () => getPublicationInbox(activeProductId ?? undefined),
  });

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
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['publication-inbox'] });
      void queryClient.invalidateQueries({ queryKey: ['calendar'] });
      setSelectedIds(new Set());
      if (result.approved > 0) {
        toast.success(`${result.approved} publicación(es) aprobada(s)`);
      }
      if (result.failed.length > 0) {
        toast.error(`${result.failed.length} no se pudieron aprobar`);
      }
    },
    onError: () => toast.error('No se pudo aprobar en lote'),
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
    () => excludeTodayFromPending(pending, todayIds),
    [pending, todayIds],
  );

  const handleRejected = (context: InboxRejectFollowUpContext) => {
    setRejectFollowUp(context);
  };

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
    if (allPendingSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(pendingRest.map((item) => item.contentId)));
  };

  const handleMarkNotificationRead = async (id: string) => {
    await markNotificationRead(id);
    void queryClient.invalidateQueries({ queryKey: ['publication-inbox'] });
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    void queryClient.invalidateQueries({ queryKey: ['publication-inbox'] });
    toast.message('Notificaciones marcadas como leídas');
  };

  if (inboxQuery.isLoading) {
    return (
      <DashboardShell>
        <PageHeader
          title={sohoMode ? 'Tu copiloto de marketing' : 'Tu bandeja'}
          description="Preparar · Revisar · Publicar — el copiloto orquesta; tú apruebas y publicas"
        />
        <InboxPageSkeleton />
      </DashboardShell>
    );
  }

  const summary = sohoSummaryQuery.data;

  return (
    <DashboardShell>
      <PageHeader
        title={sohoMode ? 'Tu copiloto de marketing' : 'Tu bandeja'}
        description="Preparar · Revisar · Publicar — el copiloto orquesta; tú apruebas y publicas"
        actions={
          <Link to="/calendario">
            <Button type="button" variant="outline" size="sm" className="gap-1.5">
              <CalendarDays className="h-4 w-4" />
              Calendario
            </Button>
          </Link>
        }
      />

      {advancedNav && !advancedGuideDismissed && (
        <div className="mb-[var(--spacing-lg)] flex items-start gap-[var(--spacing-md)] rounded-[var(--radius-md)] border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-[var(--spacing-md)]">
          <Layers className="mt-0.5 h-5 w-5 shrink-0 text-[var(--primary)]" aria-hidden />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-[var(--foreground)]">Vista completa activada</p>
            <p className="mt-[var(--spacing-xs)] text-[var(--foreground-muted)]">
              Tu flujo diario sigue en <strong>Inicio</strong>: prepara la semana, aprueba y copia
              para publicar. <strong>Resumen</strong> muestra KPIs; el resto son herramientas cuando
              las necesites.
            </p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={dismissAdvancedGuide}>
            Entendido
          </Button>
        </div>
      )}

      {summary && sohoMode && (
        <SohoResultsBanner
          leadsToday={summary.leadsToday}
          leadsThisWeek={summary.leadsThisWeek}
          attributedLeadsThisWeek={summary.attributedLeadsThisWeek}
        />
      )}

      {welcome && (
        <div className="mb-[var(--spacing-lg)] flex items-start gap-[var(--spacing-md)] rounded-[var(--radius-md)] border border-[var(--success)]/30 bg-[var(--success)]/5 p-[var(--spacing-md)]">
          <PartyPopper className="mt-0.5 h-5 w-5 shrink-0 text-[var(--success)]" aria-hidden />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-[var(--success)]">¡Tu semana está lista!</p>
            <p className="mt-[var(--spacing-xs)] text-[var(--foreground-muted)]">
              Revisa lo de hoy, aprueba lo que te guste y usa Copiar texto + Abrir red para publicar.
            </p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={dismissWelcome}>
            Entendido
          </Button>
        </div>
      )}

      {notifications.length > 0 && (
        <Card
          id="inbox-notifications"
          className="mb-[var(--spacing-lg)] scroll-mt-24"
          title="Avisos"
          subtitle="Del copiloto"
        >
          <div className="mb-[var(--spacing-md)] flex justify-end">
            <Button type="button" size="sm" variant="ghost" onClick={() => void handleMarkAllRead()}>
              <CheckCheck className="mr-1 h-4 w-4" />
              Marcar todas leídas
            </Button>
          </div>
          <ul className="space-y-[var(--spacing-sm)]">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className="flex items-start gap-[var(--spacing-md)] rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--spacing-md)]"
              >
                <Bell className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--foreground)]">{notification.title}</p>
                  <p className="text-xs text-[var(--foreground-muted)]">{notification.body}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void handleMarkNotificationRead(notification.id)}
                >
                  Leído
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div
        className={`mb-[var(--spacing-lg)] grid gap-[var(--spacing-md)] ${
          sohoMode && summary
            ? 'sm:grid-cols-2 lg:grid-cols-3'
            : 'sm:grid-cols-2 lg:grid-cols-4'
        }`}
      >
        <StatsCard
          title="Por aprobar"
          value={data?.stats.pendingCount ?? 0}
          icon={<ClipboardCheck className="h-5 w-5" aria-hidden />}
          iconTone="warning"
        />
        <StatsCard
          title="Listas para publicar"
          value={data?.stats.readyCount ?? 0}
          icon={<Send className="h-5 w-5" aria-hidden />}
          iconTone="success"
        />
        <StatsCard
          title="Rechazadas"
          value={data?.stats.rejectedCount ?? 0}
          icon={<XCircle className="h-5 w-5" aria-hidden />}
          iconTone="warning"
        />
        {!(sohoMode && summary) ? (
          <StatsCard
            title="Contactos hoy"
            value={summary?.leadsToday ?? 0}
            description={summary ? `${summary.leadsThisWeek} esta semana` : undefined}
            icon={<Users className="h-5 w-5" aria-hidden />}
            iconTone="primary"
          />
        ) : null}
      </div>

      <div className="grid gap-[var(--spacing-lg)] lg:grid-cols-3">
        <div className="space-y-[var(--spacing-lg)] lg:col-span-2 lg:order-1">
          <TodayPublishPanel
            pending={pending}
            ready={ready}
            strategyFocus={summary?.strategyFocus}
          />

          <Card
            title={todayIds.size > 0 ? 'Resto por aprobar' : 'Por aprobar'}
            subtitle={`${pendingRest.length} pieza(s) sugerida(s) por la agencia`}
          >
            {pendingRest.length === 0 ? (
              <EmptyState
                compact
                title={todayIds.size > 0 ? 'Nada más pendiente esta semana' : 'Sin pendientes'}
                description={
                  todayIds.size > 0
                    ? 'Las piezas de hoy están arriba en «Hoy publicas esto».'
                    : 'No hay publicaciones pendientes de aprobación esta semana.'
                }
              />
            ) : (
              <div className="space-y-[var(--spacing-md)]">
                {!sohoMode && (
                  <div className="flex flex-wrap items-center justify-between gap-[var(--spacing-sm)]">
                    <label className="flex items-center gap-[var(--spacing-sm)] text-xs text-[var(--foreground-muted)]">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded-[var(--radius-sm)] border-[var(--border)]"
                        checked={allPendingSelected}
                        onChange={toggleSelectAll}
                      />
                      Seleccionar todas
                    </label>
                    <Button
                      type="button"
                      size="sm"
                      disabled={selectedIds.size === 0 || bulkApproveMutation.isPending}
                      onClick={() => bulkApproveMutation.mutate([...selectedIds])}
                    >
                      Aprobar seleccionadas ({selectedIds.size})
                    </Button>
                  </div>
                )}

                {pendingRest.map((item) => (
                  <InboxItemCard
                    key={item.contentId}
                    item={item}
                    selectable={!sohoMode}
                    selected={selectedIds.has(item.contentId)}
                    onToggleSelect={toggleSelect}
                    showApproval
                    showEditorLink={advancedNav}
                    sohoMode
                    onRejected={handleRejected}
                  />
                ))}
              </div>
            )}
          </Card>

          {rejected.length > 0 && (
            <Card
              title="Rechazadas"
              subtitle={`${rejected.length} pieza(s) — prueba otro formato o archívalas`}
            >
              <div className="space-y-[var(--spacing-md)]">
                {rejected.map((item) => (
                  <InboxItemCard
                    key={item.contentId}
                    item={item}
                    sohoMode
                    onRejected={handleRejected}
                  />
                ))}
              </div>
            </Card>
          )}

          {upcoming.length > 0 && (
            <Card title="Próximas" subtitle="Programadas a futuro">
              <div className="space-y-[var(--spacing-md)]">
                {upcoming.map((item) => (
                  <InboxItemCard key={item.contentId} item={item} sohoMode />
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-[var(--spacing-lg)] lg:order-2">
          <CopilotStatusPanel productId={activeProductId ?? undefined} />
          <InboxKitPanel items={ready} />

          <Card
            title="Librería multimedia"
            subtitle="Sube logos, fotos y material para tus publicaciones"
          >
            <Link
              to={LIBRARY_ROUTE}
              className="flex items-center gap-[var(--spacing-sm)] rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--spacing-md)] text-sm transition-colors hover:border-[var(--primary)]"
            >
              <FolderOpen className="h-4 w-4 shrink-0 text-[var(--primary)]" />
              Abrir librería de assets
            </Link>
          </Card>

          {advancedNav && (
            <Card title="Más herramientas" subtitle="Cuando necesites ir más allá del flujo diario">
              <div className="space-y-[var(--spacing-sm)] text-sm">
                <Link
                  to="/agency-overview"
                  className="flex items-center gap-[var(--spacing-sm)] rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--spacing-md)] transition-colors hover:border-[var(--primary)]"
                >
                  Resumen y KPIs
                </Link>
                <Link
                  to={`/community${activeProductId ? `?productId=${activeProductId}` : ''}`}
                  className="flex items-center gap-[var(--spacing-sm)] rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--spacing-md)] transition-colors hover:border-[var(--primary)]"
                >
                  Generar copy manual (Community Manager)
                </Link>
                <Link
                  to="/calendar"
                  className="flex items-center gap-[var(--spacing-sm)] rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--spacing-md)] transition-colors hover:border-[var(--primary)]"
                >
                  Calendario editorial
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>

      <InboxRejectFollowUpDialog
        context={rejectFollowUp}
        onClose={() => setRejectFollowUp(null)}
      />
    </DashboardShell>
  );
}
