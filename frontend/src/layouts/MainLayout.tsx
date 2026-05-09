import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AppLayout, type SidebarGroup } from '../components/ui';
import { useAuthStore, getCurrentTenant, getCurrentProduct } from '../stores/authStore';
import {
  LayoutDashboard, Users, Calendar, Megaphone, Eye, Map,
  CheckCircle, Settings, HelpCircle, Plug, LogOut, MessageSquare,
  ChevronDown,
} from 'lucide-react';

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, setProduct } = useAuthStore();
  const tenant = getCurrentTenant();
  const product = getCurrentProduct();
  const [productOpen, setProductOpen] = useState(false);

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
    <>
    <AppLayout
      navigationGroups={navigationGroups}
      activeHref={activePath}
      user={user ? { name: user.name, email: user.email } : undefined}
      brand={
        <div className="flex flex-col">
          <span className="text-lg font-bold text-[var(--foreground)] tracking-tight">MktAgencyOS</span>
          {tenant && (
            <button
              onClick={() => setProductOpen(true)}
              className="flex items-center gap-1 text-[10px] text-[var(--foreground-muted)] -mt-0.5 hover:text-[var(--primary)] transition-colors cursor-pointer bg-transparent border-none text-left"
            >
              {tenant.name}
              {product ? <span className="text-[var(--primary)]"> / {product.name}</span> : ''}
              {tenant.products?.length > 1 && <ChevronDown size={10} className="mt-0.5 shrink-0" />}
            </button>
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

      {/* Product selector modal (fixed overlay, not affected by sidebar overflow) */}
      {productOpen && tenant?.products && tenant.products.length > 1 && (
        <div className="fixed inset-0 z-[999] flex items-start justify-center pt-24" onClick={() => setProductOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative w-64 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-2xl py-2 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-2 text-[11px] font-semibold text-[var(--foreground-muted)] uppercase tracking-wider border-b border-[var(--border)]">
              Seleccionar Producto
            </div>
            {tenant.products.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setProduct(p.id);
                  setProductOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-[var(--secondary)] transition-colors cursor-pointer border-none bg-transparent text-left ${
                  p.id === product?.id ? 'text-[var(--primary)] font-medium' : 'text-[var(--foreground)]'
                }`}
              >
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  p.id === product?.id ? 'border-[var(--primary)]' : 'border-[var(--border)]'
                }`}>
                  {p.id === product?.id && <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)]" />}
                </span>
                <div className="flex flex-col">
                  <span>{p.name}</span>
                  <span className="text-[10px] text-[var(--foreground-muted)]">{p.type}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
  </>
  );
}
