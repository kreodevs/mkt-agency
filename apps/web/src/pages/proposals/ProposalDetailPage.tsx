import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, FileSignature, Loader2, XCircle } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { ProposalContentView } from '@/components/proposals/ProposalContentView';
import { Button } from '@/components/atoms/Button';
import { StatusPill } from '@/components/atoms/StatusPill';
import { PageHeader } from '@/components/molecules/PageHeader';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import { getProposal, rejectProposal, signProposal } from '@/services/proposals';
import { PROPOSAL_STATUS_LABELS, proposalStatusVariant } from '@/types/proposals';

export default function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const proposalQuery = useQuery({
    queryKey: ['proposal', id],
    queryFn: () => getProposal(id!),
    enabled: !!id,
    refetchInterval: (query) =>
      query.state.data?.status === 'generating' ? 3000 : false,
  });

  const signMutation = useMutation({
    mutationFn: () => signProposal(id!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['proposal', id] });
      void queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Propuesta firmada');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo firmar');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectProposal(id!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['proposal', id] });
      void queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.message('Propuesta rechazada');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo rechazar');
    },
  });

  const proposal = proposalQuery.data;
  const canSign =
    proposal && (proposal.status === 'draft' || proposal.status === 'reviewing');
  const canReject = proposal && proposal.status !== 'accepted' && proposal.status !== 'rejected';

  return (
    <DashboardShell>
      <div className="space-y-6">
        <Link
          to="/proposals"
          className="inline-flex items-center text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Volver
        </Link>

        {proposal ? (
          <>
            <PageHeader
              title={proposal.title}
              description={`Creada el ${new Intl.DateTimeFormat('es-ES', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(proposal.createdAt))}`}
              actions={
                <StatusPill status={proposalStatusVariant(proposal.status)} size="sm">
                  {PROPOSAL_STATUS_LABELS[proposal.status]}
                </StatusPill>
              }
            />

            {proposal.status === 'generating' ? (
              <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generando propuesta con IA…
              </div>
            ) : (
              <ProposalContentView
                content={proposal.content}
                signatureHash={proposal.signatureHash}
              />
            )}

            <div className="flex flex-wrap gap-2">
              {canSign ? (
                <Button
                  type="button"
                  onClick={() => signMutation.mutate()}
                  disabled={signMutation.isPending || proposal.status === 'generating'}
                >
                  <FileSignature className="mr-2 h-4 w-4" />
                  Firmar propuesta
                </Button>
              ) : null}
              {canReject ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => rejectMutation.mutate()}
                  disabled={rejectMutation.isPending}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Rechazar
                </Button>
              ) : null}
              {proposal.status === 'accepted' ? (
                <Button type="button" variant="outline" onClick={() => navigate('/proposals')}>
                  Cerrar
                </Button>
              ) : null}
            </div>
          </>
        ) : proposalQuery.isLoading ? (
          <p className="text-sm text-[var(--foreground-muted)]">Cargando…</p>
        ) : (
          <p className="text-sm text-[var(--destructive)]">Propuesta no encontrada</p>
        )}
      </div>
    </DashboardShell>
  );
}
