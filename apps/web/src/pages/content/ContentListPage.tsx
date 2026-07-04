import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/atoms/Button';
import { StatusPill } from '@/components/atoms/StatusPill';
import {
  ContentVisualActions,
  buildContentGenerationMap,
} from '@/components/content/ContentVisualPanel';
import { ContentPlatformBadge } from '@/components/content/ContentPlatformBadge';
import { DataTable, type DataTableColumn } from '@/components/organisms/DataTable';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { listContents } from '@/services/content';
import { listImageGenerations } from '@/services/agents';
import { listProducts } from '@/services/products';
import type { Content, ContentStatus, ContentType } from '@/types/content';

const STATUS_OPTIONS: Array<{ label: string; value: '' | ContentStatus }> = [
  { label: 'Todos los estados', value: '' },
  { label: 'Borrador', value: 'draft' },
  { label: 'En revisión', value: 'in_review' },
  { label: 'Cambios', value: 'in_changes' },
  { label: 'Aprobado', value: 'approved' },
  { label: 'Rechazado', value: 'rejected' },
];

const TYPE_OPTIONS: Array<{ label: string; value: '' | ContentType }> = [
  { label: 'Todos los tipos', value: '' },
  { label: 'Anuncio', value: 'ad' },
  { label: 'Social', value: 'social' },
  { label: 'Email', value: 'email' },
  { label: 'Blog', value: 'blog' },
  { label: 'Landing', value: 'landing' },
];

function statusVariant(status: ContentStatus) {
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'error';
  if (status === 'in_review') return 'info';
  if (status === 'in_changes') return 'warning';
  return 'neutral';
}

const filterSelectClass =
  'h-10 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';

export default function ContentListPage() {
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('campaignId') ?? '';
  const [statusFilter, setStatusFilter] = useState<'' | ContentStatus>('');
  const [typeFilter, setTypeFilter] = useState<'' | ContentType>('');
  const [productFilter, setProductFilter] = useState('');

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: () => listProducts({ status: 'active', limit: 100 }),
  });

  const productMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const product of productsQuery.data?.items ?? []) {
      map.set(product.id, product.name);
    }
    return map;
  }, [productsQuery.data?.items]);

  const contentsQuery = useQuery({
    queryKey: ['contents', { campaignId, status: statusFilter, type: typeFilter, productId: productFilter }],
    queryFn: () =>
      listContents({
        page: 1,
        limit: 100,
        campaignId: campaignId || undefined,
        productId: productFilter || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      }),
  });

  const generationsQuery = useQuery({
    queryKey: ['image-generations'],
    queryFn: listImageGenerations,
  });

  const generationByContentId = useMemo(
    () => buildContentGenerationMap(generationsQuery.data ?? []),
    [generationsQuery.data],
  );

  const tableData = useMemo(() => contentsQuery.data?.items ?? [], [contentsQuery.data?.items]);

  const columns: DataTableColumn[] = useMemo(
    () => [
      {
        field: 'title',
        header: 'Título',
        sortable: true,
        filterable: true,
        body: (row: Content) => (
          <Link
            to={`/contents/${row.id}`}
            className="font-medium text-[var(--primary)] hover:underline"
          >
            {row.title}
          </Link>
        ),
      },
      {
        field: 'type',
        header: 'Tipo',
        sortable: true,
        width: '100px',
      },
      {
        field: 'platform',
        header: 'Red social',
        width: '140px',
        body: (row: Content) => <ContentPlatformBadge platform={row.platform} size="sm" showUnset />,
      },
      {
        field: 'productId',
        header: 'Producto',
        body: (row: Content) =>
          row.productId ? productMap.get(row.productId) ?? '—' : 'Marca',
      },
      {
        field: 'status',
        header: 'Estado',
        sortable: true,
        width: '130px',
        body: (row: Content) => (
          <StatusPill status={statusVariant(row.status)} size="sm">
            {row.status}
          </StatusPill>
        ),
      },
      {
        field: 'currentVersion',
        header: 'Versión',
        width: '90px',
        body: (row: Content) => row.currentVersion?.versionNumber ?? '—',
      },
      {
        field: 'visual',
        header: 'Imagen',
        width: '120px',
        body: (row: Content) => (
          <ContentVisualActions
            contentId={row.id}
            generation={generationByContentId.get(row.id) ?? null}
            versionAssets={row.currentVersion?.assets}
          />
        ),
      },
    ],
    [productMap, generationByContentId],
  );

  const newHref = campaignId ? `/contents/new?campaignId=${campaignId}` : '/contents/new';

  return (
    <DashboardShell>
      <PageHeader
        title="Contenidos"
        description={
          campaignId
            ? 'Piezas de contenido asociadas a la campaña'
            : 'Gestión de contenido con versionado inmutable'
        }
        actions={
          <Link to={newHref}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo contenido
            </Button>
          </Link>
        }
      />

      <Card>
        <div className="mb-4 flex flex-wrap gap-3">
          <select
            className={filterSelectClass}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as '' | ContentStatus)}
            aria-label="Filtrar por estado"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className={filterSelectClass}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as '' | ContentType)}
            aria-label="Filtrar por tipo"
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className={filterSelectClass}
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            aria-label="Filtrar por producto"
          >
            <option value="">Todos los productos</option>
            {(productsQuery.data?.items ?? []).map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>

        <DataTable
          columns={columns}
          data={tableData}
          loading={contentsQuery.isLoading}
          emptyMessage={
            contentsQuery.isError
              ? 'No se pudo cargar el listado'
              : 'No hay contenidos que coincidan con los filtros'
          }
          rows={10}
        />
      </Card>
    </DashboardShell>
  );
}
