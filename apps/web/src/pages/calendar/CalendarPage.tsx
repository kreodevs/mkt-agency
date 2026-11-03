import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Inbox, Layers, SlidersHorizontal } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { CalendarView } from '@/components/calendar/CalendarView';
import { DayDetail } from '@/components/calendar/DayDetail';
import { DownloadKit } from '@/components/content/DownloadKit';
import { SohoCalendarDayPanel } from '@/components/publication-inbox/SohoCalendarDayPanel';
import { SohoCalendarLegend } from '@/components/publication-inbox/SohoCalendarLegend';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Button } from '@/components/atoms/Button';
import { Select } from '@/components/atoms/Select';
import { useCalendarDay, useCalendarMonth } from '@/hooks/useCalendar';
import { useSohoCalendarMonth } from '@/hooks/useSohoCalendar';
import { useOperatingProfile } from '@/hooks/useOperatingProfile';
import { useResolvedProductId } from '@/hooks/useResolvedProductId';
import { listProducts } from '@/services/products';

function productFilterOptions(items: { id: string; name: string }[]) {
  return [
    { value: '', label: 'Todos los productos' },
    ...items.map((product) => ({ value: product.id, label: product.name })),
  ];
}

function currentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const initial = currentMonthYear();
  const [month, setMonth] = useState(initial.month);
  const [year, setYear] = useState(initial.year);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [productFilter, setProductFilter] = useState('');

  const { isSoho } = useOperatingProfile();
  const productId = useResolvedProductId();
  const [viewMode, setViewMode] = useState<'soho' | 'editorial'>(isSoho ? 'soho' : 'editorial');

  // Queries for Editorial view
  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: () => listProducts({ status: 'active', limit: 100 }),
    enabled: viewMode === 'editorial',
  });
  const editorialMonthQuery = useCalendarMonth(
    month,
    year,
    productFilter || undefined,
  );
  const dayQuery = useCalendarDay(
    selectedDate,
    productFilter || undefined,
  );

  // Query for SOHO view
  const sohoMonthQuery = useSohoCalendarMonth(month, year, productId);

  const activeMonthQuery = viewMode === 'soho' ? sohoMonthQuery : editorialMonthQuery;

  const monthLabel = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(
    new Date(year, month - 1, 1),
  );

  const isEmptyMonth =
    !activeMonthQuery.isLoading &&
    !activeMonthQuery.isError &&
    (activeMonthQuery.data?.days.length ?? 0) === 0;

  return (
    <DashboardShell>
      <PageHeader
        eyebrow="Calendario Canónico"
        title={viewMode === 'soho' ? 'Calendario de publicación' : 'Calendario editorial'}
        description={
          viewMode === 'soho'
            ? 'Consulta qué día toca publicar cada pieza. Toca un día para copiar y publicar.'
            : 'Planificación de piezas por día — filtra por catálogo y gestiona kits de descarga.'
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Selector de modo de vista */}
            <div className="flex items-center rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('soho')}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  viewMode === 'soho'
                    ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                }`}
                title="Vista semanal ágil: qué publicar hoy y copiar en un clic"
              >
                <Layers className="h-3.5 w-3.5" />
                Foco Copiloto
              </button>
              <button
                type="button"
                onClick={() => setViewMode('editorial')}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  viewMode === 'editorial'
                    ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                }`}
                title="Vista editorial completa con filtros de producto y kits"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Editorial Completo
              </button>
            </div>

            {viewMode === 'editorial' && (
              <Select
                fullWidth={false}
                className="min-w-[11rem]"
                aria-label="Filtrar por producto"
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                options={productFilterOptions(productsQuery.data?.items ?? [])}
              />
            )}

            <Link to="/">
              <Button type="button" variant="outline" size="sm" className="gap-1.5">
                <Inbox className="h-4 w-4" />
                Bandeja
              </Button>
            </Link>
          </div>
        }
      />

      {viewMode === 'soho' && <SohoCalendarLegend />}

      {activeMonthQuery.isError && (
        <EmptyState
          icon={CalendarDays}
          title="No pudimos cargar el calendario"
          description="Revisa tu conexión e inténtalo de nuevo."
          action={{ label: 'Volver a la bandeja', onClick: () => navigate('/') }}
          className="mb-[var(--spacing-lg)]"
        />
      )}

      {isEmptyMonth && (
        <EmptyState
          icon={CalendarDays}
          title={`Sin publicaciones en ${monthLabel}`}
          description={
            viewMode === 'soho'
              ? 'Cuando prepares la semana con el copiloto, verás aquí cada día con su contenido.'
              : 'Los borradores aparecen aquí al ser programados por el Community Manager.'
          }
          action={{ label: 'Ir a la bandeja', onClick: () => navigate('/') }}
          className="mb-[var(--spacing-lg)]"
        />
      )}

      {!activeMonthQuery.isError && !isEmptyMonth && (
        <div className="grid gap-[var(--spacing-lg)] lg:grid-cols-5">
          <Card
            variant="elevated"
            className="lg:col-span-3"
            title="Mes"
            subtitle="Haz clic en un día con publicaciones"
          >
            <CalendarView
              data={activeMonthQuery.data}
              loading={activeMonthQuery.isLoading}
              month={month}
              year={year}
              onMonthChange={(m, y) => {
                setMonth(m);
                setYear(y);
              }}
              onSelectDate={setSelectedDate}
            />
          </Card>

          <div className="lg:col-span-2">
            {viewMode === 'soho' ? (
              selectedDate ? (
                <SohoCalendarDayPanel
                  date={selectedDate}
                  productId={productId}
                  onClose={() => setSelectedDate(null)}
                />
              ) : (
                <Card variant="elevated" title="Día seleccionado" subtitle="Elige una fecha en el calendario">
                  <p className="text-sm text-[var(--foreground-muted)]">
                    Los días con color tienen publicaciones programadas. Verde significa que ya puedes
                    copiar y pegar en tu red social.
                  </p>
                </Card>
              )
            ) : selectedDate ? (
              <div className="space-y-6">
                <DayDetail
                  date={selectedDate}
                  items={dayQuery.data?.items ?? []}
                  loading={dayQuery.isLoading}
                  onClose={() => setSelectedDate(null)}
                />
                <DownloadKit date={selectedDate} />
              </div>
            ) : (
              <Card title="Detalle del día" subtitle="Selecciona un día en el calendario">
                <p className="text-sm text-[var(--foreground-muted)]">
                  Haz clic en un día con piezas para revisar, aprobar o rechazar. Los borradores también
                  se muestran aquí.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
