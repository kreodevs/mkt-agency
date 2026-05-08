import { useEffect, useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { getCurrentTenant } from '../../stores/authStore';
import { posts } from '../../services/api';

const STATUS_BODY: any = {
  draft: <Tag severity="info" value="Borrador" />,
  approved: <Tag severity="success" value="Aprobado" />,
  rejected: <Tag severity="danger" value="Rechazado" />,
  published: <Tag severity="success" value="Publicado" />,
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

  const actionBody = (row: any) => (
    <div className="flex gap-1">
      {row.status === 'draft' && (
        <>
          <Button icon="pi pi-check" rounded text severity="success" onClick={() => { setSelectedPost(row); setApproveAction('approve'); setShowApprove(true); }} />
          <Button icon="pi pi-times" rounded text severity="danger" onClick={() => { setSelectedPost(row); setApproveAction('reject'); setShowApprove(true); }} />
        </>
      )}
      {row.status === 'rejected' && (
        <Button icon="pi pi-refresh" rounded text severity="info" label="V2" onClick={() => window.alert('Generar nueva versión')} />
      )}
    </div>
  );

  return (
    <div>
      <h2 className="mt-0">Content Calendar</h2>

      <Card>
        <DataTable value={postList} loading={loading} size="small" stripedRows>
          <Column field="version" header="V" style={{ width: '40px' }} />
          <Column field="content" header="Contenido" style={{ maxWidth: '400px' }} body={(r: any) => <div className="text-truncate">{r.content}</div>} />
          <Column header="Estado" body={(r: any) => STATUS_BODY[r.status] || <Tag value={r.status} />} />
          <Column field="rejectionReason" header="Motivo" body={(r: any) => r.rejectionReason ? <Tag severity="warning" value={r.rejectionReason} /> : '-'} />
          <Column header="Acción" body={actionBody} style={{ width: '120px' }} />
        </DataTable>
      </Card>

      <Dialog
        header={approveAction === 'approve' ? 'Aprobar Post' : 'Rechazar Post'}
        visible={showApprove}
        onHide={() => setShowApprove(false)}
        style={{ width: '450px' }}
      >
        {approveAction === 'reject' && (
          <div className="flex flex-column gap-2">
            <label>Motivo del rechazo</label>
            <Dropdown value={reason} options={REJECT_REASONS} onChange={(e) => setReason(e.value)} placeholder="Selecciona motivo" />
            <label>Feedback (texto libre)</label>
            <InputTextarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} rows={4} placeholder="Ej: El tono se siente muy de startup, prefiero algo más clínico..." />
          </div>
        )}
        <div className="flex justify-content-end gap-2 mt-3">
          <Button label="Cancelar" text onClick={() => setShowApprove(false)} />
          <Button label={approveAction === 'approve' ? '✅ Publicar' : '👎 Rechazar'} severity={approveAction === 'approve' ? 'success' : 'danger'} onClick={handleApprove} />
        </div>
      </Dialog>
    </div>
  );
}
