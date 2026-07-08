import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { SohoLegacyRedirect } from '@/components/copilot/SohoLegacyRedirect';
import { AuthGuard, GuestGuard, SuperadminGuard, TenantGuard } from '@/guards/AuthGuard';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const SetupPage = lazy(() => import('@/pages/setup/SetupPage'));
const TenantListPage = lazy(() => import('@/pages/tenants/TenantListPage'));
const AuditLogsPage = lazy(() => import('@/pages/admin/AuditLogsPage'));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'));
const PackageListPage = lazy(() => import('@/pages/admin/PackageListPage'));
const LlmProvidersPage = lazy(() => import('@/pages/admin/LlmProvidersPage'));
const LlmSettingsPage = lazy(() => import('@/pages/admin/LlmSettingsPage'));
const LlmUsageDashboardPage = lazy(() => import('@/pages/admin/LlmUsageDashboardPage'));
const IntegrationsPage = lazy(() => import('@/pages/admin/IntegrationsPage'));
const SecurityEventsPage = lazy(() => import('@/pages/admin/SecurityEventsPage'));
const ProductListPage = lazy(() => import('@/pages/products/ProductListPage'));
const ProductCreatePage = lazy(() => import('@/pages/products/ProductCreatePage'));
const ProductOnboardingWizardPage = lazy(
  () => import('@/pages/products/ProductOnboardingWizardPage'),
);
const ProductDetailPage = lazy(() => import('@/pages/products/ProductDetailPage'));
const ProductMediaKitPage = lazy(() => import('@/pages/products/ProductMediaKitPage'));
const ProductCreateWithAiPage = lazy(() => import('@/pages/products/ProductCreateWithAiPage'));
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
const AgentListPage = lazy(() => import('@/pages/agents/AgentListPage'));
const MetricsDashboardPage = lazy(() => import('@/pages/dashboard/MetricsDashboardPage'));
const AgencyHomePage = lazy(() => import('@/pages/home/AgencyHomePage'));
const PublicationInboxPage = lazy(
  () => import('@/pages/publication-inbox/PublicationInboxPage'),
);
const PublicationCalendarPage = lazy(
  () => import('@/pages/publication-inbox/PublicationCalendarPage'),
);
const BrandInterviewPage = lazy(() => import('@/pages/agents/BrandInterviewPage'));
const CompetitorIntelPage = lazy(() => import('@/pages/agents/CompetitorIntelPage'));
const ImageGeneratorPage = lazy(() => import('@/pages/agents/ImageGeneratorPage'));
const ImageGeneratorDetailPage = lazy(
  () => import('@/pages/agents/ImageGeneratorDetailPage'),
);
const StrategyAdjustmentPage = lazy(() => import('@/pages/strategy/StrategyAdjustmentPage'));
const CommunityManagerPage = lazy(() => import('@/pages/community/CommunityManagerPage'));
const CopilotSettingsPage = lazy(() => import('@/pages/settings/CopilotSettingsPage'));
const PublicCapturePage = lazy(() => import('@/pages/capture/PublicCapturePage'));

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
        <Route path="/c/:formId" element={<PublicCapturePage />} />

        <Route element={<GuestGuard />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/setup" element={<SetupPage />} />
        </Route>

        <Route element={<AuthGuard />}>
          <Route path="/" element={<PublicationInboxPage />} />
          <Route path="/calendario" element={<PublicationCalendarPage />} />
          <Route path="/agency-overview" element={<AgencyHomePage />} />
          <Route element={<SuperadminGuard />}>
            <Route path="/tenants" element={<TenantListPage />} />
            <Route path="/admin/packages" element={<PackageListPage />} />
            <Route path="/admin/llm-providers" element={<LlmProvidersPage />} />
            <Route path="/admin/llm-settings" element={<LlmSettingsPage />} />
            <Route path="/admin/llm-usage" element={<LlmUsageDashboardPage />} />
            <Route path="/admin/integrations" element={<IntegrationsPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
            <Route path="/admin/security-events" element={<SecurityEventsPage />} />
          </Route>
          <Route element={<TenantGuard />}>
            <Route
              path="/dashboard"
              element={
                <SohoLegacyRedirect>
                  <MetricsDashboardPage />
                </SohoLegacyRedirect>
              }
            />
            <Route
              path="/agents"
              element={
                <SohoLegacyRedirect>
                  <AgentListPage />
                </SohoLegacyRedirect>
              }
            />
            <Route path="/agents/brand-interview" element={<BrandInterviewPage />} />
            <Route path="/agents/brand-interview/:id" element={<BrandInterviewPage />} />
            <Route path="/agents/competitor-intel" element={<CompetitorIntelPage />} />
            <Route path="/agents/image-generator" element={<ImageGeneratorPage />} />
            <Route path="/agents/image-generator/:id" element={<ImageGeneratorDetailPage />} />
            <Route
              path="/strategy"
              element={
                <SohoLegacyRedirect>
                  <StrategyAdjustmentPage />
                </SohoLegacyRedirect>
              }
            />
            <Route
              path="/community"
              element={
                <SohoLegacyRedirect>
                  <CommunityManagerPage />
                </SohoLegacyRedirect>
              }
            />
            <Route path="/onboarding" element={<OnboardingWizardPage />} />
            <Route path="/products" element={<ProductListPage />} />
            <Route path="/products/new" element={<ProductCreatePage />} />
            <Route path="/products/create-with-ai" element={<ProductCreateWithAiPage />} />
            <Route path="/products/:id/onboarding" element={<ProductOnboardingWizardPage />} />
            <Route path="/products/:id/media-kit" element={<ProductMediaKitPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/campaigns" element={<CampaignListPage />} />
            <Route path="/campaigns/new" element={<CampaignCreatePage />} />
            <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
            <Route
              path="/contents"
              element={
                <SohoLegacyRedirect>
                  <ContentListPage />
                </SohoLegacyRedirect>
              }
            />
            <Route
              path="/contents/new"
              element={
                <SohoLegacyRedirect>
                  <ContentCreatePage />
                </SohoLegacyRedirect>
              }
            />
            <Route path="/contents/:id" element={<ContentEditPage />} />
            <Route
              path="/calendar"
              element={
                <SohoLegacyRedirect>
                  <CalendarPage />
                </SohoLegacyRedirect>
              }
            />
            <Route path="/forms" element={<FormListPage />} />
            <Route path="/leads" element={<LeadPipelinePage />} />
            <Route path="/libreria" element={<AssetLibraryPage />} />
            <Route path="/assets" element={<Navigate to="/libreria" replace />} />
            <Route path="/proposals" element={<ProposalListPage />} />
            <Route path="/proposals/:id" element={<ProposalDetailPage />} />
            <Route path="/reports" element={<ReportListPage />} />
            <Route path="/reports/:id" element={<ReportDetailPage />} />
            <Route path="/settings/domain" element={<DomainSettingsPage />} />
            <Route path="/settings/copilot" element={<CopilotSettingsPage />} />
            <Route
              path="/settings/competitors"
              element={
                <SohoLegacyRedirect>
                  <CompetitorsPage />
                </SohoLegacyRedirect>
              }
            />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
