import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, Inbox } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { CalendarView } from '@/components/calendar/CalendarView';
import { SohoCalendarDayPanel } from '@/components/publication-inbox/SohoCalendarDayPanel';
import { SohoCalendarLegend } from '@/components/publication-inbox/SohoCalendarLegend';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Button } from '@/components/atoms/Button';
import { useSohoCalendarMonth } from '@/hooks/useSohoCalendar';
import { useResolvedProductId } from '@/hooks/useResolvedProductId';

function currentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export default function PublicationCalendarPage() {
  const navigate = useNavigate();
  const initial = currentMonthYear();
  const [month, setMonth] = useState(initial.month);
  const [year, setYear] = useState(initial.year);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const productId = useResolvedProductId();

  const monthQuery = useSohoCalendarMonth(month, year, productId);
  const monthLabel = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(
    new Date(year, month - 1, 1),
  );
  const isEmptyMonth =
    !monthQuery.isLoading &&
    !monthQuery.isError &&
    (monthQuery.data?.days.length ?? 0) === 0;

  return (
    <DashboardShell>
      <PageHeader
        title="Calendario de publicación"
        description="Consulta qué día toca publicar cada pieza. Toca un día para copiar y publicar."
        actions={
          <Link to="/">
            <Button type="button" variant="outline" size="sm" className="gap-1.5">
              <Inbox className="h-4 w-4" />
              Volver a inicio
            </Button>
          </Link>
        }
      />

      <SohoCalendarLegend />

      {monthQuery.isError && (
        <EmptyState
          icon={CalendarDays}
          title="No pudimos cargar el calendario"
          description="Revisa tu conexión e inténtalo de nuevo."
          action={{ label: 'Volver al inicio', onClick: () => navigate('/') }}
          className="mb-[var(--spacing-lg)]"
        />
      )}

      {isEmptyMonth && (
        <EmptyState
          icon={CalendarDays}
          title={`Sin publicaciones en ${monthLabel}`}
          description="Cuando prepares la semana con el copiloto, verás aquí cada día con su contenido."
          action={{ label: 'Ir al inicio', onClick: () => navigate('/') }}
          className="mb-[var(--spacing-lg)]"
        />
      )}

      {!monthQuery.isError && !isEmptyMonth && (
        <div className="grid gap-[var(--spacing-lg)] lg:grid-cols-5">
          <Card
            className="lg:col-span-3"
            title="Mes"
            subtitle="Haz clic en un día con publicaciones"
          >
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

          <div className="lg:col-span-2">
            {selectedDate ? (
              <SohoCalendarDayPanel
                date={selectedDate}
                productId={productId}
                onClose={() => setSelectedDate(null)}
              />
            ) : (
              <Card title="Día seleccionado" subtitle="Elige una fecha en el calendario">
                <p className="text-sm text-[var(--foreground-muted)]">
                  Los días con color tienen publicaciones programadas. Verde significa que ya puedes
                  copiar y pegar en tu red social.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
