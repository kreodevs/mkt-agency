import { Card } from '@/components/molecules/Card';
import type { ReportData } from '@/types/reports';

interface ReportDataViewProps {
  data: ReportData;
}

export function ReportDataView({ data }: ReportDataViewProps) {
  if (data.error) {
    return (
      <Card>
        <p className="text-sm text-[var(--destructive)]">
          Error al generar el reporte: {data.error}
        </p>
      </Card>
    );
  }

  return (
    <Card className="space-y-4 text-sm">
      {data.summary ? (
        <div>
          <h3 className="mb-1 font-semibold text-[var(--foreground)]">Resumen</h3>
          <p className="text-[var(--foreground-muted)]">{data.summary}</p>
        </div>
      ) : null}

      {data.highlights?.length ? (
        <div>
          <h3 className="mb-1 font-semibold text-[var(--foreground)]">Destacados</h3>
          <ul className="list-inside list-disc space-y-1 text-[var(--foreground-muted)]">
            {data.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {data.metrics && Object.keys(data.metrics).length > 0 ? (
        <div>
          <h3 className="mb-1 font-semibold text-[var(--foreground)]">Métricas</h3>
          <dl className="grid gap-2 sm:grid-cols-2">
            {Object.entries(data.metrics).map(([key, value]) => (
              <div
                key={key}
                className="rounded border border-[var(--border)] bg-[var(--secondary)] px-3 py-2"
              >
                <dt className="text-xs uppercase text-[var(--foreground-muted)]">{key}</dt>
                <dd className="font-medium text-[var(--foreground)]">{String(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {data.recommendations?.length ? (
        <div>
          <h3 className="mb-1 font-semibold text-[var(--foreground)]">Recomendaciones</h3>
          <ul className="list-inside list-disc space-y-1 text-[var(--foreground-muted)]">
            {data.recommendations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {data.generatedAt ? (
        <p className="text-xs text-[var(--foreground-muted)]">
          Generado:{' '}
          {new Intl.DateTimeFormat('es-ES', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }).format(new Date(data.generatedAt))}
        </p>
      ) : null}
    </Card>
  );
}
