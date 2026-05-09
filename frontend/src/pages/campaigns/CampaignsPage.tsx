import { useEffect, useState } from 'react';
import { Button, Card, Dialog, InputText, DataTable } from '@/components/ui';
import { getCurrentTenant } from '../../stores/authStore';
import { campaigns } from '../../services/api';

const statusTag = (status: string) => {
  const isActive = status === 'active';
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
      {status}
    </span>
  );
};

export default function CampaignsPage() {
  const tenant = getCurrentTenant();
  const productId = sessionStorage.getItem('currentProductId');
  const [campaignList, setCampaignList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<any>(null);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBudget, setNewBudget] = useState<any>(null);

  const fetchCampaigns = () => {
    if (!tenant) return;
    setLoading(true);
    campaigns.list(tenant.id, productId || undefined).then(r => setCampaignList(r.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCampaigns(); }, [tenant?.id, productId]);

  const handleCreate = async () => {
    if (!newName || !tenant) return;
    await campaigns.create(tenant.id, { name: newName, budget: newBudget });
    setShowNew(false);
    setNewName('');
    setNewBudget(null);
    fetchCampaigns();
  };

  const columns = [
    { field: '', header: '', expander: true, width: '40px' },
    { field: 'name', header: 'Nombre' },
    { field: 'platform', header: 'Plataforma' },
    { field: 'budget', header: 'Presupuesto', body: (r: any) => `$${Number(r.budget || 0).toLocaleString()}` },
    { field: 'spent', header: 'Gastado', body: (r: any) => `$${Number(r.spent || 0).toLocaleString()}` },
    { field: 'status', header: 'Estado', body: (r: any) => statusTag(r.status) },
  ];

  const keywordColumns = [
    { field: 'text', header: 'Keyword' },
    { field: 'cpc', header: 'CPC' },
    { field: 'clicks', header: 'Clics' },
    { field: 'impressions', header: 'Impresiones' },
    { field: 'status', header: 'Estado', body: (r: any) => statusTag(r.status) },
  ];

  return (
    <div>
      <div className="flex justify-content-between align-items-center mb-3">
        <h2 className="mt-0">Google Ads</h2>
        <Button label="Nueva Campaña" icon="pi pi-plus" onClick={() => setShowNew(true)}  />
      </div>

      <Card>
        <DataTable
          data={campaignList}
          loading={loading}
          dense
          striped
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          rowExpansionTemplate={(row: any) => (
            <div className="p-3">
              <h5>Keywords</h5>
              <DataTable data={row.keywords || []} dense columns={keywordColumns} />
            </div>
          )}
          columns={columns}
        />
      </Card>

      <Dialog header="Nueva Campaña" visible={showNew} onHide={() => setShowNew(false)} size="sm">
        <div className="flex flex-column gap-2">
          <InputText placeholder="Nombre" value={newName} onChange={e => setNewName(e.target.value)}  />
          <InputText type="number" placeholder="Presupuesto mensual" value={newBudget} onChange={e => setNewBudget(Number(e.target.value))}  />
          <Button label="Crear" onClick={handleCreate} disabled={!newName}  />
        </div>
      </Dialog>
    </div>
  );
}
