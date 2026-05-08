import { useEffect, useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Tag } from 'primereact/tag';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { getCurrentTenant } from '../../stores/authStore';
import { campaigns } from '../../services/api';

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

  const statusBody = (row: any) => <Tag severity={row.status === 'active' ? 'success' : 'warning'} value={row.status} />;

  return (
    <div>
      <div className="flex justify-content-between align-items-center mb-3">
        <h2 className="mt-0">Google Ads</h2>
        <Button label="Nueva Campaña" icon="pi pi-plus" onClick={() => setShowNew(true)} />
      </div>

      <Card>
        <DataTable
          value={campaignList}
          loading={loading}
          size="small"
          stripedRows
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          rowExpansionTemplate={(row: any) => (
            <div className="p-3">
              <h5>Keywords</h5>
              <DataTable value={row.keywords || []} size="small">
                <Column field="text" header="Keyword" />
                <Column field="cpc" header="CPC" />
                <Column field="clicks" header="Clics" />
                <Column field="impressions" header="Impresiones" />
                <Column field="status" header="Estado" body={(r: any) => <Tag severity={r.status === 'active' ? 'success' : 'warning'} value={r.status} />} />
              </DataTable>
            </div>
          )}
        >
          <Column expander style={{ width: '40px' }} />
          <Column field="name" header="Nombre" />
          <Column field="platform" header="Plataforma" />
          <Column field="budget" header="Presupuesto" body={(r: any) => `$${Number(r.budget || 0).toLocaleString()}`} />
          <Column field="spent" header="Gastado" body={(r: any) => `$${Number(r.spent || 0).toLocaleString()}`} />
          <Column field="status" header="Estado" body={statusBody} />
        </DataTable>
      </Card>

      <Dialog header="Nueva Campaña" visible={showNew} onHide={() => setShowNew(false)} style={{ width: '400px' }}>
        <div className="flex flex-column gap-2">
          <InputText placeholder="Nombre" value={newName} onChange={e => setNewName(e.target.value)} />
          <InputNumber placeholder="Presupuesto mensual" value={newBudget} onValueChange={e => setNewBudget(e.value)} mode="currency" currency="MXN" />
          <Button label="Crear" onClick={handleCreate} disabled={!newName} />
        </div>
      </Dialog>
    </div>
  );
}
