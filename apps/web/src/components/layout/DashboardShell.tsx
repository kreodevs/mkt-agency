import { AlertTriangle, Bot, Building2, BarChart3, CalendarDays, ClipboardList, FileInput, FileSignature, FileText, FolderOpen, Globe, Megaphone, Package, ScrollText, Shield, Target, Users } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AppLayout } from '@/components/organisms/AppLayout';
import { ImpersonationBanner } from '@/components/admin/ImpersonationBanner';
import { logout } from '@/services/auth';
import { useAuthStore } from '@/store/auth';

export const superadminNavigation = [
  {
    title: 'Administración',
    items: [
      { label: 'Inicio', href: '/', icon: Shield },
      { label: 'Tenants', href: '/tenants', icon: Building2 },
      { label: 'Paquetes', href: '/admin/packages', icon: Package },
      { label: 'Modelos LLM', href: '/admin/llm-settings', icon: Bot },
      { label: 'Usuarios', href: '/admin/users', icon: Users },
      { label: 'Auditoría', href: '/admin/audit-logs', icon: ScrollText },
      { label: 'Seguridad', href: '/admin/security-events', icon: AlertTriangle },
    ],
  },
];

export const tenantNavigation = [
  {
    title: 'Mi empresa',
    items: [
      { label: 'Inicio', href: '/', icon: Shield },
      { label: 'Onboarding', href: '/onboarding', icon: ClipboardList },
      { label: 'Campañas', href: '/campaigns', icon: Megaphone },
      { label: 'Contenidos', href: '/contents', icon: FileText },
      { label: 'Calendario', href: '/calendar', icon: CalendarDays },
      { label: 'Formularios', href: '/forms', icon: FileInput },
      { label: 'Leads', href: '/leads', icon: Users },
      { label: 'Activos', href: '/assets', icon: FolderOpen },
      { label: 'Propuestas', href: '/proposals', icon: FileSignature },
      { label: 'Reportes', href: '/reports', icon: BarChart3 },
      { label: 'Dominio', href: '/settings/domain', icon: Globe },
      { label: 'Competidores', href: '/settings/competitors', icon: Target },
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
    (user?.impersonating && user.tenantId
      ? tenantNavigation
      : user?.isSuperadmin
        ? superadminNavigation
        : user?.tenantId
          ? tenantNavigation
          : []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <ImpersonationBanner />
      <AppLayout
        navigationGroups={navigationGroups}
        activeHref={location.pathname}
        linkComponent={Link}
        user={user ? { name: user.name, email: user.email } : undefined}
        onLogout={handleLogout}
      >
        {children}
      </AppLayout>
    </>
  );
}
