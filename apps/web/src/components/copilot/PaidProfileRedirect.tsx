import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useOperatingProfile } from '@/hooks/useOperatingProfile';

interface PaidProfileRedirectProps {
  children: ReactNode;
}

/** Redirige si el tenant no tiene perfil Growth con pauta declarada. */
export function PaidProfileRedirect({ children }: PaidProfileRedirectProps) {
  const { isPaid, isSoho, isLoading } = useOperatingProfile();

  if (isLoading) {
    return null;
  }

  if (isSoho || !isPaid) {
    return <Navigate to="/agency/strategy" replace />;
  }

  return <>{children}</>;
}
