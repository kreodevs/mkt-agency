import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

/**
 * AuthGuard: renders children only if a user session exists.
 * On impersonation token expiry, refreshAccessToken in api.ts
 * silently restores the superadmin session. No fetch/check here
 * to avoid redirect loops.
 */
export function AuthGuard() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export function SuperadminGuard() {
  const user = useAuthStore((s) => s.user);

  if (!user?.isSuperadmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export function GuestGuard() {
  const user = useAuthStore((s) => s.user);

  if (user) {
    return <Navigate to={user.isSuperadmin ? '/tenants' : '/'} replace />;
  }

  return <Outlet />;
}

export function TenantGuard() {
  const user = useAuthStore((s) => s.user);

  if (!user?.tenantId) {
    return <Navigate to="/" replace />;
  }

  // Campañas y resto de operativa tenant solo vía impersonación
  if (user.isSuperadmin && !user.impersonating) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}