import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/atoms/Button';
import { InputText } from '@/components/atoms/InputText';
import { Textarea } from '@/components/atoms/Textarea';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import { createProduct } from '@/services/products';
import type { CreateProductPayload, ProductCategory } from '@/types/product';

const selectClass =
  'h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';

const CATEGORY_OPTIONS: Array<{ label: string; value: ProductCategory }> = [
  { label: 'Producto físico', value: 'physical' },
  { label: 'Producto digital', value: 'digital' },
  { label: 'Servicio', value: 'service' },
  { label: 'Suscripción', value: 'subscription' },
  { label: 'Otro', value: 'other' },
];

export default function ProductCreatePage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProductCategory>('service');
  const [priceRange, setPriceRange] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [valueProposition, setValueProposition] = useState('');

  const createMutation = useMutation({
    mutationFn: (payload: CreateProductPayload) => createProduct(payload),
    onSuccess: (product) => {
      toast.success('Producto creado');
      navigate(`/products/${product.id}`);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo crear el producto');
    },
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    createMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      priceRange: priceRange.trim() || undefined,
      targetAudience: targetAudience.trim() || undefined,
      valueProposition: valueProposition.trim() || undefined,
      isPrimary: true,
    });
  };

  return (
    <DashboardShell>
      <PageHeader
        title="Nuevo producto"
        description="Describe lo que quieres promocionar. Las campañas usarán este contexto."
      />

      <Card title="Datos del producto o servicio">
        <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-4">
          <InputText
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Plan de consultoría SEO"
            required
          />

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-[var(--foreground)]">Tipo</span>
            <select
              className={selectClass}
              value={category}
              onChange={(e) => setCategory(e.target.value as ProductCategory)}
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-[var(--spacing-xs)]">
            <label className="text-sm font-medium text-[var(--foreground)]">Descripción</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Qué es, para quién y qué problema resuelve"
              rows={3}
            />
          </div>

          <InputText
            label="Rango de precio (opcional)"
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            placeholder="Ej. $500 – $2,000 MXN"
          />

          <div className="flex flex-col gap-[var(--spacing-xs)]">
            <label className="text-sm font-medium text-[var(--foreground)]">Audiencia objetivo</label>
            <Textarea
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="¿Quién compra esto?"
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-[var(--spacing-xs)]">
            <label className="text-sm font-medium text-[var(--foreground)]">Propuesta de valor</label>
            <Textarea
              value={valueProposition}
              onChange={(e) => setValueProposition(e.target.value)}
              placeholder="Por qué elegirte frente a alternativas"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={createMutation.isPending}>
              Guardar producto
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/products')}>
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </DashboardShell>
  );
}
