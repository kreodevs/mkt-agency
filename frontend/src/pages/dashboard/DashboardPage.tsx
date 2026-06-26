import { useEffect, useState } from 'react';
import { Card, DataTable } from '@/components/ui';
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
    const clr = row.score >= 80 ? 'bg-destructive/10 text-destructive' : row.score >= 60 ? 'bg-warning/10 text-warning' : 'bg-accent/10 text-accent';
    return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${clr}`}>{row.score || '-'}</span>;
  };
  const stageBody = (row: any) => {
    const colors: Record<string, string> = { prospecto: 'bg-accent/10 text-accent', contactado: 'bg-warning/10 text-warning', interesado: 'bg-success/10 text-success', trial: 'bg-info/10 text-info', cliente: 'bg-success/10 text-success' };
    return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${colors[row.stage] || 'bg-accent/10 text-accent'}`}>{row.stage}</span>;
  };

  return (
    <div>
      <h2 className="mt-0">Dashboard</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <Card title="Leads Activos" className="text-center">
          <span className="text-4xl font-bold">{loading ? '...' : leadList.length}</span>
        </Card>
        <Card title="Calientes (80+)" className="text-center">
          <span className="text-4xl font-bold text-red-500">{loading ? '...' : hotLeads.length}</span>
        </Card>
        <Card title="Campañas" className="text-center">
          <span className="text-4xl font-bold">{loading ? '...' : campaignList.length}</span>
        </Card>
        <Card title="Gasto Total" className="text-center">
          <span className="text-4xl font-bold">
            ${loading ? '...' : campaignList.reduce((s: number, c: any) => s + Number(c.spent || 0), 0).toLocaleString()}
          </span>
        </Card>
      </div>

      {/* Hot Leads */}
      <Card title="🔥 Leads Calientes" className="mt-3">
        <DataTable
          data={hotLeads}
          loading={loading}
          columns={[
            { field: 'name', header: 'Nombre' },
            { field: 'clinic', header: 'Clínica' },
            { field: 'score', header: 'Score', body: scoreBody },
            { field: 'source', header: 'Fuente' },
            { field: 'stage', header: 'Etapa', body: stageBody },
          ]}
        />
      </Card>

      {/* Campaigns */}
      <Card title="📢 Campañas" className="mt-3">
        <DataTable
          data={campaignList}
          loading={loading}
          columns={[
            { field: 'name', header: 'Nombre' },
            { field: 'platform', header: 'Plataforma' },
            { field: 'budget', header: 'Presupuesto', body: (r: any) => `$${Number(r.budget || 0).toLocaleString()}` },
            { field: 'spent', header: 'Gastado', body: (r: any) => `$${Number(r.spent || 0).toLocaleString()}` },
            { field: 'status', header: 'Estado', body: (r: any) => <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${r.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{r.status}</span> },
          ]}
        />
      </Card>
    </div>
  );
}
