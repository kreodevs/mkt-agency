import { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DatesSetArg, EventClickArg } from '@fullcalendar/core';
import type { DateClickArg } from '@fullcalendar/interaction';
import { calendarStatusColor } from '@/lib/calendar-status';
import type { CalendarMonthResponse } from '@/types/calendar';

import './calendar.css';

interface CalendarViewProps {
  data?: CalendarMonthResponse;
  loading?: boolean;
  month: number;
  year: number;
  onMonthChange: (month: number, year: number) => void;
  onSelectDate: (date: string) => void;
}

export function CalendarView({
  data,
  loading,
  month,
  year,
  onMonthChange,
  onSelectDate,
}: CalendarViewProps) {
  const initialDate = `${year}-${String(month).padStart(2, '0')}-01`;

  const events = useMemo(() => {
    if (!data?.days.length) return [];

    return data.days.map((day) => ({
      id: day.date,
      title: day.total === 1 ? '1 pieza' : `${day.total} piezas`,
      start: day.date,
      allDay: true,
      backgroundColor: calendarStatusColor(day.dominantStatus),
      borderColor: calendarStatusColor(day.dominantStatus),
      textColor: '#ffffff',
      extendedProps: { summary: day },
    }));
  }, [data?.days]);

  const handleDatesSet = (arg: DatesSetArg) => {
    const pivot = arg.view.calendar.getDate();
    onMonthChange(pivot.getMonth() + 1, pivot.getFullYear());
  };

  const handleEventClick = (arg: EventClickArg) => {
    const date = arg.event.startStr.slice(0, 10);
    onSelectDate(date);
  };

  return (
    <div className="calendar-shell relative">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-[var(--background)]/70 text-sm text-[var(--foreground-muted)]">
          Cargando calendario...
        </div>
      )}

      <FullCalendar
        key={`${initialDate}-${loading ? 'loading' : events.length}`}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        initialDate={initialDate}
        locale="es"
        height="auto"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: '',
        }}
        events={events}
        datesSet={handleDatesSet}
        eventClick={handleEventClick}
        dateClick={(info: DateClickArg) => onSelectDate(info.dateStr)}
        eventDisplay="block"
      />
    </div>
  );
}

export default CalendarView;
