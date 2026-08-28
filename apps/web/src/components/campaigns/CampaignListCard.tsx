import { Link } from 'react-router-dom';
import { ChevronRight, Megaphone } from 'lucide-react';
import { StatusPill } from '@/components/atoms/StatusPill';
import { listCardClassName } from '@/lib/list-card';
import type { Campaign, CampaignStatus } from '@/types/campaign';

const STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: 'Borrador',
  scheduled: 'Programada',
  active: 'Activa',
  paused: 'Pausada',
  completed: 'Completada',
};

function statusVariant(status: CampaignStatus) {
  if (status === 'active') return 'success' as const;
  if (status === 'scheduled') return 'info' as const;
  if (status === 'paused') return 'warning' as const;
  return 'neutral' as const;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(new Date(value));
}

export interface CampaignListCardProps {
  campaign: Campaign;
  productLabel: string;
}

export function CampaignListCard({ campaign, productLabel }: CampaignListCardProps) {
  return (
    <article className={listCardClassName()}>
      <div className="flex items-start justify-between gap-[var(--spacing-sm)]">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-[var(--spacing-xs)]">
            <Megaphone className="h-4 w-4 shrink-0 text-[var(--primary)]" aria-hidden />
            <h3 className="truncate font-semibold text-[var(--foreground)]">{campaign.name}</h3>
          </div>
          <p className="mt-[var(--spacing-xs)] text-sm text-[var(--foreground-muted)]">
            {campaign.scope === 'brand' ? 'Marca' : productLabel}
          </p>
          <div className="mt-[var(--spacing-sm)] flex flex-wrap items-center gap-[var(--spacing-sm)]">
            <StatusPill status={statusVariant(campaign.status)} size="sm">
              {STATUS_LABELS[campaign.status] ?? campaign.status}
            </StatusPill>
            {campaign.platforms.length > 0 ? (
              <span className="truncate text-xs text-[var(--foreground-muted)]">
                {campaign.platforms.join(', ')}
              </span>
            ) : null}
          </div>
          <p className="mt-[var(--spacing-xs)] text-xs text-[var(--foreground-muted)]">
            {campaign.totalBudget != null
              ? `$${campaign.totalBudget.toLocaleString('es-ES')}`
              : 'Sin presupuesto'}{' '}
            · {formatDate(campaign.createdAt)}
          </p>
        </div>
        <Link
          to={`/campaigns/${campaign.id}`}
          className="shrink-0 rounded-[var(--radius-sm)] p-1 text-[var(--foreground-muted)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
          aria-label={`Ver campaña ${campaign.name}`}
        >
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>
    </article>
  );
}

export default CampaignListCard;
