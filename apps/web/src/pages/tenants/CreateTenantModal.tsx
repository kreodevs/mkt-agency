import { FormEvent, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Dialog } from '@/components/molecules/Dialog';
import { Button } from '@/components/atoms/Button';
import { InputText } from '@/components/atoms/InputText';
import { Password } from '@/components/atoms/Password';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import { createTenant, type CreateTenantPayload } from '@/services/tenants';
import type { TenantPlan } from '@/types/tenant';

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

export function CreateTenantModal({ visible, onHide, onCreated }: CreateTenantModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [plan, setPlan] = useState<TenantPlan>('starter');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');

  useEffect(() => {
    if (!visible) return;
    setName('');
    setSlug('');
    setSlugTouched(false);
    setPlan('starter');
    setOwnerName('');
    setOwnerEmail('');
    setOwnerPassword('');
  }, [visible]);

  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugify(name));
    }
  }, [name, slugTouched]);

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
    createMutation.mutate({
      name: name.trim(),
      slug: slug.trim(),
      plan,
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
          <label className="text-sm font-medium text-[var(--foreground)]">Plan</label>
          <select
            className={selectClass}
            value={plan}
            onChange={(e) => setPlan(e.target.value as TenantPlan)}
          >
            <option value="starter">Starter</option>
            <option value="professional">Professional</option>
            <option value="enterprise">Enterprise</option>
          </select>
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
