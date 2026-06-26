import { StatusPill } from '@/components/atoms/StatusPill';
import { Card } from '@/components/molecules/Card';
import type { ProposalContent } from '@/types/proposals';

interface ProposalContentViewProps {
  content: ProposalContent;
  signatureHash?: string | null;
}

export function ProposalContentView({ content, signatureHash }: ProposalContentViewProps) {
  if (content.error) {
    return (
      <Card>
        <p className="text-sm text-[var(--destructive)]">
          Error al generar la propuesta: {content.error}
        </p>
      </Card>
    );
  }

  return (
    <Card className="space-y-4 text-sm">
      {content.summary ? (
        <div>
          <h3 className="mb-1 font-semibold text-[var(--foreground)]">Resumen</h3>
          <p className="text-[var(--foreground-muted)]">{content.summary}</p>
        </div>
      ) : null}

      {content.objectives?.length ? (
        <div>
          <h3 className="mb-1 font-semibold text-[var(--foreground)]">Objetivos</h3>
          <ul className="list-inside list-disc space-y-1 text-[var(--foreground-muted)]">
            {content.objectives.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {content.strategy ? (
        <div>
          <h3 className="mb-1 font-semibold text-[var(--foreground)]">Estrategia</h3>
          <p className="text-[var(--foreground-muted)]">{content.strategy}</p>
        </div>
      ) : null}

      {content.budget ? (
        <div>
          <h3 className="mb-1 font-semibold text-[var(--foreground)]">Presupuesto</h3>
          <p className="text-[var(--foreground)]">
            Total: {content.budget.total.toLocaleString('es-ES')} €
          </p>
          {content.budget.breakdown?.length ? (
            <ul className="mt-2 list-inside list-disc space-y-1 text-[var(--foreground-muted)]">
              {content.budget.breakdown.map((row) => (
                <li key={row.item}>
                  {row.item}: {row.amount.toLocaleString('es-ES')} €
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {content.timeline?.length ? (
        <div>
          <h3 className="mb-1 font-semibold text-[var(--foreground)]">Cronograma</h3>
          <ul className="space-y-1 text-[var(--foreground-muted)]">
            {content.timeline.map((phase) => (
              <li key={phase.phase}>
                <span className="font-medium text-[var(--foreground)]">{phase.phase}</span>
                {' — '}
                {phase.duration}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {content.deliverables?.length ? (
        <div>
          <h3 className="mb-1 font-semibold text-[var(--foreground)]">Entregables</h3>
          <ul className="list-inside list-disc space-y-1 text-[var(--foreground-muted)]">
            {content.deliverables.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {signatureHash ? (
        <div className="border-t border-[var(--border)] pt-3">
          <StatusPill status="success" size="sm">
            Firma SHA-256
          </StatusPill>
          <code className="mt-2 block break-all rounded bg-[var(--muted)] px-2 py-1 font-mono text-xs">
            {signatureHash}
          </code>
        </div>
      ) : null}
    </Card>
  );
}
