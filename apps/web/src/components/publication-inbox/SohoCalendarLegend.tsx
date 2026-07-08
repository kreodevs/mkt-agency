export function SohoCalendarLegend() {
  const items = [
    { color: '#16a34a', label: 'Listo para publicar' },
    { color: '#ca8a04', label: 'Pendiente de revisar' },
    { color: '#dc2626', label: 'Rechazado o en cambios' },
    { color: '#64748b', label: 'Varios estados' },
  ];

  return (
    <div className="mb-[var(--spacing-md)] flex flex-wrap gap-x-4 gap-y-2 text-xs text-[var(--foreground-muted)]">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
            aria-hidden
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export default SohoCalendarLegend;
