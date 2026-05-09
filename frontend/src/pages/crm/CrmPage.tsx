import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Dialog, InputText } from '@/components/ui';
import { getCurrentTenant } from '../../stores/authStore';
import { leads } from '../../services/api';

const STAGES = ['prospecto', 'contactado', 'interesado', 'trial', 'cliente'];
const STAGE_LABELS: any = { prospecto: 'Prospecto', contactado: 'Contactado', interesado: 'Interesado', trial: 'Trial', cliente: 'Cliente' };
const STAGE_COLORS: any = { prospecto: '#e3f2fd', contactado: '#fff3e0', interesado: '#e8f5e9', trial: '#f3e5f5', cliente: '#c8e6c9' };

export default function CrmPage() {
  const navigate = useNavigate();
  const tenant = getCurrentTenant();
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [_, setIsLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newClinic, setNewClinic] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const fetchLeads = () => {
    if (!tenant) return;
    setIsLoading(true);
    leads.list(tenant.id).then(r => setAllLeads(r.data || [])).finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchLeads(); }, [tenant?.id]);

  const grouped = STAGES.map(stage => ({
    stage,
    label: STAGE_LABELS[stage],
    items: allLeads.filter((l: any) => l.stage === stage),
  }));

  const handleCreate = async () => {
    if (!newName || !tenant) return;
    await leads.create(tenant.id, { name: newName, clinic: newClinic, phone: newPhone, email: newEmail, stage: 'prospecto' });
    setShowNew(false);
    setNewName('');
    setNewClinic('');
    setNewPhone('');
    setNewEmail('');
    fetchLeads();
  };

  return (
    <div>
      <div className="flex justify-content-between align-items-center mb-3">
        <h2 className="mt-0">CRM</h2>
        <Button label="Nuevo Lead" icon="pi pi-plus" onClick={() => setShowNew(true)} />
      </div>

      <div className="grid">
        {grouped.map(g => (
          <div key={g.stage} className="col" style={{ minWidth: '250px' }}>
            <Card title={`${g.label} (${g.items.length})`} style={{ background: STAGE_COLORS[g.stage] }}>
              {g.items.map((lead: any) => (
                <div
                  key={lead.id}
                  className="p-2 mb-2 border-round cursor-pointer hover:shadow-2"
                  style={{ background: 'white' }}
                  onClick={() => navigate(`/crm/${lead.id}`)}
                >
                  <div className="font-bold">{lead.name}</div>
                  {lead.clinic && <div className="text-sm text-500">{lead.clinic}</div>}
                  <div className="flex justify-content-between mt-1">
                    {lead.score && (
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                        lead.score >= 80 ? 'bg-red-100 text-red-800' : lead.score >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {lead.score}
                      </span>
                    )}
                    <span className="text-xs text-500">{lead.source}</span>
                  </div>
                </div>
              ))}
              {g.items.length === 0 && <div className="text-sm text-500 text-center py-3">Sin leads</div>}
            </Card>
          </div>
        ))}
      </div>

      <Dialog header="Nuevo Lead" visible={showNew} onHide={() => setShowNew(false)} style={{ width: '400px' }}>
        <div className="flex flex-column gap-2">
          <InputText placeholder="Nombre *" value={newName} onChange={e => setNewName(e.target.value)} />
          <InputText placeholder="Clínica" value={newClinic} onChange={e => setNewClinic(e.target.value)} />
          <InputText placeholder="Teléfono" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
          <InputText placeholder="Email" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
          <Button label="Crear" onClick={handleCreate} disabled={!newName} />
        </div>
      </Dialog>
    </div>
  );
}
