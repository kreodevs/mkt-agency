import { useQuery } from '@tanstack/react-query';
import { getCalendarDay, getCalendarMonth } from '@/services/calendar';

export function useCalendarMonth(month: number, year: number) {
  return useQuery({
    queryKey: ['calendar', month, year],
    queryFn: () => getCalendarMonth(month, year),
  });
}

export function useCalendarDay(date: string | null) {
  return useQuery({
    queryKey: ['calendar-day', date],
    queryFn: () => getCalendarDay(date!),
    enabled: !!date,
  });
}
