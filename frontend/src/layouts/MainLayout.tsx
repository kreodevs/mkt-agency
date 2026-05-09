import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AppLayout, type SidebarGroup } from '../components/ui';
import { useAuthStore, getCurrentTenant, getCurrentProduct } from '../stores/authStore';
import { LayoutDashboard, Users, Calendar, Megaphone, Eye, Map,
  CheckCircle, Settings, HelpCircle, Plug, LogOut, MessageSquare,
} from 'lucide-react';

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, setProduct } = useAuthStore();
  const currentProductId = useAuthStore((s) => s.currentProductId);
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
        { label: 'Propuestas', href: '/proposals', icon: MessageSquare },
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
      key={currentProductId}
      navigationGroups={navigationGroups}
      activeHref={activePath}
      user={user ? { name: user.name, email: user.email } : undefined}
      brand={
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-[var(--foreground)] tracking-tight">MktAgencyOS</span>
          </div>
          {tenant && (
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] text-[var(--foreground-muted)]">{tenant.name}</span>
              {tenant.products?.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProduct(p.id)}
                  className={`inline-flex items-center px-1.5 py-0.5 text-[10px] rounded-[var(--radius-sm)] border transition-colors cursor-pointer bg-transparent ${
                    p.id === product?.id
                      ? 'text-[var(--primary)] border-[var(--primary)] font-medium'
                      : 'text-[var(--foreground-muted)] border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
                  }`}
                >
                  {p.name}
                  <span className="ml-1 opacity-40 text-[8px]">{p.id.slice(0, 6)}</span>
                </button>
              ))}
            </div>
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
