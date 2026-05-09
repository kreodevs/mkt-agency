import { useEffect, useState } from 'react';
import { Card, Dialog, Button, TabView } from '@/components/ui';
import { getCurrentTenant } from '../../stores/authStore';
import { proposals } from '../../services/api';
import { Check, X, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface Proposal {
  id: string;
  actionType: string;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  productId?: string;
  rationale?: string;
  payload?: Record<string, any>;
  createdAt: string;
  reviewedAt?: string;
  feedback?: string;
  rejectionReason?: string;
  resultSummary?: string;
}

const ACTION_LABELS: Record<string, string> = {
  create_post: 'Publicación',
  contact_lead: 'Contactar Lead',
  score_lead: 'Scorear Lead',
  add_keyword: 'Agregar Keyword',
  pause_keyword: 'Pausar Keyword',
  create_campaign: 'Crear Campaña',
  custom_message: 'Mensaje',
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  executed: 'bg-blue-100 text-blue-800',
};

function actionBadge(actionType: string) {
  const label = ACTION_LABELS[actionType] || actionType;
  return (
    <span className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium bg-violet-100 text-violet-800">
      {label}
    </span>
  );
}

function statusBadge(status: string) {
  const cls = STATUS_STYLES[status] || 'bg-gray-100 text-gray-800';
  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

export default function ProposalsPage() {
  const tenant = getCurrentTenant();
  const [allProposals, setAllProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  // Approve dialog
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState<Proposal | null>(null);
  const [approveFeedback, setApproveFeedback] = useState('');

  // Reject dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<Proposal | null>(null);
  const [rejectReason, setRejectReason] = useState('no_relevant');
  const [rejectDetail, setRejectDetail] = useState('');

  const [actionLoading, setActionLoading] = useState(false);

  const REJECT_REASONS = [
    { value: 'no_relevant', label: 'No relevante' },
    { value: 'bad_timing', label: 'Mal momento' },
    { value: 'duplicate', label: 'Duplicado' },
    { value: 'incorrect_data', label: 'Datos incorrectos' },
    { value: 'other', label: 'Otro' },
  ];

  const fetchData = () => {
    if (!tenant) return;
    setLoading(true);
    proposals
      .list(tenant.id)
      .then((r) => {
        const list = r.data?.proposals || r.data?.data || r.data || [];
        setAllProposals(Array.isArray(list) ? list : []);
      })
      .catch(() => setAllProposals([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [tenant?.id]);

  const pending = allProposals.filter((p) => p.status === 'pending');
  const history = allProposals.filter(
    (p) => p.status === 'approved' || p.status === 'rejected' || p.status === 'executed'
  );

  const handleApprove = async () => {
    if (!tenant || !approveTarget) return;
    setActionLoading(true);
    try {
      await proposals.approve(tenant.id, approveTarget.id, {
        feedback: approveFeedback || undefined,
      });
      setApproveDialogOpen(false);
      setApproveFeedback('');
      setApproveTarget(null);
      fetchData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!tenant || !rejectTarget) return;
    setActionLoading(true);
    try {
      const reasonText = rejectDetail
        ? `${REJECT_REASONS.find((r) => r.value === rejectReason)?.label || rejectReason}: ${rejectDetail}`
        : REJECT_REASONS.find((r) => r.value === rejectReason)?.label || rejectReason;
      await proposals.reject(tenant.id, rejectTarget.id, {
        reason: reasonText,
      });
      setRejectDialogOpen(false);
      setRejectReason('no_relevant');
      setRejectDetail('');
      setRejectTarget(null);
      fetchData();
    } finally {
      setActionLoading(false);
    }
  };

  const openApproveDialog = (proposal: Proposal) => {
    setApproveTarget(proposal);
    setApproveFeedback('');
    setApproveDialogOpen(true);
  };

  const openRejectDialog = (proposal: Proposal) => {
    setRejectTarget(proposal);
    setRejectReason('no_relevant');
    setRejectDetail('');
    setRejectDialogOpen(true);
  };

  const renderProposalCard = (proposal: Proposal, showActions: boolean) => (
    <Card key={proposal.id} className="mb-3" padding="md">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          {actionBadge(proposal.actionType)}
          {statusBadge(proposal.status)}
        </div>
        <span className="text-xs text-[var(--foreground-muted)] shrink-0">
          {new Date(proposal.createdAt).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      {proposal.rationale && (
        <p className="text-sm italic text-[var(--foreground-muted)] mb-2">
          {proposal.rationale}
        </p>
      )}

      {proposal.payload && (
        <div className="bg-[var(--secondary)] rounded-md p-3 mb-3 overflow-x-auto">
          <pre className="text-xs font-mono text-[var(--foreground)] whitespace-pre-wrap">
            {JSON.stringify(proposal.payload, null, 2)}
          </pre>
        </div>
      )}

      {showActions && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--border)]">
          <Button
            size="sm"
            variant="default"
            onClick={() => openApproveDialog(proposal)}
          >
            <Check className="w-4 h-4" /> Aprobar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => openRejectDialog(proposal)}
          >
            <X className="w-4 h-4" /> Rechazar
          </Button>
        </div>
      )}

      {!showActions && (proposal.feedback || proposal.rejectionReason || proposal.resultSummary) && (
        <div className="mt-2 pt-2 border-t border-[var(--border)] space-y-1">
          {proposal.rejectionReason && (
            <p className="text-xs text-red-600">
              <strong>Razón:</strong> {proposal.rejectionReason}
            </p>
          )}
          {proposal.feedback && (
            <p className="text-xs text-[var(--foreground-muted)]">
              <strong>Feedback:</strong> {proposal.feedback}
            </p>
          )}
          {proposal.resultSummary && (
            <p className="text-xs text-emerald-600">
              <strong>Resultado:</strong> {proposal.resultSummary}
            </p>
          )}
        </div>
      )}
    </Card>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[var(--foreground)]">Propuestas</h2>
      </div>

      <TabView
        activeIndex={activeTab}
        onTabChange={(e) => setActiveTab(e.index)}
        tabs={[
          {
            label: 'Pendientes',
            badge: pending.length > 0 ? pending.length : undefined,
            children: (
              <div>
                {loading ? (
                  <div className="text-center py-8 text-[var(--foreground-muted)]">
                    Cargando propuestas...
                  </div>
                ) : pending.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-[var(--foreground-subtle)]" />
                    <p className="text-[var(--foreground-muted)]">
                      No hay propuestas pendientes por revisar.
                    </p>
                  </div>
                ) : (
                  pending.map((p) => renderProposalCard(p, true))
                )}
              </div>
            ),
          },
          {
            label: 'Historial',
            children: (
              <div>
                {loading ? (
                  <div className="text-center py-8 text-[var(--foreground-muted)]">
                    Cargando historial...
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-[var(--foreground-subtle)]" />
                    <p className="text-[var(--foreground-muted)]">
                      No hay propuestas en el historial.
                    </p>
                  </div>
                ) : (
                  history.map((p) => renderProposalCard(p, false))
                )}
              </div>
            ),
          },
        ]}
      />

      {/* Approve Dialog */}
      <Dialog
        visible={approveDialogOpen}
        onHide={() => {
          setApproveDialogOpen(false);
          setApproveTarget(null);
        }}
        title="Aprobar Propuesta"
        description={
          approveTarget
            ? `¿Estás seguro de aprobar esta propuesta de ${ACTION_LABELS[approveTarget.actionType] || approveTarget.actionType}?`
            : ''
        }
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setApproveDialogOpen(false);
                setApproveTarget(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              size="sm"
              loading={actionLoading}
              onClick={handleApprove}
            >
              <CheckCircle className="w-4 h-4" /> Confirmar
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <label className="block text-sm font-medium text-[var(--foreground)]">
            Feedback (opcional)
          </label>
          <textarea
            value={approveFeedback}
            onChange={(e) => setApproveFeedback(e.target.value)}
            placeholder="Comparte algún comentario sobre esta propuesta..."
            rows={3}
            className="w-full rounded-[var(--radius)] border border-[var(--input-border)] bg-[var(--input)] px-[var(--spacing-md)] py-[var(--spacing-sm)] text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
          />
        </div>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        visible={rejectDialogOpen}
        onHide={() => {
          setRejectDialogOpen(false);
          setRejectTarget(null);
        }}
        title="Rechazar Propuesta"
        description={
          rejectTarget
            ? `Indica por qué rechazas esta propuesta de ${ACTION_LABELS[rejectTarget.actionType] || rejectTarget.actionType}`
            : ''
        }
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectTarget(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              loading={actionLoading}
              onClick={handleReject}
            >
              <XCircle className="w-4 h-4" /> Rechazar
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Razón
            </label>
            <select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full h-10 rounded-[var(--radius)] border border-[var(--input-border)] bg-[var(--input)] px-[var(--spacing-md)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              {REJECT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Detalle adicional (opcional)
            </label>
            <textarea
              value={rejectDetail}
              onChange={(e) => setRejectDetail(e.target.value)}
              placeholder="Explica con más detalle..."
              rows={3}
              className="w-full rounded-[var(--radius)] border border-[var(--input-border)] bg-[var(--input)] px-[var(--spacing-md)] py-[var(--spacing-sm)] text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
