import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthGuard, GuestGuard, SuperadminGuard, TenantGuard } from '@/guards/AuthGuard';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const SetupPage = lazy(() => import('@/pages/setup/SetupPage'));
const DashboardHomePage = lazy(() => import('@/pages/DashboardHomePage'));
const TenantListPage = lazy(() => import('@/pages/tenants/TenantListPage'));
const AuditLogsPage = lazy(() => import('@/pages/admin/AuditLogsPage'));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'));
const PackageListPage = lazy(() => import('@/pages/admin/PackageListPage'));
const LlmProvidersPage = lazy(() => import('@/pages/admin/LlmProvidersPage'));
const LlmSettingsPage = lazy(() => import('@/pages/admin/LlmSettingsPage'));
const SecurityEventsPage = lazy(() => import('@/pages/admin/SecurityEventsPage'));
const CampaignListPage = lazy(() => import('@/pages/campaigns/CampaignListPage'));
const CampaignCreatePage = lazy(() => import('@/pages/campaigns/CampaignCreatePage'));
const CampaignDetailPage = lazy(() => import('@/pages/campaigns/CampaignDetailPage'));
const ContentListPage = lazy(() => import('@/pages/content/ContentListPage'));
const ContentCreatePage = lazy(() => import('@/pages/content/ContentCreatePage'));
const ContentEditPage = lazy(() => import('@/pages/content/ContentEditPage'));
const CalendarPage = lazy(() => import('@/pages/calendar/CalendarPage'));
const AssetLibraryPage = lazy(() => import('@/pages/assets/AssetLibraryPage'));
const LeadPipelinePage = lazy(() => import('@/pages/crm/LeadPipelinePage'));
const FormListPage = lazy(() => import('@/pages/forms/FormListPage'));
const ProposalListPage = lazy(() => import('@/pages/proposals/ProposalListPage'));
const ProposalDetailPage = lazy(() => import('@/pages/proposals/ProposalDetailPage'));
const DomainSettingsPage = lazy(() => import('@/pages/settings/DomainSettingsPage'));
const CompetitorsPage = lazy(() => import('@/pages/settings/CompetitorsPage'));
const ReportListPage = lazy(() => import('@/pages/reports/ReportListPage'));
const ReportDetailPage = lazy(() => import('@/pages/reports/ReportDetailPage'));
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
            <Route path="/admin/packages" element={<PackageListPage />} />
            <Route path="/admin/llm-providers" element={<LlmProvidersPage />} />
            <Route path="/admin/llm-settings" element={<LlmSettingsPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
            <Route path="/admin/security-events" element={<SecurityEventsPage />} />
          </Route>
          <Route element={<TenantGuard />}>
            <Route path="/onboarding" element={<OnboardingWizardPage />} />
            <Route path="/campaigns" element={<CampaignListPage />} />
            <Route path="/campaigns/new" element={<CampaignCreatePage />} />
            <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
            <Route path="/contents" element={<ContentListPage />} />
            <Route path="/contents/new" element={<ContentCreatePage />} />
            <Route path="/contents/:id" element={<ContentEditPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/forms" element={<FormListPage />} />
            <Route path="/leads" element={<LeadPipelinePage />} />
            <Route path="/assets" element={<AssetLibraryPage />} />
            <Route path="/proposals" element={<ProposalListPage />} />
            <Route path="/proposals/:id" element={<ProposalDetailPage />} />
            <Route path="/reports" element={<ReportListPage />} />
            <Route path="/reports/:id" element={<ReportDetailPage />} />
            <Route path="/settings/domain" element={<DomainSettingsPage />} />
            <Route path="/settings/competitors" element={<CompetitorsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
