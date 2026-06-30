import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/atoms/Button';
import { InputText } from '@/components/atoms/InputText';
import { Textarea } from '@/components/atoms/Textarea';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import { createCampaign, listCampaignTemplates } from '@/services/campaigns';
import { listProducts } from '@/services/products';
import type { CampaignScope, CreateCampaignPayload } from '@/types/campaign';

const PLATFORMS = ['facebook', 'instagram', 'google', 'linkedin', 'tiktok', 'email'] as const;

const selectClass =
  'h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';

export default function CampaignCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialProductId = searchParams.get('productId') ?? '';
  const initialScope = (searchParams.get('scope') as CampaignScope | null) ?? 'product';

  const [scope, setScope] = useState<CampaignScope>(
    initialScope === 'brand' ? 'brand' : 'product',
  );
  const [productId, setProductId] = useState(initialProductId);
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [platforms, setPlatforms] = useState<string[]>([]);

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: () => listProducts({ status: 'active', limit: 100 }),
  });

  const templatesQuery = useQuery({
    queryKey: ['campaign-templates'],
    queryFn: () => listCampaignTemplates({ page: 1, limit: 50 }),
  });

  const products = productsQuery.data?.items ?? [];

  useEffect(() => {
    if (!productId && products.length > 0 && scope === 'product') {
      const primary = products.find((p) => p.isPrimary) ?? products[0];
      setProductId(primary.id);
    }
  }, [products, productId, scope]);

  useEffect(() => {
    if (scope !== 'product' || !productId) return;
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setObjective((prev) => prev || product.valueProposition || '');
    setName((prev) => prev || `Campaña — ${product.name}`);
  }, [productId, products, scope]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateCampaignPayload) => createCampaign(payload),
    onSuccess: (campaign) => {
      toast.success('Campaña creada');
      navigate(`/campaigns/${campaign.id}`);
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : 'No se pudo crear la campaña';
      toast.error(message);
    },
  });

  const togglePlatform = (platform: string) => {
    setPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform],
    );
  };

  const onTemplateChange = (id: string) => {
    setTemplateId(id);
    const template = templatesQuery.data?.items.find((t) => t.id === id);
    if (template) {
      if (!objective && template.objective) setObjective(template.objective);
      if (platforms.length === 0 && template.platforms.length > 0) {
        setPlatforms(template.platforms);
      }
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const payload: CreateCampaignPayload = {
      name: name.trim(),
      objective: objective.trim() || undefined,
      scope,
      productId: scope === 'product' ? productId || undefined : undefined,
      templateId: templateId || undefined,
      platforms: platforms.length > 0 ? platforms : undefined,
    };

    const budget = parseFloat(totalBudget);
    if (!Number.isNaN(budget) && budget > 0) {
      payload.totalBudget = budget;
    }

    createMutation.mutate(payload);
  };

  return (
    <DashboardShell>
      <PageHeader
        title="Nueva campaña"
        description="Promociona un producto concreto o lanza una campaña de marca ocasional."
      />

      <Card>
        <form className="mx-auto max-w-xl space-y-4" onSubmit={onSubmit}>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-[var(--foreground)]">
              Tipo de campaña
            </legend>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setScope('product')}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  scope === 'product'
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                    : 'border-[var(--border)] text-[var(--foreground-muted)]'
                }`}
              >
                Sobre un producto
              </button>
              <button
                type="button"
                onClick={() => setScope('brand')}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  scope === 'brand'
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                    : 'border-[var(--border)] text-[var(--foreground-muted)]'
                }`}
              >
                Campaña de marca
              </button>
            </div>
          </fieldset>

          {scope === 'product' && (
            <div className="flex flex-col gap-[var(--spacing-xs)]">
              <label className="text-sm font-medium text-[var(--foreground)]">Producto</label>
              <select
                className={selectClass}
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                required
                disabled={productsQuery.isLoading}
              >
                <option value="">Selecciona un producto</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                    {product.isPrimary ? ' (principal)' : ''}
                  </option>
                ))}
              </select>
              {products.length === 0 && !productsQuery.isLoading && (
                <p className="text-xs text-[var(--foreground-muted)]">
                  Registra un producto en{' '}
                  <button
                    type="button"
                    className="text-[var(--primary)] underline"
                    onClick={() => navigate('/products/new')}
                  >
                    Mis productos
                  </button>{' '}
                  antes de continuar.
                </p>
              )}
            </div>
          )}

          <InputText
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
          />

          <div className="flex flex-col gap-[var(--spacing-xs)]">
            <label className="text-sm font-medium text-[var(--foreground)]">Objetivo</label>
            <Textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-[var(--spacing-xs)]">
            <label className="text-sm font-medium text-[var(--foreground)]">
              Plantilla (opcional)
            </label>
            <select
              className={selectClass}
              value={templateId}
              onChange={(e) => onTemplateChange(e.target.value)}
              disabled={templatesQuery.isLoading}
            >
              <option value="">Sin plantilla</option>
              {templatesQuery.data?.items.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                  {template.isPredefined ? ' (predefinida)' : ''}
                </option>
              ))}
            </select>
          </div>

          <InputText
            label="Presupuesto total (USD)"
            type="number"
            min="0"
            step="0.01"
            value={totalBudget}
            onChange={(e) => setTotalBudget(e.target.value)}
            fullWidth
          />

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-[var(--foreground)]">
              Plataformas
            </legend>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((platform) => {
                const selected = platforms.includes(platform);
                return (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => togglePlatform(platform)}
                    className={`rounded-full border px-3 py-1 text-xs capitalize transition-colors ${
                      selected
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                        : 'border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--primary)]/40'
                    }`}
                  >
                    {platform}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => navigate('/campaigns')}>
              Cancelar
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Crear campaña
            </Button>
          </div>
        </form>
      </Card>
    </DashboardShell>
  );
}
