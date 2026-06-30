import { useEffect, useMemo, useState } from 'react';
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
  allowedFieldNames: string[];
  fieldLabels: Record<string, string>;
  onAccept: (values: Record<string, string>) => void;
  disabled?: boolean;
}

const POLL_STATUSES: SuggestionAssignmentStatus[] = ['pending', 'processing'];

function pickAllowedSuggestionFields(
  data: Record<string, unknown>,
  allowedFieldNames: string[],
): Record<string, string> {
  const allowed = new Set(allowedFieldNames);
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(data)) {
    if (!allowed.has(key) || value == null) continue;
    const trimmed = String(value).trim();
    if (trimmed) result[key] = trimmed;
  }

  return result;
}

export function AISuggestion({
  sectionKey,
  allowedFieldNames,
  fieldLabels,
  onAccept,
  disabled,
}: AISuggestionProps) {
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
  const isPolling = !!assignment && POLL_STATUSES.includes(assignment.status);

  const filteredSuggestion = useMemo(() => {
    if (!assignment?.suggestion) return null;
    const picked = pickAllowedSuggestionFields(assignment.suggestion, allowedFieldNames);
    return Object.keys(picked).length > 0 ? picked : null;
  }, [assignment?.suggestion, allowedFieldNames]);

  const handleAccept = () => {
    if (!filteredSuggestion) return;
    onAccept(filteredSuggestion);
    setDismissed(true);
    toast.success('Sugerencia aplicada al formulario');
  };

  const handleReject = () => {
    setDismissed(true);
    toast.message('Sugerencia descartada');
  };

  const button = (
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
  );

  if (dismissed) {
    return <div className="mb-6">{button}</div>;
  }

  return (
    <div className="mb-6 space-y-3">
      {button}

      {assignment?.status === 'failed' && (
        <p className="text-sm text-[var(--destructive)]">
          {assignment.error ?? 'Error al generar sugerencia'}
        </p>
      )}

      {assignment?.status === 'completed' && filteredSuggestion && (
        <Card
          title="Sugerencia IA"
          subtitle="Solo para esta sección — revisa y aplica si encaja con tu marca"
        >
          <ul className="mb-4 space-y-2 text-sm text-[var(--foreground-muted)]">
            {Object.entries(filteredSuggestion).map(([key, value]) => (
              <li key={key}>
                <span className="font-medium text-[var(--foreground)]">
                  {fieldLabels[key] ?? key}:{' '}
                </span>
                {value}
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

      {assignment?.status === 'completed' && !filteredSuggestion && (
        <p className="text-sm text-[var(--destructive)]">
          La sugerencia no incluyó campos válidos para esta sección. Intenta de nuevo.
        </p>
      )}
    </div>
  );
}

export default AISuggestion;
