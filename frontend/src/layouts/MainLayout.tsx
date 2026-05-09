import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AppLayout, type SidebarGroup } from '../components/ui';
import { useAuthStore, getCurrentTenant, getCurrentProduct } from '../stores/authStore';
import {
  LayoutDashboard, Users, Calendar, Megaphone, Eye, Map,
  CheckCircle, Settings, HelpCircle, Plug, LogOut,
} from 'lucide-react';

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const tenant = getCurrentTenant();
  const product = getCurrentProduct();

  const activePath = location.pathname;

  const navigationGroups: SidebarGroup[] = [
    {
      title: 'PRINCIPAL',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'CRM', href: '/crm', icon: Users },
        { label: 'Contenido', href: '/content', icon: Calendar },
        { label: 'Anuncios', href: '/campaigns', icon: Megaphone },
      ],
    },
    {
      title: 'MARKETING',
      items: [
        { label: 'Competencia', href: '/competitors', icon: Eye },
        { label: 'SEO Local', href: '/seo', icon: Map },
      ],
    },
    {
      title: 'CONFIGURACIÓN',
      items: [
        { label: 'Onboarding', href: '/onboarding', icon: CheckCircle },
        ...(user?.isSuperAdmin ? [{ label: 'Admin', href: '/admin', icon: Settings as any }] : []),
        { label: 'Conexiones', href: '/settings', icon: Plug },
        { label: 'Ayuda', href: '/help', icon: HelpCircle },
      ],
    },
  ];

  return (
    <AppLayout
      navigationGroups={navigationGroups}
      activeHref={activePath}
      user={user ? { name: user.name, email: user.email } : undefined}
      brand={
        <div className="flex flex-col">
          <span className="text-lg font-bold text-[var(--foreground)] tracking-tight">MktAgencyOS</span>
          {tenant && (
            <span className="text-[10px] text-[var(--foreground-muted)] -mt-0.5">
              {tenant.name}{product ? <span className="text-[var(--primary)]"> / {product.name}</span> : ''}
            </span>
          )}
        </div>
      }
      headerActions={
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--foreground-muted)] hover:text-[var(--destructive)] hover:bg-[var(--secondary)] rounded-[var(--radius)] transition-colors cursor-pointer border-none bg-transparent"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Salir</span>
        </button>
      }
    >
      <Outlet />
    </AppLayout>
  );
}
