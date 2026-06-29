import { useQuery } from '@tanstack/react-query';
import { Mail, Phone, Building2, Trash2 } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { StatusPill } from '@/components/atoms/StatusPill';
import { Card } from '@/components/molecules/Card';
import { listLeadInteractions } from '@/services/leads';
import { LEAD_STAGE_LABELS, type Lead } from '@/types/leads';

function scoreVariant(score: number) {
  if (score >= 70) return 'success';
  if (score >= 40) return 'warning';
  return 'neutral';
}

interface LeadDetailProps {
  lead: Lead | null;
  loading?: boolean;
  onClose?: () => void;
  onDelete?: (leadId: string) => void;
  deleting?: boolean;
}

export function LeadDetail({ lead, loading, onClose, onDelete, deleting }: LeadDetailProps) {
  const interactionsQuery = useQuery({
    queryKey: ['lead-interactions', lead?.id],
    queryFn: () => listLeadInteractions(lead!.id),
    enabled: !!lead?.id,
  });

  if (loading) {
    return (
      <Card title="Detalle del lead">
        <p className="text-sm text-[var(--foreground-muted)]">Cargando...</p>
      </Card>
    );
  }

  if (!lead) {
    return (
      <Card title="Detalle del lead">
        <p className="text-sm text-[var(--foreground-muted)]">
          Selecciona un lead en el pipeline para ver su historial.
        </p>
      </Card>
    );
  }

  const interactions = interactionsQuery.data?.items ?? lead.recentInteractions ?? [];

  return (
    <Card>
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-[var(--foreground)]">
            {lead.name || lead.email}
          </h3>
          <p className="text-sm text-[var(--foreground-muted)]">{LEAD_STAGE_LABELS[lead.stage]}</p>
        </div>
        {onClose && (
          <Button type="button" size="sm" variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
        )}
      </div>

      <div className="mb-4">
        <StatusPill status={scoreVariant(lead.score)} size="sm">
          Score IA: {lead.score}/100
        </StatusPill>
      </div>

      <ul className="mb-4 space-y-2 text-sm text-[var(--foreground-muted)]">
        <li className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          {lead.email}
        </li>
        {lead.phone && (
          <li className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            {lead.phone}
          </li>
        )}
        {lead.company && (
          <li className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {lead.company}
          </li>
        )}
      </ul>

      <h4 className="mb-2 text-sm font-semibold text-[var(--foreground)]">Interacciones</h4>
      {interactionsQuery.isLoading && (
        <p className="text-sm text-[var(--foreground-muted)]">Cargando historial...</p>
      )}
      {!interactionsQuery.isLoading && interactions.length === 0 && (
        <p className="text-sm text-[var(--foreground-muted)]">Sin interacciones registradas.</p>
      )}
      <ul className="mb-4 max-h-panel-md space-y-3 overflow-auto">
        {interactions.map((item) => (
          <li key={item.id} className="rounded border border-[var(--border)] p-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-[var(--foreground)]">{item.type}</span>
              <span className="text-xs text-[var(--foreground-muted)]">
                {new Date(item.createdAt).toLocaleString('es-ES')}
              </span>
            </div>
            {item.description && (
              <p className="mt-1 text-[var(--foreground-muted)]">{item.description}</p>
            )}
          </li>
        ))}
      </ul>

      {onDelete && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          loading={deleting}
          onClick={() => onDelete(lead.id)}
        >
          <Trash2 className="mr-1 h-4 w-4" />
          Eliminar lead
        </Button>
      )}
    </Card>
  );
}

export default LeadDetail;
