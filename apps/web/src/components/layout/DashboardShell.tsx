import { Building2, ClipboardList, Shield } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AppLayout } from '@/components/organisms/AppLayout';
import { logout } from '@/services/auth';
import { useAuthStore } from '@/store/auth';

export const superadminNavigation = [
  {
    title: 'Administración',
    items: [
      { label: 'Inicio', href: '/', icon: Shield },
      { label: 'Tenants', href: '/tenants', icon: Building2 },
    ],
  },
];

export const tenantNavigation = [
  {
    title: 'Mi empresa',
    items: [
      { label: 'Inicio', href: '/', icon: Shield },
      { label: 'Onboarding', href: '/onboarding', icon: ClipboardList },
    ],
  },
];

interface DashboardShellProps {
  children: ReactNode;
  navigationOverride?: typeof superadminNavigation;
}

export function DashboardShell({ children, navigationOverride }: DashboardShellProps) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const location = useLocation();

  const navigationGroups =
    navigationOverride ??
    (user?.isSuperadmin
      ? superadminNavigation
      : user?.tenantId
        ? tenantNavigation
        : []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <AppLayout
      navigationGroups={navigationGroups}
      activeHref={location.pathname}
      linkComponent={Link}
      user={user ? { name: user.name, email: user.email } : undefined}
      onLogout={handleLogout}
    >
      {children}
    </AppLayout>
  );
}
