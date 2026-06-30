import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { CalendarView } from '@/components/calendar/CalendarView';
import { DayDetail } from '@/components/calendar/DayDetail';
import { DownloadKit } from '@/components/content/DownloadKit';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { useCalendarDay, useCalendarMonth } from '@/hooks/useCalendar';
import { listProducts } from '@/services/products';

const filterSelectClass =
  'h-10 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';

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
        title="Calendario editorial"
        description="Piezas por día — filtra por producto para ver solo ese catálogo"
        actions={
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
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CalendarView
            data={monthQuery.data}
            loading={monthQuery.isLoading}
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
                Haz clic en un día con piezas para revisar, aprobar o rechazar contenido.
              </p>
            </Card>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
