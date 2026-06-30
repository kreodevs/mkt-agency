import { apiFetch } from '@/services/api';
import type { CalendarDayDetailResponse, CalendarMonthResponse } from '@/types/calendar';

export async function getCalendarMonth(
  month: number,
  year: number,
  productId?: string,
): Promise<CalendarMonthResponse> {
  const params = new URLSearchParams({ month: String(month), year: String(year) });
  if (productId) params.set('productId', productId);
  return apiFetch<CalendarMonthResponse>(`/calendar?${params.toString()}`);
}

export async function getCalendarDay(
  date: string,
  productId?: string,
): Promise<CalendarDayDetailResponse> {
  const suffix = productId ? `?productId=${encodeURIComponent(productId)}` : '';
  return apiFetch<CalendarDayDetailResponse>(`/calendar/${date}${suffix}`);
}
