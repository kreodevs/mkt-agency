/** Clases semánticas alineadas a tokens Kreo (vars.css). */

export const HEALTH_UI = {
  good: {
    label: 'Bueno',
    text: 'text-[var(--success)]',
    bg: 'bg-[var(--success)]/10',
    border: 'border-[var(--success)]/20',
  },
  fair: {
    label: 'Estable',
    text: 'text-[var(--warning)]',
    bg: 'bg-[var(--warning)]/10',
    border: 'border-[var(--warning)]/20',
  },
  poor: {
    label: 'Crítico',
    text: 'text-[var(--destructive)]',
    bg: 'bg-[var(--destructive)]/10',
    border: 'border-[var(--destructive)]/20',
  },
} as const;

export type HealthKey = keyof typeof HEALTH_UI;

export function contentStatusToPill(
  status: string,
): 'success' | 'warning' | 'error' | 'neutral' {
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'error';
  if (status === 'in_review' || status === 'in_changes' || status === 'draft') return 'warning';
  return 'neutral';
}

export const PLATFORM_ICON_TONE =
  'text-[var(--foreground-muted)] bg-[var(--secondary)] border border-[var(--border)]';
