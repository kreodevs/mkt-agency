import { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AppLayout, type SidebarGroup } from '../components/ui';
import { useAuthStore, getCurrentTenant, getCurrentProduct } from '../stores/authStore';
import {
  LayoutDashboard, Users, Calendar, Megaphone, Eye, Map,
  CheckCircle, Settings, HelpCircle, Plug, LogOut, MessageSquare,
  ChevronDown, Check,
} from 'lucide-react';

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, setProduct } = useAuthStore();
  const tenant = getCurrentTenant();
  const product = getCurrentProduct();
  const [productOpen, setProductOpen] = useState(false);
  const productRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (productRef.current && !productRef.current.contains(e.target as Node)) {
        setProductOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
      navigationGroups={navigationGroups}
      activeHref={activePath}
      user={user ? { name: user.name, email: user.email } : undefined}
      brand={
        <div ref={productRef} className="relative">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-[var(--foreground)] tracking-tight">MktAgencyOS</span>
            {tenant && (
              <button
                onClick={() => setProductOpen(!productOpen)}
                className="flex items-center gap-1 text-[10px] text-[var(--foreground-muted)] -mt-0.5 hover:text-[var(--primary)] transition-colors cursor-pointer bg-transparent border-none"
              >
                {tenant.name}
                {product ? <span className="text-[var(--primary)]"> / {product.name}</span> : ''}
                {tenant.products?.length > 1 && <ChevronDown size={10} className="mt-0.5" />}
              </button>
            )}
          </div>

          {/* Product selector dropdown */}
          {productOpen && tenant?.products && tenant.products.length > 1 && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-lg z-50 py-1 animate-fade-in">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">
                Productos
              </div>
              {tenant.products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setProduct(p.id);
                    setProductOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--secondary)] transition-colors cursor-pointer border-none bg-transparent ${
                    p.id === product?.id ? 'text-[var(--primary)] font-medium' : 'text-[var(--foreground)]'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    p.id === product?.id ? 'border-[var(--primary)] bg-[var(--primary)]/10' : 'border-[var(--border)]'
                  }`}>
                    {p.id === product?.id && <Check size={10} className="text-[var(--primary)]" />}
                  </span>
                  {p.name}
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
