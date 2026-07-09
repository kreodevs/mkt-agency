import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import {
  getOperatingProfile,
  updateOperatingProfile,
} from '@/services/operating-profile';
import { useCopilotUiStore } from '@/store/copilot-ui';
import type { UpdateOperatingProfilePayload } from '@/types/operating-profile';

const QUERY_KEY = ['operating-profile'];

export function useOperatingProfile() {
  const setAdvancedNav = useCopilotUiStore((s) => s.setAdvancedNav);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: getOperatingProfile,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!query.data) return;
    setAdvancedNav(query.data.profile.profile === 'growth');
  }, [query.data, setAdvancedNav]);

  const mutation = useMutation({
    mutationFn: (payload: UpdateOperatingProfilePayload) => updateOperatingProfile(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data);
      setAdvancedNav(data.profile.profile === 'growth');
    },
  });

  return {
    ...query,
    updateProfile: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    isGrowth: query.data?.profile.profile === 'growth',
    isPaid: query.data?.subProfile === 'growth_paid',
    isSoho: query.data?.subProfile === 'soho',
  };
}
