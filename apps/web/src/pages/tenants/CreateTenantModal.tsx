import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Dialog } from '@/components/molecules/Dialog';
import { Button } from '@/components/atoms/Button';
import { InputText } from '@/components/atoms/InputText';
import { Password } from '@/components/atoms/Password';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import { listPackages } from '@/services/packages';
import { createTenant, type CreateTenantPayload } from '@/services/tenants';

interface CreateTenantModalProps {
  visible: boolean;
  onHide: () => void;
  onCreated: () => void;
}

const selectClass =
  'h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

function formatBytes(bytes: number) {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export function CreateTenantModal({ visible, onHide, onCreated }: CreateTenantModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [packageId, setPackageId] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');

  const packagesQuery = useQuery({
    queryKey: ['packages', { activeOnly: true }],
    queryFn: () => listPackages(false),
    enabled: visible,
  });

  const activePackages = packagesQuery.data?.items ?? [];
  const selectedPackage = activePackages.find((pkg) => pkg.id === packageId);

  useEffect(() => {
    if (!visible) return;
    setName('');
    setSlug('');
    setSlugTouched(false);
    setPackageId('');
    setOwnerName('');
    setOwnerEmail('');
    setOwnerPassword('');
  }, [visible]);

  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugify(name));
    }
  }, [name, slugTouched]);

  useEffect(() => {
    if (activePackages.length && !packageId) {
      setPackageId(activePackages[0].id);
    }
  }, [activePackages, packageId]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateTenantPayload) => createTenant(payload),
    onSuccess: () => {
      toast.success('Tenant creado correctamente');
      onCreated();
      onHide();
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : 'No se pudo crear el tenant';
      toast.error(message);
    },
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!packageId) {
      toast.error('Selecciona un paquete');
      return;
    }
    createMutation.mutate({
      name: name.trim(),
      slug: slug.trim(),
      packageId,
      owner: {
        name: ownerName.trim(),
        email: ownerEmail.trim(),
        password: ownerPassword,
      },
    });
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      title="Nuevo tenant"
      description="Crea una organización y su usuario owner"
      size="lg"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onHide} disabled={createMutation.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="create-tenant-form" loading={createMutation.isPending}>
            Crear tenant
          </Button>
        </>
      }
    >
      <form id="create-tenant-form" className="space-y-4" onSubmit={onSubmit}>
        <InputText
          label="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          fullWidth
        />
        <InputText
          label="Slug"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          required
          fullWidth
          placeholder="mi-agencia"
        />
        <div className="flex flex-col gap-[var(--spacing-xs)]">
          <label className="text-sm font-medium text-[var(--foreground)]">Paquete</label>
          <select
            className={selectClass}
            value={packageId}
            onChange={(e) => setPackageId(e.target.value)}
            required
            disabled={packagesQuery.isLoading || activePackages.length === 0}
          >
            {activePackages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.name}
              </option>
            ))}
          </select>
          {selectedPackage && (
            <p className="text-xs text-[var(--foreground-muted)]">
              {selectedPackage.maxUsers} usuarios · {formatBytes(selectedPackage.maxAssetsSize)}{' '}
              storage · {formatBytes(selectedPackage.maxFileSize)}/archivo
            </p>
          )}
        </div>

        <div className="border-t border-[var(--border)] pt-4">
          <p className="mb-3 text-sm font-semibold text-[var(--foreground)]">Owner</p>
          <div className="space-y-4">
            <InputText
              label="Nombre"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              required
              fullWidth
            />
            <InputText
              label="Email"
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              required
              fullWidth
            />
            <div className="flex flex-col gap-[var(--spacing-xs)]">
              <label className="text-sm font-medium text-[var(--foreground)]">Contraseña</label>
              <Password
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                required
                minLength={8}
              />
              <p className="text-xs text-[var(--foreground-muted)]">
                Mín. 8 caracteres, mayúscula, número y símbolo.
              </p>
            </div>
          </div>
        </div>
      </form>
    </Dialog>
  );
}

export default CreateTenantModal;
