import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { LeadDetail } from '@/components/crm/LeadDetail';
import { LeadPipeline } from '@/components/crm/LeadPipeline';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import { changeLeadStage, deleteLead, getLead, listLeads } from '@/services/leads';
import type { LeadStage } from '@/types/lead.constants';

export default function LeadPipelinePage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const leadsQuery = useQuery({
    queryKey: ['leads'],
    queryFn: () => listLeads({ page: 1, limit: 100 }),
  });

  const leadDetailQuery = useQuery({
    queryKey: ['lead', selectedId],
    queryFn: () => getLead(selectedId!),
    enabled: !!selectedId,
  });

  const stageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: LeadStage }) =>
      changeLeadStage(id, { stage }),
    onSuccess: (lead) => {
      void queryClient.invalidateQueries({ queryKey: ['leads'] });
      void queryClient.invalidateQueries({ queryKey: ['lead', lead.id] });
      void queryClient.invalidateQueries({ queryKey: ['lead-interactions', lead.id] });
      toast.success('Etapa actualizada');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo mover el lead');
      void queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteLead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leads'] });
      setSelectedId(null);
      toast.message('Lead eliminado');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo eliminar');
    },
  });

  const leads = leadsQuery.data?.items ?? [];

  return (
    <DashboardShell>
      <PageHeader
        title="Pipeline CRM"
        description="Leads capturados desde formularios — score IA y etapas Kanban"
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <LeadPipeline
            leads={leads}
            loading={leadsQuery.isLoading}
            selectedId={selectedId}
            onStageChange={(id, stage) => stageMutation.mutate({ id, stage })}
            onSelectLead={setSelectedId}
          />
        </Card>

        <div className="lg:col-span-2">
          <LeadDetail
            lead={leadDetailQuery.data ?? null}
            loading={!!selectedId && leadDetailQuery.isLoading}
            onClose={() => setSelectedId(null)}
            onDelete={(id) => deleteMutation.mutate(id)}
            deleting={deleteMutation.isPending}
          />
        </div>
      </div>
    </DashboardShell>
  );
}
