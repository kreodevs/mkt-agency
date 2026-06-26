import { useState } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { CalendarView } from '@/components/calendar/CalendarView';
import { DayDetail } from '@/components/calendar/DayDetail';
import { DownloadKit } from '@/components/content/DownloadKit';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { useCalendarDay, useCalendarMonth } from '@/hooks/useCalendar';

function currentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export default function CalendarPage() {
  const initial = currentMonthYear();
  const [month, setMonth] = useState(initial.month);
  const [year, setYear] = useState(initial.year);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthQuery = useCalendarMonth(month, year);
  const dayQuery = useCalendarDay(selectedDate);

  return (
    <DashboardShell>
      <PageHeader
        title="Calendario editorial"
        description="Piezas por día — verde aprobado, amarillo borrador, rojo rechazado o en cambios"
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
