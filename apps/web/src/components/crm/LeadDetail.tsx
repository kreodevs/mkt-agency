import { useQuery } from '@tanstack/react-query';
import { Mail, Phone, Building2, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { StatusPill } from '@/components/atoms/StatusPill';
import { Card } from '@/components/molecules/Card';
import { SkeletonBlock } from '@/components/molecules/PageSkeleton';
import { listLeadInteractions } from '@/services/leads';
import { LEAD_STAGE_LABELS, type Lead } from '@/types/leads';

function scoreVariant(score: number) {
  if (score >= 70) return 'success';
  if (score >= 40) return 'warning';
  return 'neutral';
}

interface LeadDetailProps {
  lead: Lead | null;
  productName?: string | null;
  loading?: boolean;
  layout?: 'card' | 'plain';
  onClose?: () => void;
  onDelete?: (leadId: string) => void;
  deleting?: boolean;
}

function LeadDetailSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Cargando lead">
      <SkeletonBlock className="h-6 w-2/3" />
      <SkeletonBlock className="h-4 w-1/3" />
      <SkeletonBlock className="h-8 w-24" />
      <SkeletonBlock className="h-20 w-full" />
      <SkeletonBlock className="h-32 w-full" />
    </div>
  );
}

function LeadDetailBody({
  lead,
  productName,
  onClose,
  onDelete,
  deleting,
  stickyActions = false,
}: {
  lead: Lead;
  productName?: string | null;
  onClose?: () => void;
  onDelete?: (leadId: string) => void;
  deleting?: boolean;
  stickyActions?: boolean;
}) {
  const interactionsQuery = useQuery({
    queryKey: ['lead-interactions', lead.id],
    queryFn: () => listLeadInteractions(lead.id),
    enabled: !!lead.id,
  });

  const interactions = interactionsQuery.data?.items ?? lead.recentInteractions ?? [];

  return (
    <>
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">
            {lead.name || lead.email}
          </h3>
          <p className="text-sm text-[var(--foreground-muted)]">{LEAD_STAGE_LABELS[lead.stage]}</p>
        </div>
        {onClose ? (
          <Button type="button" size="sm" variant="ghost" className="shrink-0" onClick={onClose}>
            Cerrar
          </Button>
        ) : null}
      </div>

      <div className="mb-4">
        <StatusPill status={scoreVariant(lead.score)} size="sm">
          Score IA: {lead.score}/100
        </StatusPill>
      </div>

      <ul className="mb-4 space-y-2 text-sm text-[var(--foreground-muted)]">
        <li className="flex items-center gap-2">
          <Mail className="h-4 w-4 shrink-0" />
          <span className="truncate">{lead.email}</span>
        </li>
        {lead.phone ? (
          <li className="flex items-center gap-2">
            <Phone className="h-4 w-4 shrink-0" />
            {lead.phone}
          </li>
        ) : null}
        {lead.company ? (
          <li className="flex items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0" />
            {lead.company}
          </li>
        ) : null}
        {productName ? (
          <li className="flex items-center gap-2">
            <Package className="h-4 w-4 shrink-0" />
            {productName}
          </li>
        ) : null}
      </ul>

      <h4 className="mb-2 text-sm font-semibold text-[var(--foreground)]">Interacciones</h4>
      {interactionsQuery.isLoading ? (
        <p className="text-sm text-[var(--foreground-muted)]">Cargando historial…</p>
      ) : null}
      {!interactionsQuery.isLoading && interactions.length === 0 ? (
        <p className="text-sm text-[var(--foreground-muted)]">Sin interacciones registradas.</p>
      ) : null}
      <ul className="mb-4 max-h-[min(40vh,16rem)] space-y-3 overflow-auto lg:max-h-panel-md">
        {interactions.map((item) => (
          <li key={item.id} className="rounded border border-[var(--border)] p-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-[var(--foreground)]">{item.type}</span>
              <span className="text-xs text-[var(--foreground-muted)]">
                {new Date(item.createdAt).toLocaleString('es-ES')}
              </span>
            </div>
            {item.description ? (
              <p className="mt-1 text-[var(--foreground-muted)]">{item.description}</p>
            ) : null}
          </li>
        ))}
      </ul>

      {onDelete ? (
        <div className={stickyActions ? 'sticky bottom-0 border-t border-[var(--border)] bg-[var(--card)] pt-3' : ''}>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="min-h-11 w-full sm:min-h-0 sm:w-auto"
            loading={deleting}
            onClick={() => onDelete(lead.id)}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Eliminar lead
          </Button>
        </div>
      ) : null}
    </>
  );
}

export function LeadDetail({
  lead,
  productName,
  loading,
  layout = 'card',
  onClose,
  onDelete,
  deleting,
}: LeadDetailProps) {
  const isPlain = layout === 'plain';

  if (loading) {
    const skeleton = <LeadDetailSkeleton />;
    if (isPlain) return skeleton;
    return <Card title="Detalle del lead">{skeleton}</Card>;
  }

  if (!lead) {
    const empty = (
      <p className="text-sm text-[var(--foreground-muted)]">
        Selecciona un lead en el pipeline para ver su historial.
      </p>
    );
    if (isPlain) return empty;
    return <Card title="Detalle del lead">{empty}</Card>;
  }

  const body = (
    <LeadDetailBody
      lead={lead}
      productName={productName}
      onClose={isPlain ? undefined : onClose}
      onDelete={onDelete}
      deleting={deleting}
      stickyActions={isPlain}
    />
  );

  if (isPlain) {
    return body;
  }

  return <Card>{body}</Card>;
}

export default LeadDetail;
