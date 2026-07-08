import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCalendarMonth } from '@/hooks/useCalendar';
import { mergeSohoCalendarMonth } from '@/lib/soho-calendar.util';
import { getPublicationInbox } from '@/services/publication-inbox';

export function useSohoCalendarMonth(month: number, year: number, productId?: string) {
  const monthQuery = useCalendarMonth(month, year, productId);

  const inboxQuery = useQuery({
    queryKey: ['publication-inbox', productId ?? null],
    queryFn: () => getPublicationInbox(productId),
  });

  const data = useMemo(
    () => mergeSohoCalendarMonth(monthQuery.data, inboxQuery.data, month, year),
    [monthQuery.data, inboxQuery.data, month, year],
  );

  return {
    data,
    isLoading: monthQuery.isLoading || inboxQuery.isLoading,
    isError: monthQuery.isError || inboxQuery.isError,
    error: monthQuery.error ?? inboxQuery.error,
  };
}
