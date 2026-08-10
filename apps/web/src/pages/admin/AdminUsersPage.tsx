'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import { DashboardShell, superadminNavigation } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { Dialog } from '@/components/molecules/Dialog';
import { IconButton } from '@/components/atoms/IconButton';
import { DataTable, type DataTableColumn } from '@/components/organisms/DataTable';
import { InputText } from '@/components/atoms/InputText';
import { Select } from '@/components/atoms/Select';
import { AdminUserCard } from '@/components/admin/AdminUserCard';
import { StatusPill } from '@/components/atoms/StatusPill';
import { listSuperadminUsers, updateSuperadminUser, type SuperadminUser } from '@/services/superadmin';
import { toast } from 'sonner';

const roleLabels: Record<string, string> = {
  owner: 'Dueño',
  admin: 'Admin',
  member: 'Miembro',
  viewer: 'Espectador',
};

const statusLabels: Record<string, string> = {
  active: 'Activo',
  suspended: 'Suspendido',
  inactive: 'Inactivo',
};

const statusPillMap: Record<string, 'success' | 'error' | 'neutral'> = {
  active: 'success',
  suspended: 'error',
  inactive: 'neutral',
};

const filterInputClass =
  'h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editingUser, setEditingUser] = useState<SuperadminUser | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editName, setEditName] = useState('');
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ['superadmin-users', { search, page }],
    queryFn: () =>
      listSuperadminUsers({ page, limit: 50, search: search.trim() || undefined }),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; name?: string; role?: string; status?: string }) =>
      updateSuperadminUser(payload.id, { name: payload.name, role: payload.role, status: payload.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-users'] });
      setEditingUser(null);
      toast.success('Usuario actualizado');
    },
    onError: () => {
      toast.error('Error al actualizar usuario');
    },
  });

  const items = usersQuery.data?.items ?? [];
  const total = usersQuery.data?.total ?? 0;

  const columns: DataTableColumn[] = [
    {
      field: 'name',
      header: 'Nombre',
      body: (row) => {
        const u = row as SuperadminUser;
        return (
          <div className="flex items-center gap-2">
            <div className="flex h-avatar-sm w-avatar-sm items-center justify-center rounded-full bg-[var(--primary)] text-xs font-medium text-white">
              {u.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-medium">{u.name}</div>
              <div className="text-xs text-[var(--foreground-muted)]">{u.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      field: 'tenant',
      header: 'Tenant',
      body: (row) => {
        const u = row as SuperadminUser;
        if (u.isSuperadmin) return <span className="text-xs text-[var(--foreground-muted)]">—</span>;
        if (!u.tenant) return <span className="text-xs text-[var(--foreground-muted)]">Sin tenant</span>;
        return (
          <div>
            <div className="text-sm">{u.tenant.name}</div>
            <div className="text-xs text-[var(--foreground-muted)]">{u.tenant.slug} · {u.tenant.plan}</div>
          </div>
        );
      },
    },
    {
      field: 'role',
      header: 'Rol',
      body: (row) => {
        const u = row as SuperadminUser;
        if (u.isSuperadmin) {
          return (
            <StatusPill status="luxury" size="sm">
              Superadmin
            </StatusPill>
          );
        }
        return <span className="text-sm">{roleLabels[u.role] ?? u.role}</span>;
      },
    },
    {
      field: 'status',
      header: 'Estado',
      body: (row) => {
        const u = row as SuperadminUser;
        return (
          <StatusPill status={statusPillMap[u.status] ?? 'neutral'} size="sm">
            {statusLabels[u.status] ?? u.status}
          </StatusPill>
        );
      },
    },
    {
      field: 'createdAt',
      header: 'Creado',
      sortable: true,
      body: (row) =>
        new Intl.DateTimeFormat('es-ES', { dateStyle: 'short' }).format(
          new Date((row as SuperadminUser).createdAt),
        ),
    },
    {
      field: 'actions',
      header: '',
      body: (row) => {
        const u = row as SuperadminUser;
        return (
          <IconButton
            variant="ghost"
            label="Editar usuario"
            onClick={() => {
              setEditingUser(u);
              setEditRole(u.role);
              setEditStatus(u.status);
              setEditName(u.name);
            }}
          >
            <Pencil />
          </IconButton>
        );
      },
    },
  ];

  const totalPages = Math.ceil(total / 50);

  return (
    <DashboardShell navigationOverride={superadminNavigation}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Plataforma"
          title="Usuarios"
          description="Listado global de usuarios. Superadministración — todos los tenants."
        />

        <Card>
          <div className="mb-4">
            <InputText
              label="Buscar"
              placeholder="Nombre o email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="space-y-[var(--spacing-md)] md:hidden">
            {items.map((u) => (
              <AdminUserCard
                key={u.id}
                user={u}
                onEdit={() => {
                  setEditingUser(u);
                  setEditRole(u.role);
                  setEditStatus(u.status);
                  setEditName(u.name);
                }}
              />
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
          <DataTable
            columns={columns}
            data={items}
            loading={usersQuery.isLoading}
            emptyMessage="No se encontraron usuarios"
          />
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-center text-xs text-[var(--foreground-muted)] sm:text-left">
                {total} usuario{total !== 1 ? 's' : ''} · Pág. {page} de {totalPages}
              </span>
              <div className="flex justify-center gap-2">
                <button
                  className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--secondary)] disabled:opacity-40"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Anterior
                </button>
                <button
                  className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--secondary)] disabled:opacity-40"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Dialog visible={!!editingUser} onHide={() => setEditingUser(null)}>
        {editingUser && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Editar usuario</h3>

            <div className="text-sm space-y-1">
              <p><span className="font-medium">Email:</span> {editingUser.email}</p>
              <p><span className="font-medium">Tenant:</span> {editingUser.tenant?.name ?? '—'}</p>
              {editingUser.isSuperadmin && (
                <StatusPill status="luxury" size="sm" className="mt-1">
                  Superadmin global
                </StatusPill>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Nombre</label>
              <input
                className={filterInputClass}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>

            <Select
              label="Rol"
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              disabled={editingUser.isSuperadmin}
              options={[
                { value: 'owner', label: 'Dueño' },
                { value: 'admin', label: 'Admin' },
                { value: 'member', label: 'Miembro' },
                { value: 'viewer', label: 'Espectador' },
              ]}
            />

            <Select
              label="Estado"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              options={[
                { value: 'active', label: 'Activo' },
                { value: 'suspended', label: 'Suspendido' },
                { value: 'inactive', label: 'Inactivo' },
              ]}
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium"
                onClick={() => setEditingUser(null)}
              >
                Cancelar
              </button>
              <button
                className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                disabled={updateMutation.isPending}
                onClick={() =>
                  updateMutation.mutate({
                    id: editingUser.id,
                    name: editName,
                    role: editRole,
                    status: editStatus,
                  })
                }
              >
                {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </DashboardShell>
  );
}