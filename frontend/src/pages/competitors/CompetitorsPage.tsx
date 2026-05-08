import { useEffect, useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { getCurrentTenant } from '../../stores/authStore';
import { competitors } from '../../services/api';

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

  const statusBody = (row: any) => <Tag severity={row.status === 'active' ? 'success' : 'warning'} value={row.status} />;

  const sentimentBody = (row: any) => {
    const severity = row.sentiment === 'positive' ? 'success' : row.sentiment === 'negative' ? 'danger' : 'warning';
    return <Tag severity={severity} value={row.sentiment} />;
  };

  const dateBody = (row: any) => {
    if (!row.date) return '';
    return new Date(row.date).toLocaleDateString();
  };

  return (
    <div>
      <div className="flex justify-content-between align-items-center mb-3">
        <h2 className="mt-0">Competidores</h2>
        <Button label="+ Agregar Competidor" icon="pi pi-plus" onClick={() => setShowNew(true)} />
      </div>

      <Card>
        <DataTable
          value={competitorList}
          loading={loading}
          size="small"
          stripedRows
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          rowExpansionTemplate={(row: any) => (
            <div className="p-3">
              <h5>Menciones</h5>
              <DataTable value={row.mentions || []} size="small">
                <Column field="source" header="Fuente" />
                <Column field="title" header="Título" />
                <Column field="sentiment" header="Sentimiento" body={sentimentBody} />
                <Column field="date" header="Fecha" body={dateBody} />
              </DataTable>
            </div>
          )}
        >
          <Column expander style={{ width: '40px' }} />
          <Column field="name" header="Nombre" />
          <Column field="website" header="Website" />
          <Column field="status" header="Estado" body={statusBody} />
        </DataTable>
      </Card>

      <Dialog header="Nuevo Competidor" visible={showNew} onHide={() => setShowNew(false)} style={{ width: '400px' }}>
        <div className="flex flex-column gap-2">
          <InputText placeholder="Nombre" value={newName} onChange={e => setNewName(e.target.value)} />
          <InputText placeholder="Website" value={newWebsite} onChange={e => setNewWebsite(e.target.value)} />
          <InputText placeholder="Descripción" value={newDescription} onChange={e => setNewDescription(e.target.value)} />
          <Button label="Crear" onClick={handleCreate} disabled={!newName} />
        </div>
      </Dialog>
    </div>
  );
}
