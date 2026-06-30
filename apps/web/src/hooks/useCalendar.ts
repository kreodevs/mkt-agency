import { useQuery } from '@tanstack/react-query';
import { getCalendarDay, getCalendarMonth } from '@/services/calendar';

export function useCalendarMonth(month: number, year: number, productId?: string) {
  return useQuery({
    queryKey: ['calendar', month, year, productId ?? ''],
    queryFn: () => getCalendarMonth(month, year, productId),
  });
}

export function useCalendarDay(date: string | null, productId?: string) {
  return useQuery({
    queryKey: ['calendar-day', date, productId ?? ''],
    queryFn: () => getCalendarDay(date!, productId),
    enabled: !!date,
  });
}
