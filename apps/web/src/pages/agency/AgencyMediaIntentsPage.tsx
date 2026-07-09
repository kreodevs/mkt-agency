import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { Button } from '@/components/atoms/Button';
import { StatusPill } from '@/components/atoms/StatusPill';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import {
  approveMediaIntent,
  launchMediaIntentManual,
  listMediaIntents,
} from '@/services/paid-media';

const STATUS_LABELS: Record<string, string> = {
  pending_approval: 'Pendiente aprobación',
  approved: 'Aprobado',
  launched_manual: 'Lanzado (manual)',
  draft: 'Borrador',
};

export default function AgencyMediaIntentsPage() {
  const queryClient = useQueryClient();

  const intentsQuery = useQuery({
    queryKey: ['media-intents'],
    queryFn: listMediaIntents,
  });

  const approveMutation = useMutation({
    mutationFn: approveMediaIntent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-intents'] });
      queryClient.invalidateQueries({ queryKey: ['agency-events'] });
      toast.success('Intent aprobado');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Error al aprobar');
    },
  });

  const launchMutation = useMutation({
    mutationFn: launchMediaIntentManual,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-intents'] });
      queryClient.invalidateQueries({ queryKey: ['agency-events'] });
      toast.success('Marcado como lanzado manualmente');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Error al registrar lanzamiento');
    },
  });

  return (
    <DashboardShell>
      <PageHeader
        title="Pauta (manual)"
        description="Intents generados por Media Buyer sin API de ads. Aprueba y ejecuta en Ads Manager."
      />

      <Card title="Intents de campaña" subtitle="Sin integración Meta/Google — estructura lista para copiar">
        {intentsQuery.isLoading && (
          <p className="text-sm text-[var(--foreground-muted)]">Cargando…</p>
        )}

        <ul className="space-y-4">
          {(intentsQuery.data ?? []).map((intent) => {
            const adSets = Array.isArray(
              (intent.structure as { adSets?: unknown[] }).adSets,
            )
              ? ((intent.structure as { adSets: unknown[] }).adSets as Array<Record<string, unknown>>)
              : [];

            return (
              <li
                key={intent.id}
                className="rounded-md border border-[var(--border)] p-4 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{intent.name}</p>
                    <p className="text-xs text-[var(--foreground-muted)]">
                      {intent.platform} · {new Date(intent.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <StatusPill
                    status={
                      intent.status === 'launched_manual'
                        ? 'success'
                        : intent.status === 'pending_approval'
                          ? 'warning'
                          : 'info'
                    }
                  >
                    {STATUS_LABELS[intent.status] ?? intent.status}
                  </StatusPill>
                </div>

                {(intent.dailyBudget != null || intent.totalBudget != null) && (
                  <p className="mt-2 text-xs text-[var(--foreground-muted)]">
                    Presupuesto sugerido:{' '}
                    {intent.dailyBudget != null && `${intent.dailyBudget}/día`}
                    {intent.dailyBudget != null && intent.totalBudget != null && ' · '}
                    {intent.totalBudget != null && `${intent.totalBudget}/mes plataforma`}
                  </p>
                )}

                {adSets.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {adSets.map((set, index) => {
                      const copy = set.copy as Record<string, string> | undefined;
                      return (
                        <div
                          key={index}
                          className="rounded border border-[var(--border)] bg-[var(--background-muted)] p-2 text-xs"
                        >
                          <p className="font-medium">{String(set.name ?? `Ad Set ${index + 1}`)}</p>
                          {copy?.headline && <p>{copy.headline}</p>}
                          {copy?.primaryText && (
                            <p className="text-[var(--foreground-muted)]">{copy.primaryText}</p>
                          )}
                          {copy?.cta && <p className="mt-1">CTA: {copy.cta}</p>}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {intent.status === 'pending_approval' && (
                    <Button
                      size="sm"
                      disabled={approveMutation.isPending}
                      onClick={() => approveMutation.mutate(intent.id)}
                    >
                      Aprobar
                    </Button>
                  )}
                  {intent.status === 'approved' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={launchMutation.isPending}
                      onClick={() => launchMutation.mutate(intent.id)}
                    >
                      Marcar lanzado manual
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {(intentsQuery.data ?? []).length === 0 && !intentsQuery.isLoading && (
          <p className="text-sm text-[var(--foreground-muted)]">
            Aprueba un plan estratégico con perfil Growth + pauta para generar intents desde el
            Creative Pack.
          </p>
        )}
      </Card>
    </DashboardShell>
  );
}
