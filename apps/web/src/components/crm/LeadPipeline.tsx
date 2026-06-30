import { useMemo } from 'react';
import { KanbanBoard, type KanbanCardData } from '@/components/organisms/KanbanBoard';
import { StatusPill } from '@/components/atoms/StatusPill';
import { LEAD_KANBAN_COLUMNS, LEAD_STAGE_LABELS, type Lead, type LeadStage } from '@/types/leads';

function scoreVariant(score: number) {
  if (score >= 70) return 'success';
  if (score >= 40) return 'warning';
  return 'neutral';
}

interface LeadPipelineProps {
  leads: Lead[];
  loading?: boolean;
  selectedId?: string | null;
  productNameById?: Map<string, string>;
  onStageChange: (leadId: string, stage: LeadStage) => void;
  onSelectLead: (leadId: string) => void;
}

export function LeadPipeline({
  leads,
  loading,
  selectedId,
  productNameById,
  onStageChange,
  onSelectLead,
}: LeadPipelineProps) {
  const columns = useMemo(
    () =>
      LEAD_KANBAN_COLUMNS.map((col) => ({
        id: col.id,
        title: col.title,
        cards: leads
          .filter((lead) => lead.stage === col.id)
          .map(
            (lead): KanbanCardData => ({
              id: lead.id,
              title: lead.name || lead.email,
              description: lead.company ?? undefined,
              status: `Score ${lead.score}`,
              lead,
            }),
          ),
      })),
    [leads],
  );

  return (
    <KanbanBoard
      columns={columns}
      loading={loading}
      loadingSkeletonCount={4}
      onCardMove={(cardId, _sourceColId, destColId) => {
        onStageChange(cardId, destColId as LeadStage);
      }}
      customCardRenderer={(card) => {
        const lead = card.lead as Lead | undefined;
        const isSelected = lead?.id === selectedId;
        return (
          <button
            type="button"
            className={`w-full text-left ${isSelected ? 'ring-2 ring-[var(--primary)] ring-offset-2 rounded-md' : ''}`}
            onClick={() => lead && onSelectLead(lead.id)}
          >
            <p className="mb-1 text-sm font-semibold text-[var(--foreground)]">{card.title}</p>
            {card.description && (
              <p className="mb-2 text-xs text-[var(--foreground-muted)]">{card.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {lead && (
                <StatusPill status={scoreVariant(lead.score)} size="sm">
                  {lead.score}/100
                </StatusPill>
              )}
              {lead?.productId && productNameById?.get(lead.productId) && (
                <span className="rounded-full bg-[var(--secondary)] px-2 py-0.5 text-[10px] font-medium text-[var(--foreground-muted)]">
                  {productNameById.get(lead.productId)}
                </span>
              )}
              {lead && (
                <span className="text-[10px] uppercase text-[var(--foreground-muted)]">
                  {LEAD_STAGE_LABELS[lead.stage]}
                </span>
              )}
            </div>
          </button>
        );
      }}
    />
  );
}

export default LeadPipeline;
