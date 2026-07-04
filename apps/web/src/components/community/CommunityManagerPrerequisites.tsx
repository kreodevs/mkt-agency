import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/molecules/Card';
import { Progress } from '@/components/molecules/Progress';
import type { CommunityManagerReadiness } from '@/services/community-manager';

interface CommunityManagerPrerequisitesProps {
  readiness: CommunityManagerReadiness;
}

export function CommunityManagerPrerequisites({ readiness }: CommunityManagerPrerequisitesProps) {
  const progress = Math.round((readiness.completed / readiness.total) * 100);
  const isComplete = readiness.completed === readiness.total;

  return (
    <Card
      title="Precisión del copy"
      subtitle={
        isComplete
          ? 'Perfil listo: la IA usará tu contexto de marca al generar.'
          : 'Completa tu perfil de empresa para copy más preciso y alineado a tu marca.'
      }
    >
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
          <span>
            {readiness.completed} de {readiness.total} prerrequisitos
          </span>
          <span className="font-medium tabular-nums text-[var(--foreground)]">{progress}%</span>
        </div>
        <Progress value={progress} />
      </div>

      <ul className="space-y-2">
        {readiness.items.map((item) => (
          <li
            key={item.key}
            className="flex items-start gap-[var(--spacing-md)] rounded-[var(--radius-md)] border border-[var(--border)] px-[var(--spacing-md)] py-[var(--spacing-sm)]"
          >
            {item.complete ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-[var(--foreground)]">{item.label}</p>
                {!item.complete && (
                  <Link
                    to={item.href}
                    className="text-xs font-medium text-[var(--primary)] hover:underline"
                  >
                    Completar
                  </Link>
                )}
              </div>
              <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">{item.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
