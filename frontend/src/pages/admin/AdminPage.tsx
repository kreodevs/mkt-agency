import { useEffect, useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { tenants, products } from '../../services/api';

export default function AdminPage() {
  const [tenantList, setTenantList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProduct, setShowProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const newProductType = 'saas';
  const [selectedTenant, setSelectedTenant] = useState<any>(null);

  const fetchTenants = () => {
    setLoading(true);
    tenants.list().then(r => setTenantList(r.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchTenants(); }, []);

  const handleAddProduct = async () => {
    if (!selectedTenant || !newProductName) return;
    await products.create(selectedTenant.id, { name: newProductName, type: newProductType });
    setShowProduct(false);
    setNewProductName('');
    fetchTenants();
  };

  return (
    <div>
      <h2 className="mt-0">Administración</h2>

      <Card title="Empresas / Tenants">
        <DataTable value={tenantList} loading={loading} size="small" stripedRows>
          <Column field="name" header="Nombre" />
          <Column field="ownerId" header="Dueño" />
          <Column
            header="Productos"
            body={(row: any) => (
              <div className="flex flex-wrap gap-1">
                {(row.products || []).map((p: any) => (
                  <span key={p.id} className="border-round px-2 py-1 text-sm" style={{ background: '#e3f2fd' }}>
                    {p.name} ({p.type})
                  </span>
                ))}
                <Button
                  icon="pi pi-plus"
                  rounded
                  text
                  size="small"
                  onClick={() => { setSelectedTenant(row); setShowProduct(true); }}
                />
              </div>
            )}
          />
        </DataTable>
      </Card>

      <Dialog header="Agregar Producto" visible={showProduct} onHide={() => setShowProduct(false)} style={{ width: '400px' }}>
        <div className="flex flex-column gap-2">
          <InputText placeholder="Nombre del producto" value={newProductName} onChange={e => setNewProductName(e.target.value)} />
          <Button label="Agregar" onClick={handleAddProduct} disabled={!newProductName} />
        </div>
      </Dialog>
    </div>
  );
}
