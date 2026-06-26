import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

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
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export function TenantGuard() {
  const user = useAuthStore((s) => s.user);

  if (!user?.tenantId) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
