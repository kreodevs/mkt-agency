import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import {
  getSuggestionAssignment,
  requestSectionSuggestion,
} from '@/services/company-profile';
import type { SectionKey, SuggestionAssignmentStatus } from '@/types/company-profile';

interface AISuggestionProps {
  sectionKey: SectionKey;
  onAccept: (values: Record<string, string>) => void;
  disabled?: boolean;
}

const POLL_STATUSES: SuggestionAssignmentStatus[] = ['pending', 'processing'];

function suggestionToStrings(data: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value != null) result[key] = String(value);
  }
  return result;
}

export function AISuggestion({ sectionKey, onAccept, disabled }: AISuggestionProps) {
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const suggestMutation = useMutation({
    mutationFn: () => requestSectionSuggestion(sectionKey),
    onSuccess: (data) => {
      setAssignmentId(data.assignmentId);
      setDismissed(false);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo solicitar la sugerencia';
      toast.error(message);
    },
  });

  const assignmentQuery = useQuery({
    queryKey: ['suggestion-assignment', assignmentId],
    queryFn: () => getSuggestionAssignment(assignmentId!),
    enabled: !!assignmentId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && POLL_STATUSES.includes(status) ? 1500 : false;
    },
  });

  useEffect(() => {
    setAssignmentId(null);
    setDismissed(false);
  }, [sectionKey]);

  const assignment = assignmentQuery.data;
  const isPolling =
    !!assignment && POLL_STATUSES.includes(assignment.status);

  const handleAccept = () => {
    if (!assignment?.suggestion) return;
    onAccept(suggestionToStrings(assignment.suggestion));
    setDismissed(true);
    toast.success('Sugerencia aplicada al formulario');
  };

  const handleReject = () => {
    setDismissed(true);
    toast.message('Sugerencia descartada');
  };

  if (dismissed || disabled) {
    return (
      <div className="mb-6">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => suggestMutation.mutate()}
          loading={suggestMutation.isPending || isPolling}
          disabled={disabled}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Sugerir con IA
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-6 space-y-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => suggestMutation.mutate()}
        loading={suggestMutation.isPending || isPolling}
        disabled={disabled}
      >
        <Sparkles className="mr-2 h-4 w-4" />
        {isPolling ? 'Generando sugerencia...' : 'Sugerir con IA'}
      </Button>

      {assignment?.status === 'failed' && (
        <p className="text-sm text-[var(--destructive)]">
          {assignment.error ?? 'Error al generar sugerencia'}
        </p>
      )}

      {assignment?.status === 'completed' && assignment.suggestion && (
        <Card
          title="Sugerencia IA"
          subtitle="Revisa y aplica solo lo que encaje con tu marca"
        >
          <ul className="mb-4 space-y-2 text-sm text-[var(--foreground-muted)]">
            {Object.entries(assignment.suggestion).map(([key, value]) => (
              <li key={key}>
                <span className="font-medium text-[var(--foreground)]">{key}: </span>
                {String(value)}
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleAccept}>
              Aceptar
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={handleReject}>
              Rechazar
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default AISuggestion;
