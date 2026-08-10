import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { CalendarView } from '@/components/calendar/CalendarView';
import { DayDetail } from '@/components/calendar/DayDetail';
import { DownloadKit } from '@/components/content/DownloadKit';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { Select } from '@/components/atoms/Select';
import { useCalendarDay, useCalendarMonth } from '@/hooks/useCalendar';
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
  const initial = currentMonthYear();
  const [month, setMonth] = useState(initial.month);
  const [year, setYear] = useState(initial.year);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [productFilter, setProductFilter] = useState('');

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: () => listProducts({ status: 'active', limit: 100 }),
  });

  const monthQuery = useCalendarMonth(month, year, productFilter || undefined);
  const dayQuery = useCalendarDay(selectedDate, productFilter || undefined);

  return (
    <DashboardShell>
      <PageHeader
        eyebrow="Editorial"
        title="Calendario editorial"
        description="Piezas por día — filtra por producto para ver solo ese catálogo"
        actions={
          <Select
            fullWidth={false}
            className="min-w-[12rem]"
            aria-label="Filtrar por producto"
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            options={productFilterOptions(productsQuery.data?.items ?? [])}
          />
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {!monthQuery.isLoading && (monthQuery.data?.days.length ?? 0) === 0 && (
          <Card variant="elevated" className="border-dashed lg:col-span-5">
            <p className="text-sm text-[var(--foreground)]">
              No hay piezas en{' '}
              {new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(
                new Date(year, month - 1, 1),
              )}
              .
            </p>
            <p className="mt-2 text-sm text-[var(--foreground-muted)]">
              Los borradores aparecen en el calendario sin necesidad de aprobación. Cada pieza se
              ubica en su fecha programada (o en la fecha de creación si no tiene). Community Manager
              programa desde el día siguiente: usa «today» o revisa el mes anterior o posterior.
            </p>
            <Link to="/contents" className="mt-3 inline-block text-sm font-medium text-[var(--primary)] hover:underline">
              Ver listado de contenidos →
            </Link>
          </Card>
        )}

        <Card variant="elevated" className="lg:col-span-3">
          <CalendarView
            data={monthQuery.data}
            loading={monthQuery.isLoading}
            month={month}
            year={year}
            onMonthChange={(m, y) => {
              setMonth(m);
              setYear(y);
            }}
            onSelectDate={setSelectedDate}
          />
        </Card>

        <div className="space-y-6 lg:col-span-2">
          {selectedDate ? (
            <>
              <DayDetail
                date={selectedDate}
                items={dayQuery.data?.items ?? []}
                loading={dayQuery.isLoading}
                onClose={() => setSelectedDate(null)}
              />
              <DownloadKit date={selectedDate} />
            </>
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
    </DashboardShell>
  );
}
