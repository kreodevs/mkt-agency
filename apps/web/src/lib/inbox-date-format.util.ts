export function formatInboxScheduledDate(
  dateKey: string,
  style: 'short' | 'long' = 'short',
): string {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(dateKey);
  if (!match) {
    return 'Sin fecha';
  }

  const date = new Date(`${match[1]}T12:00:00`);
  if (style === 'long') {
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

  return date.toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatInboxTimestamp(iso?: string): string | null {
  if (!iso) {
    return null;
  }

  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return new Date(parsed).toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
