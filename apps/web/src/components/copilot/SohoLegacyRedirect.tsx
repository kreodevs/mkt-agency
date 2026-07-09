import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useOperatingProfile } from '@/hooks/useOperatingProfile';

interface SohoLegacyRedirectProps {
  children: ReactNode;
}

/** Redirige a bandeja si el tenant tiene perfil SOHO (server-side). */
export function SohoLegacyRedirect({ children }: SohoLegacyRedirectProps) {
  const { isSoho, isLoading } = useOperatingProfile();

  if (isLoading) {
    return null;
  }

  if (isSoho) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
