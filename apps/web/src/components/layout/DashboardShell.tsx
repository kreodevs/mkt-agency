import { AlertTriangle, BarChart3, Bot, Building2, CalendarDays, ClipboardList, Coins, FileInput, FileSignature, FileText, FolderOpen, Globe, Inbox, Lightbulb, Megaphone, MessageSquare, Package, ScrollText, Shield, Sparkles, Target, Users } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AppLayout } from '@/components/organisms/AppLayout';
import { ImpersonationSwitcher } from '@/components/admin/ImpersonationSwitcher';
import { TenantImpersonationSelect } from '@/components/admin/TenantImpersonationSelect';
import { ActiveProductSelector } from '@/components/products/ActiveProductSelector';
import { logout } from '@/services/auth';
import { useAuthStore } from '@/store/auth';
import { isImpersonating } from '@/lib/impersonation';

export const superadminNavigation = [
  {
    title: 'Administración',
    items: [
      { label: 'Inicio', href: '/', icon: Shield },
      { label: 'Tenants', href: '/tenants', icon: Building2 },
      { label: 'Paquetes', href: '/admin/packages', icon: Package },
      { label: 'Usuarios', href: '/admin/users', icon: Users },
      { label: 'Auditoría', href: '/admin/audit-logs', icon: ScrollText },
      { label: 'Seguridad', href: '/admin/security-events', icon: AlertTriangle },
    ],
  },
  {
    title: 'Configuración IA',
    items: [
      { label: 'Proveedores LLM', href: '/admin/llm-providers', icon: Bot },
      { label: 'Modelos por tarea', href: '/admin/llm-settings', icon: Sparkles },
      { label: 'Consumo IA', href: '/admin/llm-usage', icon: Coins },
    ],
  },
];

export const tenantNavigation = [
  {
    title: 'Mi negocio',
    items: [
      { label: 'Bandeja', href: '/', icon: Inbox },
      { label: 'Mis productos', href: '/products', icon: Package },
      { label: 'Dashboard', href: '/dashboard', icon: BarChart3 },
      { label: 'Perfil de empresa', href: '/onboarding', icon: ClipboardList },
    ],
  },
  {
    title: 'Agentes',
    items: [
      { label: 'Brand Analyst', href: '/agents', icon: Bot },
      { label: 'Community Manager', href: '/community', icon: MessageSquare },
      { label: 'Estrategia', href: '/strategy', icon: Lightbulb },
    ],
  },
  {
    title: 'Marketing',
    items: [
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

  return (
    <AppLayout
      navigationGroups={navigationGroups}
      activeHref={location.pathname}
      linkComponent={Link}
      user={user ? { name: user.name, email: user.email } : undefined}
      headerActions={headerActions}
      onLogout={handleLogout}
    >
      {children}
    </AppLayout>
  );
}