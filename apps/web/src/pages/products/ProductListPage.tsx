import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Megaphone, Package, Plus, Sparkles, Star, Webhook } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { ProductListCard } from '@/components/products/ProductListCard';
import { Button } from '@/components/atoms/Button';
import { StatusPill } from '@/components/atoms/StatusPill';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { EmptyState } from '@/components/molecules/EmptyState';
import { DataTable, type DataTableColumn } from '@/components/organisms/DataTable';
import { useOperatingProfile } from '@/hooks/useOperatingProfile';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { listProducts } from '@/services/products';
import type { Product } from '@/types/product';

export default function ProductListPage() {
  const navigate = useNavigate();
  const { isGrowth } = useOperatingProfile();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const sohoMode = !isGrowth;

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: () => listProducts({ status: 'active', limit: 100 }),
  });

  const items = productsQuery.data?.items ?? [];
  const useCardLayout = sohoMode || isMobile;

  const columns: DataTableColumn[] = [
    {
      field: 'name',
      header: 'Producto / servicio',
      sortable: true,
      width: '180px',
      body: (row) => {
        const product = row as Product;
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{product.name}</span>
            {product.isPrimary && (
              <Star className="h-3.5 w-3.5 fill-[var(--warning)] text-[var(--warning)]" aria-label="Principal" />
            )}
          </div>
        );
      },
    },
    {
      field: 'targetAudience',
      header: 'Audiencia',
      width: '200px',
      wrap: true,
      body: (row) => {
        const value = (row as Product).targetAudience;
        return value ? (
          <span className="block line-clamp-3 break-words text-sm leading-snug text-[var(--foreground-muted)]">
            {value}
          </span>
        ) : (
          '—'
        );
      },
    },
    {
      field: 'category',
      header: 'Tipo',
      width: '100px',
      body: (row) => (row as Product).category ?? '—',
    },
    {
      field: 'onboarding',
      header: 'Onboarding',
      body: (row) => {
        const product = row as Product;
        const pct = product.onboardingCompletionPercentage ?? 0;
        const done = product.onboardingCompleted;
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm tabular-nums text-[var(--foreground-muted)]">{pct}%</span>
            {!done && (
              <Link to={`/products/${product.id}/onboarding`}>
                <Button variant="outline" size="sm" className="gap-1">
                  <ClipboardList className="h-3.5 w-3.5" />
                  Completar
                </Button>
              </Link>
            )}
          </div>
        );
      },
    },
    {
      field: 'status',
      header: 'Estado',
      body: (row) => (
        <StatusPill
          status={(row as Product).status === 'active' ? 'success' : 'neutral'}
          size="sm"
        >
          {(row as Product).status === 'active' ? 'Activo' : 'Archivado'}
        </StatusPill>
      ),
    },
    {
      field: 'actions',
      header: '',
      body: (row) => {
        const product = row as Product;
        return (
          <div className="flex justify-end gap-2">
            {!sohoMode && (
              <>
                <Link to={`/products/${product.id}#publicacion-n8n`}>
                  <Button variant="outline" size="sm" className="gap-1" title="Configurar webhook n8n">
                    <Webhook className="h-3.5 w-3.5" />
                    n8n
                  </Button>
                </Link>
                <Link to={`/campaigns/new?productId=${product.id}`}>
                  <Button size="sm" className="gap-1">
                    <Megaphone className="h-3.5 w-3.5" />
                    Campaña
                  </Button>
                </Link>
              </>
            )}
            <Link to={`/products/${product.id}`}>
              <Button variant="outline" size="sm">
                Editar
              </Button>
            </Link>
          </div>
        );
      },
    },
  ];

  return (
    <DashboardShell>
      <PageHeader
        eyebrow={sohoMode ? 'Oferta comercial' : 'Catálogo'}
        title={sohoMode ? 'Mi producto' : 'Mis productos'}
        description={
          sohoMode
            ? 'Tu oferta comercial: el copiloto genera contenido a partir de lo que vendes.'
            : 'Centro de tu catálogo: las campañas se crean sobre lo que vendes.'
        }
        actions={
          <Button variant="brand" className="gap-2" onClick={() => navigate('/products/new')}>
            <Plus className="h-4 w-4" />
            {sohoMode ? 'Agregar producto' : 'Nuevo producto'}
          </Button>
        }
      />

      {items.length === 0 && !productsQuery.isLoading ? (
        <EmptyState
          icon={Package}
          title="Empieza con tu primer producto"
          description="Registra lo que vendes para que el copiloto genere publicaciones, copy y estrategia alineados a tu negocio."
          action={{
            label: 'Crear producto',
            onClick: () => navigate('/products/new'),
          }}
        />
      ) : useCardLayout ? (
        <div className="space-y-[var(--spacing-md)]">
          {items.map((product) => (
            <ProductListCard key={product.id} product={product} sohoMode={sohoMode} />
          ))}
          {sohoMode && items.length === 1 ? (
            <Card variant="elevated" title="¿Vendes más de una cosa?" subtitle="Opcional">
              <p className="mb-[var(--spacing-md)] text-sm text-[var(--foreground-muted)]">
                Puedes agregar otro producto o servicio, o dejar que la IA analice tu web.
              </p>
              <div className="flex flex-wrap gap-[var(--spacing-sm)]">
                <Button variant="outline" onClick={() => navigate('/products/new')} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Otro producto
                </Button>
                <Link to="/products/create-with-ai">
                  <Button variant="ghost" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Crear con IA
                  </Button>
                </Link>
              </div>
            </Card>
          ) : null}
        </div>
      ) : (
        <Card variant="elevated" title="Catálogo activo" subtitle={`${items.length} producto(s)`}>
          <DataTable
            columns={columns}
            data={items}
            loading={productsQuery.isLoading}
            emptyMessage="No hay productos activos"
          />
        </Card>
      )}
    </DashboardShell>
  );
}
