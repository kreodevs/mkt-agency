import { useEffect, useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { InputText } from 'primereact/inputtext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { tenants, products, users } from '../../services/api';
import { useRef } from 'react';

export default function AdminPage() {
  const [tenantList, setTenantList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProduct, setShowProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const newProductType = 'saas';
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showCreateTenant, setShowCreateTenant] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const toast = useRef<Toast>(null);

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

  const confirmDeleteTenant = (row: any) => {
    confirmDialog({
      message: `¿Eliminar permanentemente "${row.name}"? Se borrarán todos sus productos, leads, campañas y datos.`,
      header: 'Eliminar Tenant',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await tenants.remove(row.id);
          toast.current?.show({ severity: 'success', summary: 'Eliminado', detail: `Tenant "${row.name}" eliminado` });
          fetchTenants();
        } catch (e: any) {
          toast.current?.show({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error al eliminar' });
        }
      },
    });
  };

  const viewUsers = async (row: any) => {
    try {
      const r = await users.list(row.id);
      setUserList(r.data || []);
      setSelectedTenant(row);
      setShowUserDialog(true);
    } catch {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los usuarios' });
    }
  };

  const handleCreateTenant = async () => {
    if (!newTenantName) return;
    try {
      await tenants.create({ name: newTenantName });
      toast.current?.show({ severity: 'success', summary: 'Creado', detail: `Tenant "${newTenantName}" creado` });
      setShowCreateTenant(false);
      setNewTenantName('');
      fetchTenants();
    } catch (e: any) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error al crear tenant' });
    }
  };

  const actionBodyTemplate = (row: any) => (
    <div className="flex gap-2">
      <Button icon="pi pi-users" rounded text size="small" tooltip="Usuarios"
        onClick={() => viewUsers(row)} />
      <Button icon="pi pi-trash" rounded text severity="danger" size="small" tooltip="Eliminar"
        onClick={() => confirmDeleteTenant(row)} />
    </div>
  );

  return (
    <div>
      <Toast ref={toast} />
      <ConfirmDialog />

      <h2 className="mt-0">Administración</h2>

      <Card title="Empresas / Tenants"
        pt={{ title: (opts: any) => (
          <div className="flex align-items-center justify-content-between w-full">
            <span>{opts.props.title}</span>
            <Button icon="pi pi-plus" label="Nuevo" size="small" onClick={() => setShowCreateTenant(true)} />
          </div>
        )}}>
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
          <Column header="Acciones" body={actionBodyTemplate} style={{ width: '120px' }} />
        </DataTable>
      </Card>

      <Dialog header="Agregar Producto" visible={showProduct} onHide={() => setShowProduct(false)} style={{ width: '400px' }}>
        <div className="flex flex-column gap-2">
          <InputText placeholder="Nombre del producto" value={newProductName} onChange={e => setNewProductName(e.target.value)} />
          <Button label="Agregar" onClick={handleAddProduct} disabled={!newProductName} />
        </div>
      </Dialog>

      <Dialog header={`Usuarios — ${selectedTenant?.name || ''}`} visible={showUserDialog}
        onHide={() => setShowUserDialog(false)} style={{ width: '500px' }}>
        <DataTable value={userList} size="small" stripedRows>
          <Column field="name" header="Nombre" />
          <Column field="email" header="Email" />
          <Column field="role" header="Rol" />
        </DataTable>
      </Dialog>

      <Dialog header="Nuevo Tenant" visible={showCreateTenant}
        onHide={() => setShowCreateTenant(false)} style={{ width: '400px' }}>
        <div className="flex flex-column gap-2">
          <InputText placeholder="Nombre del tenant" value={newTenantName}
            onChange={e => setNewTenantName(e.target.value)} />
          <Button label="Crear" onClick={handleCreateTenant} disabled={!newTenantName} />
        </div>
      </Dialog>
    </div>
  );
}
