import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CalendarClock,
  CheckCheck,
  ClipboardCheck,
  PartyPopper,
  Send,
  Users,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { CopilotStatusPanel } from '@/components/copilot/CopilotStatusPanel';
import { InboxItemCard } from '@/components/publication-inbox/InboxItemCard';
import { InboxKitPanel } from '@/components/publication-inbox/InboxKitPanel';
import { SohoResultsBanner } from '@/components/publication-inbox/SohoResultsBanner';
import { TodayPublishPanel } from '@/components/publication-inbox/TodayPublishPanel';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';
import { EmptyState } from '@/components/molecules/EmptyState';
import { PageHeader } from '@/components/molecules/PageHeader';
import { StatsCard } from '@/components/molecules/StatsCard';
import { toast } from '@/components/molecules/Sonner';
import { useSohoBrowserNotifications } from '@/hooks/useSohoBrowserNotifications';
import {
  bulkApproveInbox,
  getPublicationInbox,
  getSohoSummary,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/publication-inbox';
import { useActiveProductStore } from '@/store/active-product';
import { useAdvancedNav } from '@/store/copilot-ui';

export default function PublicationInboxPage() {
  const queryClient = useQueryClient();
  const advancedNav = useAdvancedNav();
  const sohoMode = !advancedNav;
  const [searchParams, setSearchParams] = useSearchParams();
  const activeProductId = useActiveProductStore((s) => s.productId);
  const setActiveProduct = useActiveProductStore((s) => s.setActiveProduct);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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

  const sohoSummaryQuery = useQuery({
    queryKey: ['soho-summary', activeProductId],
    queryFn: () => getSohoSummary(activeProductId ?? undefined),
    enabled: sohoMode,
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
  const notifications = data?.notifications ?? [];

  useSohoBrowserNotifications(notifications, sohoMode);

  const allPendingSelected = useMemo(
    () => pending.length > 0 && pending.every((item) => selectedIds.has(item.contentId)),
    [pending, selectedIds],
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
    setSelectedIds(new Set(pending.map((item) => item.contentId)));
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
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-[var(--foreground-muted)]">
          Cargando bandeja de publicación...
        </div>
      </DashboardShell>
    );
  }

  const summary = sohoSummaryQuery.data;
  const primaryAction = advancedNav ? 'edit' : 'copy';

  return (
    <DashboardShell>
      <PageHeader
        title={sohoMode ? 'Tu copiloto de marketing' : 'Bandeja de publicación'}
        description={
          advancedNav
            ? 'La agencia sugiere — tú apruebas y publicas manualmente'
            : 'Preparar · Revisar · Publicar — el copiloto hace el resto'
        }
      />

      {sohoMode && summary && (
        <SohoResultsBanner
          leadsToday={summary.leadsToday}
          leadsThisWeek={summary.leadsThisWeek}
          attributedLeadsThisWeek={summary.attributedLeadsThisWeek}
          strategyFocus={summary.strategyFocus}
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
        <Card className="mb-[var(--spacing-lg)]" title="Avisos" subtitle="Del copiloto">
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

      <div className="mb-[var(--spacing-lg)] grid gap-[var(--spacing-md)] sm:grid-cols-2 lg:grid-cols-4">
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
          title="Próximas"
          value={data?.stats.upcomingCount ?? 0}
          icon={<CalendarClock className="h-5 w-5" aria-hidden />}
          iconTone="accent"
        />
        <StatsCard
          title={sohoMode ? 'Contactos hoy' : 'Leads hoy'}
          value={summary?.leadsToday ?? 0}
          description={
            sohoMode && summary ? `${summary.leadsThisWeek} esta semana` : undefined
          }
          icon={<Users className="h-5 w-5" aria-hidden />}
          iconTone="primary"
        />
      </div>

      <div className="grid gap-[var(--spacing-lg)] lg:grid-cols-3">
        <div className="space-y-[var(--spacing-lg)] lg:col-span-2">
          {sohoMode && (
            <TodayPublishPanel
              pending={pending}
              ready={ready}
              strategyFocus={summary?.strategyFocus}
              primaryAction={primaryAction}
            />
          )}

          <Card
            title="Por aprobar"
            subtitle={`${pending.length} pieza(s) sugerida(s) por la agencia`}
          >
            {pending.length === 0 ? (
              <EmptyState
                compact
                title="Sin pendientes"
                description="No hay publicaciones pendientes de aprobación esta semana."
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

                {pending.map((item) => (
                  <InboxItemCard
                    key={item.contentId}
                    item={item}
                    selectable={!sohoMode}
                    selected={selectedIds.has(item.contentId)}
                    onToggleSelect={toggleSelect}
                    showApproval
                    primaryAction={primaryAction}
                    sohoMode={sohoMode}
                  />
                ))}
              </div>
            )}
          </Card>

          {!sohoMode && (
            <Card title="Próximas" subtitle="Programadas a futuro">
              {upcoming.length === 0 ? (
                <EmptyState
                  compact
                  title="Sin programación"
                  description="Sin publicaciones futuras en el calendario."
                />
              ) : (
                <div className="space-y-[var(--spacing-md)]">
                  {upcoming.map((item) => (
                    <InboxItemCard key={item.contentId} item={item} primaryAction={primaryAction} />
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-[var(--spacing-lg)]">
          <CopilotStatusPanel productId={activeProductId ?? undefined} />
          <InboxKitPanel items={ready} />

          {advancedNav && (
            <Card title="Acciones de la agencia" subtitle="Generar más contenido">
              <div className="space-y-[var(--spacing-sm)] text-sm">
                <Link
                  to={`/community${activeProductId ? `?productId=${activeProductId}` : ''}`}
                  className="flex items-center gap-[var(--spacing-sm)] rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--spacing-md)] transition-colors hover:border-[var(--primary)]"
                >
                  Generar más copy (Community Manager)
                </Link>
                <Link
                  to="/calendar"
                  className="flex items-center gap-[var(--spacing-sm)] rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--spacing-md)] transition-colors hover:border-[var(--primary)]"
                >
                  Ver calendario completo
                </Link>
                <Link
                  to="/agency-overview"
                  className="flex items-center gap-[var(--spacing-sm)] rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--spacing-md)] transition-colors hover:border-[var(--primary)]"
                >
                  Resumen de agencia (KPIs)
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
