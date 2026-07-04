import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Megaphone } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/atoms/Button';
import { InputText } from '@/components/atoms/InputText';
import { Textarea } from '@/components/atoms/Textarea';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { toast } from '@/components/molecules/Sonner';
import { ProductLogoPanel } from '@/components/products/ProductLogoPanel';
import { ProductMediaKitPanel } from '@/components/products/ProductMediaKitPanel';
import { ApiError } from '@/services/api';
import { archiveProduct, getProduct, updateProduct } from '@/services/products';
import type { ProductCategory, UpdateProductPayload } from '@/types/product';

const selectClass =
  'h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';

const CATEGORY_OPTIONS: Array<{ label: string; value: ProductCategory }> = [
  { label: 'Producto físico', value: 'physical' },
  { label: 'Producto digital', value: 'digital' },
  { label: 'Servicio', value: 'service' },
  { label: 'Suscripción', value: 'subscription' },
  { label: 'Otro', value: 'other' },
];

export default function ProductDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProductCategory>('service');
  const [priceRange, setPriceRange] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [valueProposition, setValueProposition] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  const productQuery = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id),
    enabled: Boolean(id),
  });

  useEffect(() => {
    const product = productQuery.data;
    if (!product) return;
    setName(product.name);
    setDescription(product.description ?? '');
    setCategory((product.category as ProductCategory) ?? 'service');
    setPriceRange(product.priceRange ?? '');
    setTargetAudience(product.targetAudience ?? '');
    setValueProposition(product.valueProposition ?? '');
    setWebsiteUrl(product.websiteUrl ?? '');
  }, [productQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (payload: UpdateProductPayload) => updateProduct(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      void queryClient.invalidateQueries({ queryKey: ['product', id] });
      toast.success('Producto actualizado');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo guardar');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => archiveProduct(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.message('Producto archivado');
      navigate('/products');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo archivar');
    },
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    saveMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      priceRange: priceRange.trim() || undefined,
      targetAudience: targetAudience.trim() || undefined,
      valueProposition: valueProposition.trim() || undefined,
      websiteUrl: websiteUrl.trim() || undefined,
    });
  };

  if (productQuery.isLoading) {
    return (
      <DashboardShell>
        <p className="text-sm text-[var(--foreground-muted)]">Cargando producto...</p>
      </DashboardShell>
    );
  }

  if (productQuery.isError || !productQuery.data) {
    return (
      <DashboardShell>
        <Card title="Producto no encontrado">
          <Link to="/products">
            <Button variant="outline">Volver al catálogo</Button>
          </Link>
        </Card>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <PageHeader
        title={productQuery.data.name}
        description="Edita la oferta comercial que alimenta tus campañas."
        actions={
          <div className="flex flex-wrap gap-2">
            {!productQuery.data.onboardingCompleted && (
              <Link to={`/products/${id}/onboarding`}>
                <Button variant="outline" className="gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Completar onboarding
                </Button>
              </Link>
            )}
            <Link to={`/campaigns/new?productId=${id}`}>
              <Button className="gap-2">
                <Megaphone className="h-4 w-4" />
                Nueva campaña
              </Button>
            </Link>
          </div>
        }
      />

      <div className="mb-6 space-y-4">
        <ProductLogoPanel
          productId={id}
          productName={productQuery.data.name}
          websiteUrl={websiteUrl || productQuery.data.websiteUrl}
          logoAssetId={productQuery.data.logoAssetId}
          logoSourceUrl={productQuery.data.logoSourceUrl}
          onUpdated={() => {
            void queryClient.invalidateQueries({ queryKey: ['product', id] });
          }}
        />
        <ProductMediaKitPanel productId={id} productName={productQuery.data.name} />
      </div>

      <Card title="Detalle del producto">
        <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-4">
          <InputText label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />

          <InputText
            label="Sitio web del producto"
            type="url"
            placeholder="https://..."
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
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
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>

          <InputText
            label="Rango de precio"
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
          />

          <div className="flex flex-col gap-[var(--spacing-xs)]">
            <label className="text-sm font-medium text-[var(--foreground)]">Audiencia objetivo</label>
            <Textarea
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-[var(--spacing-xs)]">
            <label className="text-sm font-medium text-[var(--foreground)]">Propuesta de valor</label>
            <Textarea
              value={valueProposition}
              onChange={(e) => setValueProposition(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" loading={saveMutation.isPending}>
              Guardar cambios
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/products')}>
              Volver
            </Button>
            <Button
              type="button"
              variant="outline"
              loading={archiveMutation.isPending}
              onClick={() => archiveMutation.mutate()}
            >
              Archivar
            </Button>
          </div>
        </form>
      </Card>
    </DashboardShell>
  );
}
