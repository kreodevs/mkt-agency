import { useEffect, useState } from 'react';
import { Card, DataTable, Dialog, Dropdown, Textarea } from '@/components/ui';
import { getCurrentTenant } from '../../stores/authStore';
import { posts } from '../../services/api';
import { Check, X, RefreshCw, ExternalLink } from 'lucide-react';

const statusTag = (status: string) => {
  const map: Record<string, { cls: string; label: string }> = {
    draft: { cls: 'bg-purple-100 text-purple-800', label: 'Borrador' },
    approved: { cls: 'bg-emerald-100 text-emerald-800', label: 'Aprobado' },
    rejected: { cls: 'bg-red-100 text-red-800', label: 'Rechazado' },
    published: { cls: 'bg-emerald-100 text-emerald-800', label: 'Publicado' },
  };
  const entry = map[status] || { cls: 'bg-gray-100 text-gray-800', label: status };
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${entry.cls}`}>
      {entry.label}
    </span>
  );
};

const REJECT_REASONS = [
  { label: 'Tono incorrecto', value: 'tono_incorrecto' },
  { label: 'Mensaje no preciso', value: 'mensaje_no_preciso' },
  { label: 'Arte no me gusta', value: 'arte_no_gusta' },
  { label: 'Momento inoportuno', value: 'momento_inoportuno' },
  { label: 'Otro', value: 'otro' },
];

export default function ContentPage() {
  const tenant = getCurrentTenant();
  const productId = sessionStorage.getItem('currentProductId');
  const [postList, setPostList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [showApprove, setShowApprove] = useState(false);
  const [approveAction, setApproveAction] = useState<'approve' | 'reject'>('approve');
  const [reason, setReason] = useState('');
  const [feedbackText, setFeedbackText] = useState('');

  const fetchPosts = () => {
    if (!tenant) return;
    setLoading(true);
    posts.list(tenant.id, productId || undefined).then(r => setPostList(r.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchPosts(); }, [tenant?.id, productId]);

  const handleApprove = async () => {
    if (!tenant || !selectedPost) return;
    await posts.approve(tenant.id, selectedPost.id, { action: approveAction, reason, feedbackText });
    setShowApprove(false);
    setSelectedPost(null);
    setReason('');
    setFeedbackText('');
    fetchPosts();
  };

  const publishUrl = (text: string) => {
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  };

  const contentBody = (row: any) => (
    <div className="text-sm text-[var(--foreground)] truncate max-w-md">{row.content}</div>
  );

  const actionBody = (row: any) => (
    <div className="flex gap-1">
      {row.status === 'draft' && (
        <>
          <button
            onClick={() => { setSelectedPost(row); setApproveAction('approve'); setShowApprove(true); }}
            className="inline-flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] text-[var(--success)] hover:bg-[var(--success)]/10 transition-colors cursor-pointer border-none bg-transparent"
            title="Aprobar"
          >
            <Check size={16} />
          </button>
          <button
            onClick={() => { setSelectedPost(row); setApproveAction('reject'); setShowApprove(true); }}
            className="inline-flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] text-[var(--destructive)] hover:bg-[var(--destructive)]/10 transition-colors cursor-pointer border-none bg-transparent"
            title="Rechazar"
          >
            <X size={16} />
          </button>
        </>
      )}
      {row.status === 'approved' && (
        <a
          href={publishUrl(row.content)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius-md)] hover:bg-[var(--primary-hover)] transition-colors no-underline"
          title="Publicar en X"
        >
          <ExternalLink size={12} />
          Publicar en X
        </a>
      )}
      {row.status === 'rejected' && (
        <button
          className="inline-flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)] hover:text-[var(--primary)] transition-colors cursor-pointer border-none bg-transparent"
          title="Generar V2"
          onClick={() => window.alert('Generar nueva versión')}
        >
          <RefreshCw size={16} />
        </button>
      )}
    </div>
  );

  const columns = [
    { field: 'version', header: 'V', width: '50px' },
    { field: 'content', header: 'Contenido', body: contentBody },
    { field: 'status', header: 'Estado', width: '110px', body: (r: any) => statusTag(r.status) },
    { field: 'rejectionReason', header: 'Motivo', width: '100px', body: (r: any) => r.rejectionReason ? <span className="text-xs text-[var(--warning)]">{r.rejectionReason}</span> : '-' },
    { header: 'Acción', width: '160px', body: actionBody, field: '' },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--foreground)] mt-0 mb-4">Content Calendar</h2>

      <Card className="!bg-[var(--card)] !text-[var(--card-foreground)] !border !border-[var(--card-border)] !rounded-[var(--radius-lg)]">
        <DataTable data={postList} loading={loading} dense striped columns={columns} />
      </Card>

      <Dialog
        header={approveAction === 'approve' ? 'Aprobar Post' : 'Rechazar Post'}
        visible={showApprove}
        onHide={() => setShowApprove(false)}
        size="sm"
      >
        {approveAction === 'reject' && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-[0.05em]">Motivo del rechazo</label>
              <Dropdown
                value={reason}
                options={REJECT_REASONS}
                onChange={(e) => setReason(e.value)}
                placeholder="Selecciona motivo"
                className="!w-full"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-[0.05em]">Feedback</label>
              <Textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={4}
                placeholder="Ej: El tono se siente muy de startup, prefiero algo más clínico..."
                className="!w-full !bg-[var(--input)] !text-[var(--foreground)] !border !border-[var(--input-border)] !rounded-[var(--radius-md)] !px-3 !py-2 !text-sm !placeholder:text-[var(--foreground-subtle)]"
              />
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={() => setShowApprove(false)}
            className="px-3 py-1.5 text-xs font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] bg-transparent rounded-[var(--radius-md)] hover:bg-[var(--secondary)] transition-colors cursor-pointer border-none"
          >
            Cancelar
          </button>
          <button
            onClick={handleApprove}
            className={`px-3 py-1.5 text-xs font-medium rounded-[var(--radius-md)] transition-colors cursor-pointer border-none ${
              approveAction === 'approve'
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]'
                : 'bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:opacity-90'
            }`}
          >
            {approveAction === 'approve' ? '✅ Aprobar' : '👎 Rechazar'}
          </button>
        </div>
      </Dialog>
    </div>
  );
}
