import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { getCurrentTenant } from '../../stores/authStore';
import { leads } from '../../services/api';

const STAGE_OPTIONS = [
  { label: 'Prospecto', value: 'prospecto' },
  { label: 'Contactado', value: 'contactado' },
  { label: 'Interesado', value: 'interesado' },
  { label: 'Trial', value: 'trial' },
  { label: 'Cliente', value: 'cliente' },
];

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const tenant = getCurrentTenant();
  const [lead, setLead] = useState<any>(null);
  const [stage, setStage] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!tenant || !id) return;
    leads.get(tenant.id, id).then(r => {
      setLead(r.data);
      setStage(r.data.stage);
      setNotes(r.data.notes || '');
    });
  }, [tenant?.id, id]);

  const handleStageChange = async (newStage: string) => {
    if (!tenant || !id) return;
    await leads.updateStage(tenant.id, id, newStage);
    setStage(newStage);
  };

  if (!lead) return <div className="p-3">Cargando...</div>;

  return (
    <div className="p-3" style={{ maxWidth: '800px' }}>
      <Button label="← Volver" text onClick={() => navigate('/crm')} className="mb-2" />

      <Card title={lead.name}>
        <div className="grid">
          <div className="col-6">
            <div className="mb-2"><strong>Clínica:</strong> {lead.clinic || '-'}</div>
            <div className="mb-2"><strong>Teléfono:</strong> {lead.phone || '-'}</div>
            <div className="mb-2"><strong>Email:</strong> {lead.email || '-'}</div>
            <div className="mb-2"><strong>Fuente:</strong> {lead.source}</div>
          </div>
          <div className="col-6">
            <div className="mb-2">
              <strong>Score:</strong>{' '}
              <Tag severity={lead.score >= 80 ? 'danger' : lead.score >= 60 ? 'warning' : 'info'} value={lead.score || '-'} />
            </div>
            <div className="mb-2">
              <strong>Etapa:</strong>{' '}
              <Dropdown value={stage} options={STAGE_OPTIONS} onChange={(e) => handleStageChange(e.value)} />
            </div>
            {lead.painPoints?.length > 0 && (
              <div className="mb-2">
                <strong>Pain Points:</strong>
                <ul className="mt-1 mb-0">
                  {lead.painPoints.map((p: string, i: number) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3">
          <strong>Notas:</strong>
          <InputTextarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="w-full mt-1" />
        </div>
      </Card>
    </div>
  );
}
