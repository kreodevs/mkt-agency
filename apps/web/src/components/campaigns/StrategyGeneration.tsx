import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import {
  generateCampaignStrategy,
  getStrategyAssignment,
} from '@/services/campaigns';
import type { StrategyAssignmentStatus } from '@/types/campaign';

interface StrategyGenerationProps {
  campaignId: string;
  onCompleted?: () => void;
}

const POLL_STATUSES: StrategyAssignmentStatus[] = ['pending', 'processing'];

export function StrategyGeneration({ campaignId, onCompleted }: StrategyGenerationProps) {
  const [assignmentId, setAssignmentId] = useState<string | null>(null);

  const generateMutation = useMutation({
    mutationFn: () => generateCampaignStrategy(campaignId),
    onSuccess: (data) => {
      setAssignmentId(data.assignmentId);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo solicitar la estrategia';
      toast.error(message);
    },
  });

  const assignmentQuery = useQuery({
    queryKey: ['strategy-assignment', assignmentId],
    queryFn: () => getStrategyAssignment(assignmentId!),
    enabled: !!assignmentId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && POLL_STATUSES.includes(status) ? 1500 : false;
    },
  });

  useEffect(() => {
    if (assignmentQuery.data?.status === 'completed') {
      onCompleted?.();
      toast.success('Estrategia y presupuestos generados');
    }
  }, [assignmentQuery.data?.status, onCompleted]);

  const assignment = assignmentQuery.data;
  const isPolling = !!assignment && POLL_STATUSES.includes(assignment.status);

  return (
    <Card title="Estrategia IA" subtitle="Genera propuesta de canales y presupuestos por plataforma">
      <Button
        type="button"
        variant="outline"
        onClick={() => generateMutation.mutate()}
        loading={generateMutation.isPending || isPolling}
      >
        <Sparkles className="mr-2 h-4 w-4" />
        {isPolling ? 'Generando estrategia...' : 'Generar estrategia con IA'}
      </Button>

      {assignment?.status === 'failed' && (
        <p className="mt-3 text-sm text-[var(--destructive)]">
          {assignment.error ?? 'Error al generar la estrategia'}
        </p>
      )}
    </Card>
  );
}

export default StrategyGeneration;
