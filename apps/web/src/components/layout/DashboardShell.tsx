import { Layers } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { AppLayout } from '@/components/organisms/AppLayout';
import { ImpersonationContextBar } from '@/components/layout/ImpersonationContextBar';
import { ImpersonationSwitcher } from '@/components/admin/ImpersonationSwitcher';
import { TenantImpersonationSelect } from '@/components/admin/TenantImpersonationSelect';
import { ActiveProductSelector } from '@/components/products/ActiveProductSelector';
import { Button } from '@/components/atoms/Button';
import { logout } from '@/services/auth';
import { getPublicationInbox } from '@/services/publication-inbox';
import { useAuthStore } from '@/store/auth';
import { useActiveProductStore } from '@/store/active-product';
import { isImpersonating } from '@/lib/impersonation';
import {
  superadminNavigation,
  tenantAdvancedNavigation,
  tenantSohoNavigation,
} from '@/lib/tenant-navigation';
import { useOperatingProfile } from '@/hooks/useOperatingProfile';

export {
  superadminNavigation,
  tenantAdvancedNavigation as tenantNavigation,
  tenantSohoNavigation,
} from '@/lib/tenant-navigation';

interface DashboardShellProps {
  children: ReactNode;
  navigationOverride?: typeof superadminNavigation;
}

export function DashboardShell({ children, navigationOverride }: DashboardShellProps) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const location = useLocation();
  const activeProductId = useActiveProductStore((s) => s.productId);
  const { isGrowth, isPaid, updateProfile } = useOperatingProfile();
  const advancedNav = isGrowth;

  const inboxBadgeQuery = useQuery({
    queryKey: ['publication-inbox', activeProductId],
    queryFn: () => getPublicationInbox(activeProductId ?? undefined),
    enabled: Boolean(user?.tenantId && !user.isSuperadmin),
    staleTime: 30_000,
  });
  const unreadNotifications = inboxBadgeQuery.data?.stats.unreadNotifications ?? 0;

  const filterPaidNav = (groups: typeof tenantAdvancedNavigation) =>
    groups.map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => item.href !== '/agency/media-intents' || isPaid,
      ),
    }));

  const handleNavModeToggle = async () => {
    await updateProfile({ profile: isGrowth ? 'soho' : 'growth' });
  };

  const forceSohoNav = Boolean(user?.impersonating);
  const useAdvancedNav = advancedNav && !forceSohoNav;

  const navigationGroups =
    navigationOverride ??
    (user?.impersonating && user.tenantId
      ? useAdvancedNav
        ? filterPaidNav(tenantAdvancedNavigation)
        : tenantSohoNavigation
      : user?.isSuperadmin
        ? superadminNavigation
        : user?.tenantId
          ? useAdvancedNav
            ? filterPaidNav(tenantAdvancedNavigation)
            : tenantSohoNavigation
          : []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const headerActions = isImpersonating() ? (
    <div className="flex items-center gap-3">
      <ActiveProductSelector />
      <ImpersonationSwitcher />
    </div>
  ) : user?.isSuperadmin ? (
    <TenantImpersonationSelect />
  ) : user?.tenantId ? (
    <ActiveProductSelector />
  ) : null;

  const showNavModeToggle = Boolean(
    user?.tenantId && !user.isSuperadmin && !navigationOverride && !user.impersonating,
  );

  const scrollToNotifications = () => {
    document.getElementById('inbox-notifications')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNotificationsClick = () => {
    if (location.pathname === '/') {
      scrollToNotifications();
      return;
    }
    void navigate('/#inbox-notifications');
  };

  return (
    <AppLayout
      navigationGroups={navigationGroups}
      activeHref={location.pathname}
      linkComponent={Link}
      user={user ? { name: user.name, email: user.email } : undefined}
      headerActions={headerActions}
      banner={isImpersonating() ? <ImpersonationContextBar /> : undefined}
      onLogout={handleLogout}
      notificationCount={user?.tenantId && !user.isSuperadmin ? unreadNotifications : 0}
      onNotificationsClick={
        user?.tenantId && !user.isSuperadmin ? handleNotificationsClick : undefined
      }
      sidebarFooter={
        showNavModeToggle ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs text-[var(--foreground-muted)]"
            onClick={() => void handleNavModeToggle()}
          >
            <Layers className="mr-2 h-3.5 w-3.5" />
            {advancedNav ? 'Vista simple (copiloto)' : 'Ver todas las herramientas'}
          </Button>
        ) : undefined
      }
    >
      {children}
    </AppLayout>
  );
}
