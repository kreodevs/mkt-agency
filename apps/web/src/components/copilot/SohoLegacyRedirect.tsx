import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdvancedNav } from '@/store/copilot-ui';

interface SohoLegacyRedirectProps {
  children: ReactNode;
}

/** En modo SOHO, redirige rutas de agencia completa a la bandeja. */
export function SohoLegacyRedirect({ children }: SohoLegacyRedirectProps) {
  const advancedNav = useAdvancedNav();
  if (!advancedNav) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
