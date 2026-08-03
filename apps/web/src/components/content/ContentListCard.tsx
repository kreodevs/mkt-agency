import { Link } from 'react-router-dom';
import { ChevronRight, FileText } from 'lucide-react';
import { StatusPill } from '@/components/atoms/StatusPill';
import { ContentPlatformBadge } from '@/components/content/ContentPlatformBadge';
import type { Content, ContentStatus } from '@/types/content';

function statusVariant(status: ContentStatus) {
  if (status === 'approved') return 'success' as const;
  if (status === 'rejected') return 'error' as const;
  if (status === 'in_review') return 'info' as const;
  if (status === 'in_changes') return 'warning' as const;
  return 'neutral' as const;
}

export interface ContentListCardProps {
  content: Content;
  productLabel: string;
}

export function ContentListCard({ content, productLabel }: ContentListCardProps) {
  return (
    <article className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-[var(--spacing-md)] transition-colors hover:border-[var(--border-hover)]">
      <div className="flex items-start justify-between gap-[var(--spacing-sm)]">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-[var(--spacing-xs)]">
            <FileText className="h-4 w-4 shrink-0 text-[var(--primary)]" aria-hidden />
            <h3 className="truncate font-semibold text-[var(--foreground)]">{content.title}</h3>
          </div>
          <p className="mt-[var(--spacing-xs)] text-sm capitalize text-[var(--foreground-muted)]">
            {content.type} · {productLabel}
          </p>
          <div className="mt-[var(--spacing-sm)] flex flex-wrap items-center gap-[var(--spacing-sm)]">
            <StatusPill status={statusVariant(content.status)} size="sm">
              {content.status}
            </StatusPill>
            <ContentPlatformBadge platform={content.platform} size="sm" showUnset />
            {content.currentVersion?.versionNumber != null ? (
              <span className="text-xs text-[var(--foreground-muted)]">
                v{content.currentVersion.versionNumber}
              </span>
            ) : null}
          </div>
        </div>
        <Link
          to={`/contents/${content.id}`}
          className="shrink-0 rounded-[var(--radius-sm)] p-1 text-[var(--foreground-muted)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
          aria-label={`Ver ${content.title}`}
        >
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>
    </article>
  );
}

export default ContentListCard;
