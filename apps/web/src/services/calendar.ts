import { apiFetch } from '@/services/api';
import type { CalendarDayDetailResponse, CalendarMonthResponse } from '@/types/calendar';

export async function getCalendarMonth(
  month: number,
  year: number,
): Promise<CalendarMonthResponse> {
  return apiFetch<CalendarMonthResponse>(`/calendar?month=${month}&year=${year}`);
}

export async function getCalendarDay(date: string): Promise<CalendarDayDetailResponse> {
  return apiFetch<CalendarDayDetailResponse>(`/calendar/${date}`);
}
