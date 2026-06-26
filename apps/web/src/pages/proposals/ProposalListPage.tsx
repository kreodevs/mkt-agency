import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/atoms/Button';
import { InputText } from '@/components/atoms/InputText';
import { StatusPill } from '@/components/atoms/StatusPill';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { DataTable, type DataTableColumn } from '@/components/organisms/DataTable';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import { createProposal, listProposals } from '@/services/proposals';
import {
  PROPOSAL_STATUS_LABELS,
  proposalStatusVariant,
  type Proposal,
} from '@/types/proposals';

export default function ProposalListPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');

  const proposalsQuery = useQuery({
    queryKey: ['proposals'],
    queryFn: () => listProposals({ limit: 50 }),
    refetchInterval: (query) => {
      const items = query.state.data?.items ?? [];
      return items.some((item) => item.status === 'generating') ? 3000 : false;
    },
  });

  const createMutation = useMutation({
    mutationFn: () => createProposal({ title: title.trim() }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['proposals'] });
      setTitle('');
      toast.success('Propuesta en generación');
      void queryClient.prefetchQuery({
        queryKey: ['proposal', result.id],
        queryFn: () => import('@/services/proposals').then((m) => m.getProposal(result.id)),
      });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo crear');
    },
  });

  const items = proposalsQuery.data?.items ?? [];

  const columns: DataTableColumn[] = [
    {
      field: 'title',
      header: 'Título',
      sortable: true,
      body: (row) => (
        <Link
          to={`/proposals/${(row as Proposal).id}`}
          className="font-medium text-[var(--primary)] hover:underline"
        >
          {(row as Proposal).title}
        </Link>
      ),
    },
    {
      field: 'status',
      header: 'Estado',
      body: (row) => {
        const proposal = row as Proposal;
        return (
          <StatusPill status={proposalStatusVariant(proposal.status)} size="sm">
            {PROPOSAL_STATUS_LABELS[proposal.status]}
          </StatusPill>
        );
      },
    },
    {
      field: 'createdAt',
      header: 'Creada',
      body: (row) =>
        new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(
          new Date((row as Proposal).createdAt),
        ),
    },
    {
      field: 'signatureHash',
      header: 'Firma',
      body: (row) =>
        (row as Proposal).signatureHash ? (
          <StatusPill status="success" size="sm">
            Firmada
          </StatusPill>
        ) : (
          '—'
        ),
    },
  ];

  return (
    <DashboardShell>
      <div className="space-y-6">
        <PageHeader
          title="Propuestas comerciales"
          description="Genera propuestas con IA, revísalas y fírmalas digitalmente."
        />

        <Card className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <InputText
              label="Nueva propuesta"
              placeholder="Propuesta Q2 — Campaña local"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <Button
            type="button"
            onClick={() => createMutation.mutate()}
            disabled={!title.trim() || createMutation.isPending}
          >
            <Plus className="mr-2 h-4 w-4" />
            Generar con IA
          </Button>
        </Card>

        <DataTable
          columns={columns}
          data={items}
          loading={proposalsQuery.isLoading}
          emptyMessage="Aún no hay propuestas"
        />
      </div>
    </DashboardShell>
  );
}
