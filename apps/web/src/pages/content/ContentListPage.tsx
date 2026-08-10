import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/atoms/Button';
import { Select } from '@/components/atoms/Select';
import { StatusPill } from '@/components/atoms/StatusPill';
import {
  ContentVisualActions,
  buildContentGenerationMap,
} from '@/components/content/ContentVisualPanel';
import { ContentPlatformBadge } from '@/components/content/ContentPlatformBadge';
import { ContentListCard } from '@/components/content/ContentListCard';
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


function productFilterOptions(items: { id: string; name: string }[]) {
  return [
    { value: '', label: 'Todos los productos' },
    ...items.map((product) => ({ value: product.id, label: product.name })),
  ];
}

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
        eyebrow="Editorial"
        title="Contenidos"
        description={
          campaignId
            ? 'Piezas de contenido asociadas a la campaña'
            : 'Gestión de contenido con versionado inmutable'
        }
        actions={
          <Link to={newHref}>
            <Button variant="brand">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo contenido
            </Button>
          </Link>
        }
      />

      <Card variant="elevated">
        <div className="filter-row mb-4">
          <Select
            fullWidth={false}
            className="min-w-[11rem]"
            aria-label="Filtrar por estado"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as '' | ContentStatus)}
            options={STATUS_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />
          <Select
            fullWidth={false}
            className="min-w-[11rem]"
            aria-label="Filtrar por tipo"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as '' | ContentType)}
            options={TYPE_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />
          <Select
            fullWidth={false}
            className="min-w-[11rem]"
            aria-label="Filtrar por producto"
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            options={productFilterOptions(productsQuery.data?.items ?? [])}
          />
        </div>

        <div className="space-y-[var(--spacing-md)] md:hidden">
          {contentsQuery.isLoading ? (
            <p className="text-sm text-[var(--foreground-muted)]">Cargando contenidos…</p>
          ) : tableData.length === 0 ? (
            <p className="text-sm text-[var(--foreground-muted)]">
              {contentsQuery.isError
                ? 'No se pudo cargar el listado'
                : 'No hay contenidos que coincidan con los filtros'}
            </p>
          ) : (
            tableData.map((content) => (
              <ContentListCard
                key={content.id}
                content={content}
                productLabel={
                  content.productId ? (productMap.get(content.productId) ?? '—') : 'Marca'
                }
              />
            ))
          )}
        </div>

        <div className="hidden md:block">
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
        </div>
      </Card>
    </DashboardShell>
  );
}
