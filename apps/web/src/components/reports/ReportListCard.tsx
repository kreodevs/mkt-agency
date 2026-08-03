import { BarChart3, Eye } from 'lucide-react';
import { IconButton } from '@/components/atoms/IconButton';
import { StatusPill } from '@/components/atoms/StatusPill';
import {
  REPORT_STATUS_LABELS,
  REPORT_TYPE_LABELS,
  reportStatusVariant,
  type Report,
} from '@/types/reports';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(new Date(value));
}

export interface ReportListCardProps {
  report: Report;
  onView: () => void;
}

export function ReportListCard({ report, onView }: ReportListCardProps) {
  return (
    <article className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-[var(--spacing-md)]">
      <div className="flex items-start justify-between gap-[var(--spacing-sm)]">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-[var(--spacing-xs)]">
            <BarChart3 className="h-4 w-4 shrink-0 text-[var(--primary)]" aria-hidden />
            <h3 className="truncate font-semibold text-[var(--foreground)]">
              {REPORT_TYPE_LABELS[report.type]}
            </h3>
          </div>
          <div className="mt-[var(--spacing-sm)] flex flex-wrap items-center gap-[var(--spacing-sm)]">
            <StatusPill status={reportStatusVariant(report.status)} size="sm">
              {REPORT_STATUS_LABELS[report.status]}
            </StatusPill>
            <span className="text-xs text-[var(--foreground-muted)]">
              {formatDate(report.createdAt)}
            </span>
          </div>
        </div>
        <IconButton label="Ver detalle" onClick={onView}>
          <Eye />
        </IconButton>
      </div>
    </article>
  );
}

export default ReportListCard;
