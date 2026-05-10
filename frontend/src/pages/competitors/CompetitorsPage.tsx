import { useEffect, useState } from 'react';
import { Button, Card, DataTable, Dialog, InputText } from '@/components/ui';
import { getCurrentTenant } from '../../stores/authStore';
import { competitors } from '../../services/api';

const statusTag = (status: string) => {
  const isActive = status === 'active';
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
      {status}
    </span>
  );
};

const sentimentTag = (sentiment: string) => {
  const classes: Record<string, string> = {
    positive: 'bg-emerald-100 text-emerald-800',
    negative: 'bg-red-100 text-red-800',
  };
  const cls = classes[sentiment] || 'bg-amber-100 text-amber-800';
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${cls}`}>
      {sentiment}
    </span>
  );
};

export default function CompetitorsPage() {
  const tenant = getCurrentTenant();
  const [competitorList, setCompetitorList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<any>(null);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newWebsite, setNewWebsite] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const fetchCompetitors = () => {
    if (!tenant) return;
    setLoading(true);
    competitors.list(tenant.id).then(r => setCompetitorList(r.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCompetitors(); }, [tenant?.id]);

  const handleCreate = async () => {
    if (!newName || !tenant) return;
    await competitors.create(tenant.id, { name: newName, website: newWebsite, description: newDescription });
    setShowNew(false);
    setNewName('');
    setNewWebsite('');
    setNewDescription('');
    fetchCompetitors();
  };

  const dateBody = (row: any) => {
    if (!row.date) return '';
    return new Date(row.date).toLocaleDateString();
  };

  const mentionColumns = [
    { field: 'source', header: 'Fuente' },
    { field: 'title', header: 'Título' },
    { field: 'sentiment', header: 'Sentimiento', body: (r: any) => sentimentTag(r.sentiment) },
    { field: 'date', header: 'Fecha', body: dateBody },
  ];

  const columns = [
    { field: '', header: '', expander: true, width: '40px' },
    { field: 'name', header: 'Nombre' },
    { field: 'website', header: 'Website' },
    { field: 'status', header: 'Estado', body: (r: any) => statusTag(r.status) },
  ];

  return (
    <div>
      <div className="flex justify-content-between align-items-center mb-3">
        <h2 className="mt-0">Competidores</h2>
        <Button onClick={() => setShowNew(true)}>+ Agregar Competidor</Button>
      </div>

      <Card>
        <DataTable
          data={competitorList}
          loading={loading}
          dense
          striped
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          rowExpansionTemplate={(row: any) => (
            <div className="p-3">
              <h5>Menciones</h5>
              <DataTable data={row.mentions || []} dense columns={mentionColumns} />
            </div>
          )}
          columns={columns}
        />
      </Card>

      <Dialog header="Nuevo Competidor" visible={showNew} onHide={() => setShowNew(false)} size="sm">
        <div className="flex flex-column gap-2">
          <InputText placeholder="Nombre" value={newName} onChange={e => setNewName(e.target.value)} />
          <InputText placeholder="Website" value={newWebsite} onChange={e => setNewWebsite(e.target.value)} />
          <InputText placeholder="Descripción" value={newDescription} onChange={e => setNewDescription(e.target.value)} />
          <Button onClick={handleCreate} disabled={!newName}>Crear</Button>
        </div>
      </Dialog>
    </div>
  );
}
