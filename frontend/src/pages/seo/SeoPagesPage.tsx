import { useEffect, useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { getCurrentTenant } from '../../stores/authStore';
import { seoPages } from '../../services/api';

const statusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
];

export default function SeoPagesPage() {
  const tenant = getCurrentTenant();
  const [pageList, setPageList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newCity, setNewCity] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newStatus, setNewStatus] = useState('draft');

  const fetchPages = () => {
    if (!tenant) return;
    setLoading(true);
    seoPages.list(tenant.id).then(r => setPageList(r.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchPages(); }, [tenant?.id]);

  const handleCreate = async () => {
    if (!newCity || !newSlug || !newTitle || !tenant) return;
    await seoPages.create(tenant.id, { city: newCity, slug: newSlug, title: newTitle, status: newStatus });
    setShowNew(false);
    setNewCity('');
    setNewSlug('');
    setNewTitle('');
    setNewStatus('draft');
    fetchPages();
  };

  const statusBody = (row: any) => {
    const severity = row.status === 'published' ? 'success' : 'warning';
    return <Tag severity={severity} value={row.status} />;
  };

  return (
    <div>
      <div className="flex justify-content-between align-items-center mb-3">
        <h2 className="mt-0">Páginas SEO Local</h2>
        <Button label="+ Nueva Página" icon="pi pi-plus" onClick={() => setShowNew(true)} />
      </div>

      <Card>
        <DataTable
          value={pageList}
          loading={loading}
          size="small"
          stripedRows
        >
          <Column field="city" header="Ciudad" />
          <Column field="slug" header="Slug" />
          <Column field="title" header="Título" />
          <Column field="status" header="Estado" body={statusBody} />
        </DataTable>
      </Card>

      <Dialog header="Nueva Página SEO" visible={showNew} onHide={() => setShowNew(false)} style={{ width: '400px' }}>
        <div className="flex flex-column gap-2">
          <InputText placeholder="Ciudad" value={newCity} onChange={e => setNewCity(e.target.value)} />
          <InputText placeholder="Slug" value={newSlug} onChange={e => setNewSlug(e.target.value)} />
          <InputText placeholder="Título" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
          <Dropdown
            value={newStatus}
            options={statusOptions}
            onChange={e => setNewStatus(e.value)}
            placeholder="Estado"
          />
          <Button label="Crear" onClick={handleCreate} disabled={!newCity || !newSlug || !newTitle} />
        </div>
      </Dialog>
    </div>
  );
}
