import { Link } from 'react-router-dom';
import { ChevronRight, FileSignature } from 'lucide-react';
import { StatusPill } from '@/components/atoms/StatusPill';
import { listCardClassName } from '@/lib/list-card';
import {
  PROPOSAL_STATUS_LABELS,
  proposalStatusVariant,
  type Proposal,
} from '@/types/proposals';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(new Date(value));
}

export interface ProposalListCardProps {
  proposal: Proposal;
}

export function ProposalListCard({ proposal }: ProposalListCardProps) {
  return (
    <article className={listCardClassName()}>
      <div className="flex items-start justify-between gap-[var(--spacing-sm)]">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-[var(--spacing-xs)]">
            <FileSignature className="h-4 w-4 shrink-0 text-[var(--primary)]" aria-hidden />
            <h3 className="truncate font-semibold text-[var(--foreground)]">{proposal.title}</h3>
          </div>
          <div className="mt-[var(--spacing-sm)] flex flex-wrap items-center gap-[var(--spacing-sm)]">
            <StatusPill status={proposalStatusVariant(proposal.status)} size="sm">
              {PROPOSAL_STATUS_LABELS[proposal.status]}
            </StatusPill>
            {proposal.signatureHash ? (
              <StatusPill status="success" size="sm">
                Firmada
              </StatusPill>
            ) : null}
            <span className="text-xs text-[var(--foreground-muted)]">
              {formatDate(proposal.createdAt)}
            </span>
          </div>
        </div>
        <Link
          to={`/proposals/${proposal.id}`}
          className="shrink-0 rounded-[var(--radius-sm)] p-1 text-[var(--foreground-muted)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
          aria-label={`Ver propuesta ${proposal.title}`}
        >
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>
    </article>
  );
}

export default ProposalListCard;
