import { useEffect, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Dialog } from '@/components/molecules/Dialog';
import { InputText } from '@/components/atoms/InputText';

export interface CreateLeadFormValues {
  email: string;
  name: string;
  phone: string;
  company: string;
  note: string;
  productId: string;
}

interface CreateLeadDialogProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (values: CreateLeadFormValues) => void;
  isPending?: boolean;
  products: Array<{ id: string; name: string }>;
  defaultProductId?: string;
}

const emptyForm = (): CreateLeadFormValues => ({
  email: '',
  name: '',
  phone: '',
  company: '',
  note: '',
  productId: '',
});

export function CreateLeadDialog({
  visible,
  onClose,
  onSubmit,
  isPending,
  products,
  defaultProductId,
}: CreateLeadDialogProps) {
  const [form, setForm] = useState<CreateLeadFormValues>(emptyForm);

  useEffect(() => {
    if (!visible) return;
    setForm({
      ...emptyForm(),
      productId: defaultProductId ?? '',
    });
  }, [visible, defaultProductId]);

  const handleSubmit = () => {
    if (!form.email.trim()) return;
    onSubmit(form);
  };

  return (
    <Dialog
      visible={visible}
      onHide={onClose}
      title="Agregar lead"
      description="Alta manual para prospectos que no vienen de formulario o inbox social."
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            loading={isPending}
            disabled={!form.email.trim()}
          >
            Crear lead
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <InputText
          label="Email"
          type="email"
          required
          fullWidth
          value={form.email}
          onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
          placeholder="cliente@ejemplo.com"
        />
        <InputText
          label="Nombre"
          fullWidth
          value={form.name}
          onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
          placeholder="Nombre del contacto"
        />
        <InputText
          label="Teléfono"
          fullWidth
          value={form.phone}
          onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))}
          placeholder="+52 …"
        />
        <InputText
          label="Empresa"
          fullWidth
          value={form.company}
          onChange={(e) => setForm((current) => ({ ...current, company: e.target.value }))}
        />
        {products.length > 0 && (
          <div className="flex flex-col gap-1">
            <label htmlFor="create-lead-product" className="text-sm font-medium">
              Producto
            </label>
            <select
              id="create-lead-product"
              className="h-10 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm"
              value={form.productId}
              onChange={(e) => setForm((current) => ({ ...current, productId: e.target.value }))}
            >
              <option value="">Sin asignar</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label htmlFor="create-lead-note" className="text-sm font-medium">
            Nota (opcional)
          </label>
          <textarea
            id="create-lead-note"
            rows={3}
            className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-sm"
            value={form.note}
            onChange={(e) => setForm((current) => ({ ...current, note: e.target.value }))}
            placeholder="Ej. Referido por un cliente, visto en feria…"
          />
        </div>
      </div>
    </Dialog>
  );
}
