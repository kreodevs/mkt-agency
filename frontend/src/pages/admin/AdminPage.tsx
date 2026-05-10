import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, DataTable, Dialog, InputText } from '@/components/ui';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/molecules/AlertDialog';

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
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [newTenantName, setNewTenantName] = useState('');
  const [toastMsg, setToastMsg] = useState<any>(null);
  const toast = useRef<any>(null);
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
    setDeleteTarget(row);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await tenants.remove(deleteTarget.id);
      toast.current?.show({ severity: 'success', summary: 'Eliminado', detail: `Tenant "${deleteTarget.name}" eliminado` });
      fetchTenants();
    } catch (e: any) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error al eliminar' });
    }
    setDeleteTarget(null);
  };

  const viewUsers = async (row: any) => {
    try {
      const r = await users.list(row.id);
      setUserList(r.data || []);
      setSelectedTenant(row);
      setShowUserDialog(true);
    } catch {
      setToastMsg({severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los usuarios'});
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[var(--foreground)] mt-0">Administración</h2>
      </div>

      <Card>
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
          data={tenantList}
          loading={loading}
          columns={[
            { field: 'name', header: 'Nombre' },
            { field: 'ownerId', header: 'Dueño' },
            { field: 'products', header: 'Productos', body: productBody },
            { field: 'actions', header: 'Acciones', body: actionBody, width: '100px' },
          ]}
        />
      </Card>

      {/* Add Product Dialog */}
      <Dialog
        header="Agregar Producto"
        visible={showProduct}
        onHide={() => setShowProduct(false)}
       
size="md"
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
       
size="md"
      >
        <DataTable
          data={userList}
          columns={[
            { field: 'name', header: 'Nombre' },
            { field: 'email', header: 'Email' },
            { field: 'role', header: 'Rol' },
          ]}
        />
      </Dialog>

      {/* Create Tenant Dialog */}
      <Dialog
        header="Nuevo Tenant"
        visible={showCreateTenant}
        onHide={() => setShowCreateTenant(false)}
       
size="md"
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
      {toastMsg && (
        <div className="fixed bottom-4 right-4 z-[var(--z-toast)] bg-[var(--popover)] border border-[var(--border)] rounded-[var(--radius-md)] shadow-lg px-4 py-3 text-sm text-[var(--foreground)] max-w-sm">
          <span className="font-medium">{toastMsg.summary}: </span>
          <span className="text-[var(--foreground-muted)]">{toastMsg.detail}</span>
          <button onClick={() => setToastMsg(null)} className="ml-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] cursor-pointer border-none bg-transparent">&times;</button>
        </div>
      )}
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Tenant</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? `¿Eliminar permanentemente "${deleteTarget.name}"? Se borrarán todos sus productos, leads, campañas y datos.` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <button onClick={() => setDeleteTarget(null)} className="px-3 py-1.5 text-xs font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] bg-transparent rounded-[var(--radius-md)] hover:bg-[var(--secondary)] transition-colors cursor-pointer border-none">
              Cancelar
            </button>
            <button onClick={handleDeleteConfirm} className="px-3 py-1.5 text-xs font-medium bg-[var(--destructive)] text-white rounded-[var(--radius-md)] hover:opacity-90 transition-colors cursor-pointer border-none">
              Eliminar
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
