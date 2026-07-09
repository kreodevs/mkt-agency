import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { Button } from '@/components/atoms/Button';
import { StatusPill } from '@/components/atoms/StatusPill';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import {
  approveAgencyPlan,
  createAgencyPlan,
  listAgencyPlans,
} from '@/services/operating-profile';
import { useOperatingProfile } from '@/hooks/useOperatingProfile';
import { useResolvedProductId } from '@/hooks/useResolvedProductId';

export default function AgencyStrategyPage() {
  const productId = useResolvedProductId();
  const { isPaid } = useOperatingProfile();
  const queryClient = useQueryClient();
  const [objective, setObjective] = useState('');

  const plansQuery = useQuery({
    queryKey: ['agency-plans'],
    queryFn: listAgencyPlans,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createAgencyPlan({
        objective,
        metric: 'leads',
        productId: productId ?? undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-plans'] });
      setObjective('');
      toast.success('Plan estratégico creado');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Error al crear plan');
    },
  });

  const approveMutation = useMutation({
    mutationFn: (planId: string) => approveAgencyPlan(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-plans'] });
      queryClient.invalidateQueries({ queryKey: ['agency-events'] });
      toast.success('Plan aprobado — agentes notificados');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Error al aprobar');
    },
  });

  return (
    <DashboardShell>
        <PageHeader
          title="Estrategia comercial"
          description="Objetivos financieros, embudo y presupuesto teórico (Growth)"
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Nuevo objetivo" subtitle="El agente de estrategia propone canales y embudo">
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
              placeholder="Ej. Reducir CAC 15% en suscripciones este trimestre"
            />
            {isPaid && (
              <p className="mt-2 text-xs text-[var(--foreground-muted)]">
                Perfil con pauta: el plan incluirá distribución de presupuesto por etapa.
              </p>
            )}
            <Button
              type="button"
              className="mt-4"
              disabled={!objective.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              Generar plan
            </Button>
          </Card>

          <Card title="Planes recientes" subtitle="Aprueba para activar creativo y pauta">
            {plansQuery.isLoading && (
              <p className="text-sm text-[var(--foreground-muted)]">Cargando…</p>
            )}
            <ul className="space-y-3">
              {(plansQuery.data ?? []).map((plan) => {
                const objectiveText =
                  (plan.strategistOutput.commercialObjective as { metric?: string })?.metric ??
                  'Plan';
                return (
                  <li
                    key={plan.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] p-3"
                  >
                    <div>
                      <StatusPill status={plan.status === 'approved' ? 'success' : 'warning'}>
                        {plan.status}
                      </StatusPill>
                      <p className="mt-1 text-sm">{objectiveText}</p>
                      <p className="text-xs text-[var(--foreground-muted)]">
                        {new Date(plan.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {plan.status === 'draft' && (
                      <Button
                        type="button"
                        size="sm"
                        disabled={approveMutation.isPending}
                        onClick={() => approveMutation.mutate(plan.id)}
                      >
                        Aprobar
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </DashboardShell>
  );
}
