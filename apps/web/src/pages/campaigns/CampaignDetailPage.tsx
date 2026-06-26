import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/atoms/Button';
import { StatusPill } from '@/components/atoms/StatusPill';
import { BudgetApproval } from '@/components/campaigns/BudgetApproval';
import { StrategyGeneration } from '@/components/campaigns/StrategyGeneration';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { getCampaign, listCampaignBudgets } from '@/services/campaigns';
import type { CampaignStatus } from '@/types/campaign';

function statusVariant(status: CampaignStatus) {
  if (status === 'active') return 'success';
  if (status === 'scheduled') return 'info';
  if (status === 'paused') return 'warning';
  if (status === 'completed') return 'neutral';
  return 'neutral';
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function StrategySummary({ strategy }: { strategy: Record<string, unknown> }) {
  if (Object.keys(strategy).length === 0) {
    return (
      <p className="text-sm text-[var(--foreground-muted)]">
        Aún no hay estrategia. Usa el generador IA para obtener una propuesta.
      </p>
    );
  }

  const summary = strategy.summary;
  const channels = strategy.channels;
  const timeline = strategy.timeline;
  const kpis = strategy.kpis;

  return (
    <div className="space-y-3 text-sm text-[var(--foreground-muted)]">
      {typeof summary === 'string' && (
        <p className="text-[var(--foreground)]">{summary}</p>
      )}
      {Array.isArray(channels) && channels.length > 0 && (
        <div>
          <p className="mb-1 font-medium text-[var(--foreground)]">Canales</p>
          <ul className="list-inside list-disc space-y-1">
            {channels.map((ch, i) => {
              if (typeof ch !== 'object' || ch === null) return null;
              const item = ch as Record<string, unknown>;
              return (
                <li key={i}>
                  <span className="capitalize">{String(item.platform ?? 'canal')}</span>
                  {item.focus ? ` — ${String(item.focus)}` : ''}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {typeof timeline === 'string' && (
        <p>
          <span className="font-medium text-[var(--foreground)]">Timeline: </span>
          {timeline}
        </p>
      )}
      {Array.isArray(kpis) && kpis.length > 0 && (
        <p>
          <span className="font-medium text-[var(--foreground)]">KPIs: </span>
          {kpis.map(String).join(', ')}
        </p>
      )}
    </div>
  );
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const campaignQuery = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => getCampaign(id!),
    enabled: !!id,
  });

  const budgetsQuery = useQuery({
    queryKey: ['campaign-budgets', id],
    queryFn: () => listCampaignBudgets(id!),
    enabled: !!id,
  });

  const campaign = campaignQuery.data;
  const budgets = budgetsQuery.data ?? campaign?.budgets ?? [];

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['campaign', id] });
    void queryClient.invalidateQueries({ queryKey: ['campaign-budgets', id] });
    void queryClient.invalidateQueries({ queryKey: ['campaigns'] });
  };

  if (campaignQuery.isLoading) {
    return (
      <DashboardShell>
        <p className="text-sm text-[var(--foreground-muted)]">Cargando campaña...</p>
      </DashboardShell>
    );
  }

  if (campaignQuery.isError || !campaign) {
    return (
      <DashboardShell>
        <Card title="Campaña no encontrada">
          <Link to="/campaigns">
            <Button variant="outline">Volver al listado</Button>
          </Link>
        </Card>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <PageHeader
        title={campaign.name}
        description={campaign.objective ?? 'Detalle de campaña multicanal'}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to={`/contents?campaignId=${campaign.id}`}>
              <Button variant="secondary">Contenidos</Button>
            </Link>
            <Link to="/campaigns">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Resumen">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[var(--foreground-muted)]">Estado</dt>
                <dd className="mt-1">
                  <StatusPill status={statusVariant(campaign.status)} size="sm">
                    {campaign.status}
                  </StatusPill>
                </dd>
              </div>
              <div>
                <dt className="text-[var(--foreground-muted)]">Presupuesto total</dt>
                <dd className="mt-1 font-medium text-[var(--foreground)]">
                  {campaign.totalBudget != null
                    ? `$${campaign.totalBudget.toLocaleString('es-ES')}`
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--foreground-muted)]">Plataformas</dt>
                <dd className="mt-1 capitalize text-[var(--foreground)]">
                  {campaign.platforms.length > 0 ? campaign.platforms.join(', ') : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--foreground-muted)]">Creada</dt>
                <dd className="mt-1 text-[var(--foreground)]">{formatDate(campaign.createdAt)}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Estrategia">
            <StrategySummary strategy={campaign.strategy} />
          </Card>

          <Card title="Presupuestos por plataforma">
            {budgetsQuery.isLoading && (
              <p className="text-sm text-[var(--foreground-muted)]">Cargando presupuestos...</p>
            )}
            {!budgetsQuery.isLoading && budgets.length === 0 && (
              <p className="text-sm text-[var(--foreground-muted)]">
                No hay presupuestos. Genera una estrategia IA para crear propuestas.
              </p>
            )}
            <div className="space-y-3">
              {budgets.map((budget) => (
                <BudgetApproval key={budget.id} campaignId={campaign.id} budget={budget} />
              ))}
            </div>
          </Card>
        </div>

        <div>
          <StrategyGeneration campaignId={campaign.id} onCompleted={invalidate} />
        </div>
      </div>
    </DashboardShell>
  );
}
