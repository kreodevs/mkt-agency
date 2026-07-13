import { Users } from 'lucide-react';

interface SohoResultsBannerProps {
  leadsToday: number;
  leadsThisWeek: number;
  attributedLeadsThisWeek?: number;
}

export function SohoResultsBanner({
  leadsToday,
  leadsThisWeek,
  attributedLeadsThisWeek = 0,
}: SohoResultsBannerProps) {
  return (
    <div className="mb-[var(--spacing-lg)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-secondary)] p-[var(--spacing-md)]">
      <div className="flex flex-wrap items-center gap-[var(--spacing-md)]">
        <div className="flex items-center gap-[var(--spacing-sm)]">
          <Users className="h-5 w-5 text-[var(--primary)]" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
              Contactos esta semana
            </p>
            <p className="text-2xl font-black text-[var(--foreground)]">{leadsThisWeek}</p>
          </div>
        </div>
        <div className="h-10 w-px bg-[var(--border)]" />
        <div>
          <p className="text-xs text-[var(--foreground-muted)]">Hoy</p>
          <p className="text-lg font-bold text-[var(--foreground)]">{leadsToday}</p>
        </div>
        {attributedLeadsThisWeek > 0 && (
          <>
            <div className="h-10 w-px bg-[var(--border)]" />
            <div>
              <p className="text-xs text-[var(--foreground-muted)]">Desde tus posts</p>
              <p className="text-lg font-bold text-[var(--foreground)]">{attributedLeadsThisWeek}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SohoResultsBanner;
