import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthGuard, GuestGuard, SuperadminGuard, TenantGuard } from '@/guards/AuthGuard';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const SetupPage = lazy(() => import('@/pages/setup/SetupPage'));
const DashboardHomePage = lazy(() => import('@/pages/DashboardHomePage'));
const TenantListPage = lazy(() => import('@/pages/tenants/TenantListPage'));
const OnboardingWizardPage = lazy(() => import('@/pages/onboarding/OnboardingWizardPage'));

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center text-[var(--foreground-muted)]">
      Cargando...
    </div>
  );
}

export function AppRouter() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<GuestGuard />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/setup" element={<SetupPage />} />
        </Route>

        <Route element={<AuthGuard />}>
          <Route path="/" element={<DashboardHomePage />} />
          <Route element={<SuperadminGuard />}>
            <Route path="/tenants" element={<TenantListPage />} />
          </Route>
          <Route element={<TenantGuard />}>
            <Route path="/onboarding" element={<OnboardingWizardPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
