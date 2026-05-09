import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { InputText } from 'primereact/inputtext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import { tenants, products, users, auth } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { Plus, Trash2, Users, Check, Store, Package } from 'lucide-react';

export default function AdminPage() {
  const [tenantList, setTenantList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProduct, setShowProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const newProductType = 'saas';
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showCreateTenant, setShowCreateTenant] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const toast = useRef<Toast>(null);
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();
  const currentProductId = sessionStorage.getItem('currentProductId');

  const refreshUserStore = () => {
    auth.me().then(r => setUser(r.data)).catch(() => {});
  };

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
    refreshUserStore();
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
      refreshUserStore();
      fetchTenants();
    } catch (e: any) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error al crear tenant' });
    }
  };

  const productBody = (row: any) => (
    <div className="flex flex-wrap gap-1.5 items-center">
      {(row.products || []).map((p: any) => {
        const isSelected = p.id === currentProductId;
        return (
          <button
            key={p.id}
            onClick={() => {
              sessionStorage.setItem('currentProductId', p.id);
              sessionStorage.setItem('currentTenantId', row.id);
              navigate('/settings');
            }}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-[var(--radius-sm)] border transition-colors cursor-pointer ${
              isSelected
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] font-medium'
                : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
            }`}
          >
            {isSelected && <Check size={12} />}
            <Package size={12} />
            {p.name}
          </button>
        );
      })}
      <button
        onClick={() => { setSelectedTenant(row); setShowProduct(true); }}
        className="inline-flex items-center justify-center w-6 h-6 rounded-[var(--radius-sm)] text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)] hover:text-[var(--primary)] transition-colors cursor-pointer border-none bg-transparent"
      >
        <Plus size={14} />
      </button>
    </div>
  );

  const actionBody = (row: any) => (
    <div className="flex gap-1">
      <button
        onClick={() => viewUsers(row)}
        className="inline-flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)] hover:text-[var(--primary)] transition-colors cursor-pointer border-none bg-transparent"
        title="Usuarios"
      >
        <Users size={16} />
      </button>
      <button
        onClick={() => confirmDeleteTenant(row)}
        className="inline-flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)] hover:text-[var(--destructive)] transition-colors cursor-pointer border-none bg-transparent"
        title="Eliminar"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );

  return (
    <div>
      <Toast ref={toast} />
      <ConfirmDialog
        pt={{
          root: { className: '!bg-[var(--popover)] !text-[var(--popover-foreground)] !border !border-[var(--card-border)] !rounded-[var(--radius-lg)]' },
          header: { className: '!bg-transparent !text-[var(--foreground)] !p-4 !pb-0' },
          content: { className: '!bg-transparent !text-[var(--foreground-muted)] !p-4 !text-sm' },
          footer: { className: '!bg-transparent !p-4 !pt-0 !flex !justify-end !gap-2' },
        }}
      />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[var(--foreground)] mt-0">Administración</h2>
      </div>

      <Card
        className="!bg-[var(--card)] !text-[var(--card-foreground)] !border !border-[var(--card-border)] !rounded-[var(--radius-lg)]"
        pt={{
          title: { className: 'text-base font-semibold text-[var(--foreground)]' },
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Store size={18} className="text-[var(--primary)]" />
            <span className="text-sm font-semibold text-[var(--foreground)]">Empresas / Tenants</span>
          </div>
          <button
            onClick={() => setShowCreateTenant(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius-md)] text-xs font-medium hover:bg-[var(--primary-hover)] transition-colors cursor-pointer border-none"
          >
            <Plus size={14} />
            Nuevo
          </button>
        </div>

        <DataTable
          value={tenantList}
          loading={loading}
          size="small"
          stripedRows
          pt={{
            root: { className: '!text-sm !text-[var(--foreground)]' },
            header: { className: '!bg-transparent' },
            bodyRow: { className: '!bg-transparent hover:!bg-[var(--muted)] transition-colors' },
            headerRow: { className: '!bg-transparent' },
            loadingOverlay: { className: '!bg-[var(--background)]/50' },
            wrapper: { className: '!bg-transparent' },
            emptyMessage: { className: '!text-[var(--foreground-muted)] !text-sm !py-6' },
          }}
        >
          <Column field="name" header="Nombre" />
          <Column field="ownerId" header="Dueño" />
          <Column header="Productos" body={productBody} />
          <Column header="Acciones" body={actionBody} style={{ width: '100px' }} />
        </DataTable>
      </Card>

      {/* Add Product Dialog */}
      <Dialog
        header="Agregar Producto"
        visible={showProduct}
        onHide={() => setShowProduct(false)}
        style={{ width: '400px' }}
        pt={{
          root: { className: '!bg-[var(--popover)] !text-[var(--popover-foreground)]' },
          header: { className: '!bg-transparent !text-[var(--foreground)] !text-sm !font-semibold !p-4 !pb-0' },
          headerTitle: { className: '!text-sm !font-semibold' },
          content: { className: '!bg-transparent !p-4' },
          mask: { className: '!bg-black/60' },
        }}
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-[0.05em]">Nombre del producto</label>
            <InputText
              placeholder="Ej: OralTrack"
              value={newProductName}
              onChange={e => setNewProductName(e.target.value)}
              className="!w-full !bg-[var(--input)] !text-[var(--foreground)] !border !border-[var(--input-border)] !rounded-[var(--radius-md)] !px-3 !py-2 !text-sm !placeholder:text-[var(--foreground-subtle)]"
            />
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <button
              onClick={() => setShowProduct(false)}
              className="px-3 py-1.5 text-xs font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] bg-transparent rounded-[var(--radius-md)] hover:bg-[var(--secondary)] transition-colors cursor-pointer border-none"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddProduct}
              disabled={!newProductName}
              className="px-3 py-1.5 text-xs font-medium bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius-md)] hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors cursor-pointer border-none"
            >
              Agregar
            </button>
          </div>
        </div>
      </Dialog>

      {/* Users Dialog */}
      <Dialog
        header={`Usuarios — ${selectedTenant?.name || ''}`}
        visible={showUserDialog}
        onHide={() => setShowUserDialog(false)}
        style={{ width: '500px' }}
        pt={{
          root: { className: '!bg-[var(--popover)] !text-[var(--popover-foreground)]' },
          header: { className: '!bg-transparent !text-[var(--foreground)] !text-sm !font-semibold !p-4 !pb-0' },
          content: { className: '!bg-transparent !p-4' },
          mask: { className: '!bg-black/60' },
        }}
      >
        <DataTable
          value={userList}
          size="small"
          stripedRows
          pt={{
            root: { className: '!text-sm !text-[var(--foreground)]' },
            bodyRow: { className: '!bg-transparent hover:!bg-[var(--muted)]' },
            headerRow: { className: '!bg-transparent' },
          }}>
          <Column field="name" header="Nombre" />
          <Column field="email" header="Email" />
          <Column field="role" header="Rol" />
        </DataTable>
      </Dialog>

      {/* Create Tenant Dialog */}
      <Dialog
        header="Nuevo Tenant"
        visible={showCreateTenant}
        onHide={() => setShowCreateTenant(false)}
        style={{ width: '400px' }}
        pt={{
          root: { className: '!bg-[var(--popover)] !text-[var(--popover-foreground)]' },
          header: { className: '!bg-transparent !text-[var(--foreground)] !text-sm !font-semibold !p-4 !pb-0' },
          content: { className: '!bg-transparent !p-4' },
          mask: { className: '!bg-black/60' },
        }}
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-[0.05em]">Nombre del tenant</label>
            <InputText
              placeholder="Ej: KreoDevs"
              value={newTenantName}
              onChange={e => setNewTenantName(e.target.value)}
              className="!w-full !bg-[var(--input)] !text-[var(--foreground)] !border !border-[var(--input-border)] !rounded-[var(--radius-md)] !px-3 !py-2 !text-sm !placeholder:text-[var(--foreground-subtle)]"
            />
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <button
              onClick={() => setShowCreateTenant(false)}
              className="px-3 py-1.5 text-xs font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] bg-transparent rounded-[var(--radius-md)] hover:bg-[var(--secondary)] transition-colors cursor-pointer border-none"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateTenant}
              disabled={!newTenantName}
              className="px-3 py-1.5 text-xs font-medium bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius-md)] hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors cursor-pointer border-none"
            >
              Crear
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
