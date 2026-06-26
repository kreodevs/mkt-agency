import { useMutation, useQueryClient } from '@tanstack/react-query';
import { History, RotateCcw } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { SignatureBadge } from '@/components/content/SignatureBadge';
import { Card } from '@/components/molecules/Card';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import { revertContent } from '@/services/content';
import type { ContentVersion } from '@/types/content';

interface VersionHistoryProps {
  contentId: string;
  versions: ContentVersion[];
  currentVersionId: string | null;
  loading?: boolean;
}

export function VersionHistory({
  contentId,
  versions,
  currentVersionId,
  loading,
}: VersionHistoryProps) {
  const queryClient = useQueryClient();

  const revertMutation = useMutation({
    mutationFn: (versionId: string) => revertContent(contentId, versionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['content', contentId] });
      void queryClient.invalidateQueries({ queryKey: ['content-versions', contentId] });
      toast.success('Nueva versión creada desde el historial');
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : 'No se pudo revertir';
      toast.error(message);
    },
  });

  if (loading) {
    return <p className="text-sm text-[var(--foreground-muted)]">Cargando historial...</p>;
  }

  if (versions.length === 0) {
    return <p className="text-sm text-[var(--foreground-muted)]">Sin versiones registradas.</p>;
  }

  return (
    <Card title="Historial de versiones" subtitle="Append-only — revertir crea una versión nueva">
      <ul className="space-y-4">
        {versions.map((version) => {
          const isCurrent = version.id === currentVersionId;
          return (
            <li
              key={version.id}
              className="rounded-lg border border-[var(--border)] p-4"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-[var(--foreground-muted)]" />
                  <span className="text-sm font-semibold text-[var(--foreground)]">
                    v{version.versionNumber}
                    {isCurrent && (
                      <span className="ml-2 text-xs font-normal text-[var(--primary)]">
                        (actual)
                      </span>
                    )}
                  </span>
                </div>
                {!isCurrent && !version.signatureHash && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    loading={revertMutation.isPending}
                    onClick={() => revertMutation.mutate(version.id)}
                  >
                    <RotateCcw className="mr-1 h-4 w-4" />
                    Revertir
                  </Button>
                )}
              </div>

              {version.changeSummary && (
                <p className="mb-2 text-xs text-[var(--foreground-muted)]">
                  {version.changeSummary}
                </p>
              )}

              <p className="mb-3 line-clamp-3 whitespace-pre-wrap text-sm text-[var(--foreground)]">
                {version.body}
              </p>

              <SignatureBadge
                signatureHash={version.signatureHash}
                signedAt={version.signedAt}
              />
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export default VersionHistory;
