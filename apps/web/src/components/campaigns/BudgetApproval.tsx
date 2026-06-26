import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { StatusPill } from '@/components/atoms/StatusPill';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import { updateCampaignBudget } from '@/services/campaigns';
import type { Budget } from '@/types/campaign';

interface BudgetApprovalProps {
  campaignId: string;
  budget: Budget;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

export function BudgetApproval({ campaignId, budget }: BudgetApprovalProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (approved: boolean) => updateCampaignBudget(campaignId, budget.id, approved),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      void queryClient.invalidateQueries({ queryKey: ['campaign-budgets', campaignId] });
      toast.success(updated.approved ? 'Presupuesto aprobado' : 'Presupuesto rechazado');
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo actualizar el presupuesto';
      toast.error(message);
    },
  });

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium capitalize text-[var(--foreground)]">{budget.platform}</span>
          {budget.proposedByAi && (
            <StatusPill status="info" size="sm">
              IA
            </StatusPill>
          )}
          <StatusPill status={budget.approved ? 'success' : 'warning'} size="sm">
            {budget.approved ? 'Aprobado' : 'Pendiente'}
          </StatusPill>
        </div>
        <p className="text-sm text-[var(--foreground-muted)]">
          Diario: {formatMoney(budget.dailyBudget)} · Total: {formatMoney(budget.totalBudget)}
        </p>
      </div>

      {!budget.approved && (
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            loading={mutation.isPending}
            onClick={() => mutation.mutate(true)}
          >
            <Check className="mr-1 h-4 w-4" />
            Aprobar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            loading={mutation.isPending}
            onClick={() => mutation.mutate(false)}
          >
            <X className="mr-1 h-4 w-4" />
            Rechazar
          </Button>
        </div>
      )}
    </div>
  );
}

export default BudgetApproval;
