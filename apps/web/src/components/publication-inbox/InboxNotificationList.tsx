import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';
import type { AgencyNotification } from '@/types/publication-inbox';

interface InboxNotificationListProps {
  notifications: AgencyNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export function InboxNotificationList({ notifications, onMarkRead, onMarkAllRead }: InboxNotificationListProps) {
  if (!notifications.length) return null;

  return (
    <Card id="inbox-notifications" className="mb-[var(--spacing-lg)] scroll-mt-24" title="Avisos" subtitle="Del copiloto">
      <div className="mb-[var(--spacing-md)] flex justify-end">
        <Button type="button" size="sm" variant="ghost" onClick={() => void onMarkAllRead()}>
          <CheckCheck className="mr-1 h-4 w-4" />
          Marcar todas leídas
        </Button>
      </div>
      <ul className="space-y-[var(--spacing-sm)]">
        {notifications.map((notification) => (
          <li key={notification.id} className="flex items-start gap-[var(--spacing-md)] rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--spacing-md)]">
            <Bell className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--foreground)]">{notification.title}</p>
              <p className="text-xs text-[var(--foreground-muted)]">{notification.body}</p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => void onMarkRead(notification.id)}>
              Leído
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
