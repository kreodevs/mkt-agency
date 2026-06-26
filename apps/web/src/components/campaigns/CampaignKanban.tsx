import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { KanbanBoard, type KanbanCardData } from '@/components/organisms/KanbanBoard';
import { StatusPill } from '@/components/atoms/StatusPill';
import type { Campaign, CampaignStatus } from '@/types/campaign';

export const KANBAN_COLUMNS: Array<{ id: CampaignStatus; title: string }> = [
  { id: 'draft', title: 'Borrador' },
  { id: 'scheduled', title: 'Programada' },
  { id: 'active', title: 'Activa' },
  { id: 'paused', title: 'Pausada' },
  { id: 'completed', title: 'Completada' },
];

function statusVariant(status: CampaignStatus) {
  if (status === 'active') return 'success';
  if (status === 'scheduled') return 'info';
  if (status === 'paused') return 'warning';
  if (status === 'completed') return 'neutral';
  return 'neutral';
}

interface CampaignKanbanProps {
  campaigns: Campaign[];
  loading?: boolean;
  onStatusChange: (campaignId: string, status: CampaignStatus) => void;
}

export function CampaignKanban({ campaigns, loading, onStatusChange }: CampaignKanbanProps) {
  const navigate = useNavigate();

  const columns = useMemo(
    () =>
      KANBAN_COLUMNS.map((col) => ({
        id: col.id,
        title: col.title,
        cards: campaigns
          .filter((c) => c.status === col.id)
          .map(
            (c): KanbanCardData => ({
              id: c.id,
              title: c.name,
              description: c.objective ?? undefined,
              status: c.platforms.join(', ') || undefined,
              campaign: c,
            }),
          ),
      })),
    [campaigns],
  );

  return (
    <KanbanBoard
      columns={columns}
      loading={loading}
      loadingSkeletonCount={5}
      onCardMove={(cardId, _sourceColId, destColId) => {
        onStatusChange(cardId, destColId as CampaignStatus);
      }}
      onAddCard={(colId) => {
        if (colId === 'draft') {
          navigate('/campaigns/new');
        }
      }}
      customCardRenderer={(card) => {
        const campaign = card.campaign as Campaign | undefined;
        return (
          <button
            type="button"
            className="w-full text-left"
            onClick={() => navigate(`/campaigns/${card.id}`)}
          >
            <p className="mb-1 text-sm font-semibold text-[var(--foreground)]">{card.title}</p>
            {card.description && (
              <p className="mb-2 line-clamp-2 text-xs text-[var(--foreground-muted)]">
                {card.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {campaign && (
                <StatusPill status={statusVariant(campaign.status)} size="sm">
                  {campaign.status}
                </StatusPill>
              )}
              {campaign?.totalBudget != null && (
                <span className="text-xs text-[var(--foreground-muted)]">
                  ${campaign.totalBudget.toLocaleString('es-ES')}
                </span>
              )}
            </div>
          </button>
        );
      }}
    />
  );
}

export default CampaignKanban;
