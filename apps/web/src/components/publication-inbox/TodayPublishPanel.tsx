import { useMemo } from 'react';
import { CalendarCheck, Sparkles } from 'lucide-react';
import { InboxItemCard } from '@/components/publication-inbox/InboxItemCard';
import { Card } from '@/components/molecules/Card';
import type { PublicationInboxItem } from '@/types/publication-inbox';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function isToday(item: PublicationInboxItem): boolean {
  return item.scheduledDate.slice(0, 10) === todayKey();
}

interface TodayPublishPanelProps {
  pending: PublicationInboxItem[];
  ready: PublicationInboxItem[];
  strategyFocus?: string | null;
}

export function TodayPublishPanel({
  pending,
  ready,
  strategyFocus,
}: TodayPublishPanelProps) {
  const todayItems = useMemo(() => {
    const pendingToday = pending.filter(isToday);
    const readyToday = ready.filter(isToday);
    return [...readyToday, ...pendingToday];
  }, [pending, ready]);

  if (todayItems.length === 0) {
    return (
      <Card title="Hoy publicas esto" subtitle="Nada programado para hoy">
        <p className="text-sm text-[var(--foreground-muted)]">
          Cuando el copiloto programe publicaciones para hoy, aparecerán aquí primero.
        </p>
      </Card>
    );
  }

  return (
    <Card
      title="Hoy publicas esto"
      subtitle={`${todayItems.length} publicación(es) para hoy`}
    >
      {strategyFocus && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-3 text-sm">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
          <p className="text-[var(--foreground-muted)]">
            <span className="font-medium text-[var(--foreground)]">Enfoque de la semana: </span>
            {strategyFocus}
          </p>
        </div>
      )}

      <div className="mb-3 flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
        <CalendarCheck className="h-4 w-4 text-[var(--success)]" />
        Aprueba si hace falta, luego copia y pega en tu red.
      </div>

      <div className="space-y-4">
        {todayItems.map((item) => (
          <InboxItemCard
            key={item.contentId}
            item={item}
            showApproval={item.status !== 'approved' || !item.signatureHash}
            sohoMode
          />
        ))}
      </div>
    </Card>
  );
}

export default TodayPublishPanel;
