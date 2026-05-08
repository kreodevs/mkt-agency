import { useEffect, useState } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { getCurrentTenant } from '../../stores/authStore';
import { leads, campaigns } from '../../services/api';

export default function DashboardPage() {
  const tenant = getCurrentTenant();
  const productId = sessionStorage.getItem('currentProductId');
  const [leadList, setLeadList] = useState([]);
  const [campaignList, setCampaignList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant) return;
    setLoading(true);
    Promise.all([
      leads.list(tenant.id, productId || undefined).then(r => setLeadList(r.data || [])),
      campaigns.list(tenant.id, productId || undefined).then(r => setCampaignList(r.data || [])),
    ]).finally(() => setLoading(false));
  }, [tenant?.id, productId]);

  const hotLeads = leadList.filter((l: any) => l.score >= 80);
  const scoreBody = (row: any) => {
    const color = row.score >= 80 ? 'danger' : row.score >= 60 ? 'warning' : 'info';
    return <Tag severity={color} value={row.score || '-'} />;
  };
  const stageBody = (row: any) => {
    const map: any = { prospecto: 'info', contactado: 'warning', interesado: 'success', trial: 'help', cliente: 'success' };
    return <Tag severity={map[row.stage] || 'info'} value={row.stage} />;
  };

  return (
    <div>
      <h2 className="mt-0">Dashboard</h2>

      {/* Stats Cards */}
      <div className="grid">
        <div className="col-12 md:col-3">
          <Card title="Leads Activos" className="text-center">
            <span className="text-4xl font-bold">{loading ? '...' : leadList.length}</span>
          </Card>
        </div>
        <div className="col-12 md:col-3">
          <Card title="Calientes (80+)" className="text-center">
            <span className="text-4xl font-bold text-red-500">{loading ? '...' : hotLeads.length}</span>
          </Card>
        </div>
        <div className="col-12 md:col-3">
          <Card title="Campañas" className="text-center">
            <span className="text-4xl font-bold">{loading ? '...' : campaignList.length}</span>
          </Card>
        </div>
        <div className="col-12 md:col-3">
          <Card title="Gasto Total" className="text-center">
            <span className="text-4xl font-bold">
              ${loading ? '...' : campaignList.reduce((s: number, c: any) => s + Number(c.spent || 0), 0).toLocaleString()}
            </span>
          </Card>
        </div>
      </div>

      {/* Hot Leads */}
      <Card title="🔥 Leads Calientes" className="mt-3">
        <DataTable value={hotLeads} loading={loading} size="small" stripedRows>
          <Column field="name" header="Nombre" />
          <Column field="clinic" header="Clínica" />
          <Column field="score" header="Score" body={scoreBody} />
          <Column field="source" header="Fuente" />
          <Column field="stage" header="Etapa" body={stageBody} />
        </DataTable>
      </Card>

      {/* Campaigns */}
      <Card title="📢 Campañas" className="mt-3">
        <DataTable value={campaignList} loading={loading} size="small" stripedRows>
          <Column field="name" header="Nombre" />
          <Column field="platform" header="Plataforma" />
          <Column field="budget" header="Presupuesto" body={(r: any) => `$${Number(r.budget || 0).toLocaleString()}`} />
          <Column field="spent" header="Gastado" body={(r: any) => `$${Number(r.spent || 0).toLocaleString()}`} />
          <Column field="status" header="Estado" body={(r: any) => <Tag severity={r.status === 'active' ? 'success' : 'warning'} value={r.status} />} />
        </DataTable>
      </Card>
    </div>
  );
}
