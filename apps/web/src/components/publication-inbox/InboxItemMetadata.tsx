import { CalendarDays, Clock } from 'lucide-react';
import {
  formatInboxScheduledDate,
  formatInboxTimestamp,
} from '@/lib/inbox-date-format.util';
import type { PublicationInboxItem } from '@/types/publication-inbox';

interface InboxItemMetadataProps {
  item: PublicationInboxItem;
  scheduledStyle?: 'short' | 'long';
}

export function InboxItemMetadata({
  item,
  scheduledStyle = 'short',
}: InboxItemMetadataProps) {
  const scheduledLabel = formatInboxScheduledDate(item.scheduledDate, scheduledStyle);
  const createdLabel = formatInboxTimestamp(item.createdAt);
  const updatedLabel = formatInboxTimestamp(item.updatedAt);

  return (
    <div className="space-y-1 text-xs text-[var(--foreground-muted)]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="h-3 w-3 shrink-0" aria-hidden />
          <span>
            Programado: <span className="text-[var(--foreground)]">{scheduledLabel}</span>
          </span>
        </span>
        {item.productName ? <span>{item.productName}</span> : null}
        {item.type ? <span className="uppercase">{item.type}</span> : null}
      </div>

      {(createdLabel || updatedLabel) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Clock className="h-3 w-3 shrink-0" aria-hidden />
          {createdLabel ? (
            <span>
              Creado: <span className="text-[var(--foreground)]">{createdLabel}</span>
            </span>
          ) : null}
          {updatedLabel ? (
            <span>
              Actualizado: <span className="text-[var(--foreground)]">{updatedLabel}</span>
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default InboxItemMetadata;
