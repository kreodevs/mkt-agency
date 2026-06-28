import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getAccessToken, useAuthStore } from '@/store/auth';

const API_BASE = '/api/v1';

export function AuthGuard() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    if (!user) {
      setChecking(false);
      setValid(false);
      return;
    }

    const store = useAuthStore.getState();

    // Normal session — no check needed
    if (!store.impersonation) {
      setValid(true);
      setChecking(false);
      return;
    }

    // Impersonated session — validate the token is still alive
    const token = getAccessToken();
    if (!token) {
      setChecking(false);
      setValid(false);
      return;
    }

    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.ok) {
          setValid(true);
        } else {
          // Token expired — refreshAccessToken in api.ts will restore
          // the superadmin session. Force a re-read of the store state.
          // The api.ts refresh handler calls endImpersonation which
          // updates the zustand store, triggering re-render.
          import('./session-refresh').then((m) => m.tryRestoreSuperadmin());
        }
        setChecking(false);
      })
      .catch(() => {
        setChecking(false);
        setValid(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
          <p className="text-sm text-[var(--foreground-muted)]">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!user || !valid) {
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