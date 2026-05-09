import { useEffect, useState } from 'react';
import { Button, Card, DataTable, Dialog, Dropdown, InputText } from '@/components/ui';
import { getCurrentTenant } from '../../stores/authStore';
import { seoPages } from '../../services/api';

const statusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
];

const statusTag = (status: string) => {
  const isPublished = status === 'published';
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
      {status}
    </span>
  );
};

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

  const columns = [
    { field: 'city', header: 'Ciudad' },
    { field: 'slug', header: 'Slug' },
    { field: 'title', header: 'Título' },
    { field: 'status', header: 'Estado', body: (r: any) => statusTag(r.status) },
  ];

  return (
    <div>
      <div className="flex justify-content-between align-items-center mb-3">
        <h2 className="mt-0">Páginas SEO Local</h2>
        <Button label="+ Nueva Página" icon="pi pi-plus" onClick={() => setShowNew(true)} />
      </div>

      <Card>
        <DataTable
          data={pageList}
          loading={loading}
          dense
          striped
          columns={columns}
        />
      </Card>

      <Dialog header="Nueva Página SEO" visible={showNew} onHide={() => setShowNew(false)} size="sm">
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
