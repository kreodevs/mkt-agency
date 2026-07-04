import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Images, Megaphone, Package, Plus, Sparkles, Star } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/atoms/Button';
import { StatusPill } from '@/components/atoms/StatusPill';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { DataTable, type DataTableColumn } from '@/components/organisms/DataTable';
import { listProducts } from '@/services/products';
import type { Product } from '@/types/product';

export default function ProductListPage() {
  const navigate = useNavigate();

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: () => listProducts({ status: 'active', limit: 100 }),
  });

  const items = productsQuery.data?.items ?? [];

  const columns: DataTableColumn[] = [
    {
      field: 'name',
      header: 'Producto / servicio',
      sortable: true,
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
      body: (row) => {
        const value = (row as Product).targetAudience;
        return value ? (
          <span className="line-clamp-2 text-sm text-[var(--foreground-muted)]">{value}</span>
        ) : (
          '—'
        );
      },
    },
    {
      field: 'category',
      header: 'Tipo',
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
            <Link to={`/products/${product.id}/media-kit`}>
              <Button variant="outline" size="sm" className="gap-1">
                <Images className="h-3.5 w-3.5" />
                Kit
              </Button>
            </Link>
            <Link to={`/products/${product.id}`}>
              <Button variant="outline" size="sm">
                Editar
              </Button>
            </Link>
            <Link to={`/campaigns/new?productId=${product.id}`}>
              <Button size="sm" className="gap-1">
                <Megaphone className="h-3.5 w-3.5" />
                Campaña
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
        title="Mis productos"
        description="Centro de tu catálogo: las campañas se crean sobre lo que vendes."
        actions={
          <Button className="gap-2" onClick={() => navigate('/products/new')}>
            <Plus className="h-4 w-4" />
            Nuevo producto
          </Button>
        }
      />

      {items.length === 0 && !productsQuery.isLoading ? (
        <Card title="Empieza con tu primer producto" subtitle="Un SOHO promociona lo que vende">
          <p className="mb-4 text-sm text-[var(--foreground-muted)]">
            Registra tu producto o servicio principal de forma manual o deja que la IA analice tu
            página web y complete el perfil automáticamente. Luego podrás lanzar campañas, generar
            copy y medir resultados por oferta comercial.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate('/products/new')} className="gap-2">
              <Package className="h-4 w-4" />
              Creación manual
            </Button>
            <Link to="/products/create-with-ai">
              <Button variant="outline" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Crear con IA
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card title="Catálogo activo" subtitle={`${items.length} producto(s)`}>
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
