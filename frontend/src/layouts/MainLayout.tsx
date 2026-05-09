import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from 'primereact/sidebar';
import { Avatar } from 'primereact/avatar';
import { useAuthStore, getCurrentTenant, getCurrentProduct } from '../stores/authStore';
import {
  LayoutDashboard, Users, Calendar, Megaphone, Eye, Map,
  CheckCircle, Settings, HelpCircle, Plug, LogOut, Menu,
} from 'lucide-react';
import { cn } from '../lib/utils';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  visible?: boolean;
}

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const tenant = getCurrentTenant();
  const product = getCurrentProduct();
  const isMobile = useIsMobile();
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const activePath = location.pathname;

  const navItems: NavItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/dashboard' },
    { label: 'CRM', icon: <Users size={18} />, path: '/crm' },
    { label: 'Contenido', icon: <Calendar size={18} />, path: '/content' },
    { label: 'Anuncios', icon: <Megaphone size={18} />, path: '/campaigns' },
    { label: 'Competencia', icon: <Eye size={18} />, path: '/competitors' },
    { label: 'SEO Local', icon: <Map size={18} />, path: '/seo' },
    { label: 'Onboarding', icon: <CheckCircle size={18} />, path: '/onboarding' },
    { label: 'Admin', icon: <Settings size={18} />, path: '/admin', visible: user?.isSuperAdmin },
    { label: 'Ayuda', icon: <HelpCircle size={18} />, path: '/help' },
    { label: 'Conexiones', icon: <Plug size={18} />, path: '/settings' },
  ];

  const renderNavItem = (item: NavItem) => {
    if (item.visible === false) return null;
    const isActive = item.path === '/'
      ? activePath === '/'
      : activePath.startsWith(item.path);
    return (
      <button
        key={item.path}
        onClick={() => { navigate(item.path); setSidebarVisible(false); }}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-[10px] text-sm rounded-[var(--radius-md)] transition-all duration-[var(--transition-base)] text-left cursor-pointer border-none',
          isActive
            ? 'bg-[var(--secondary)] text-[var(--primary)] font-medium'
            : 'bg-transparent text-[var(--foreground-muted)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]',
        )}
      >
        <span className="shrink-0">{item.icon}</span>
        <span>{item.label}</span>
      </button>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-[var(--card-border)]">
        <div className="text-lg font-bold text-[var(--foreground)]">MktAgencyOS</div>
        {tenant && (
          <div className="text-xs text-[var(--foreground-muted)] mt-1">
            {tenant.name}
            {product && <span className="text-[var(--primary)]"> / {product.name}</span>}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {navItems.map(renderNavItem)}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-[var(--card-border)]">
        <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)] px-2">
          <span>{user?.name}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Top Bar */}
      <header className="flex items-center h-14 px-3 md:px-4 border-b border-[var(--card-border)] bg-[var(--background)] shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {isMobile && (
            <button
              onClick={() => setSidebarVisible(true)}
              className="flex items-center justify-center w-9 h-9 rounded-[var(--radius-md)] bg-transparent text-[var(--foreground-muted)] hover:bg-[var(--secondary)] cursor-pointer border-none"
            >
              <Menu size={20} />
            </button>
          )}
          <span className="text-base md:text-lg font-bold text-[var(--primary)] truncate">
            MktAgencyOS
          </span>
          {!isMobile && tenant && (
            <span className="text-xs px-2 py-1 rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--foreground-muted)]">
              {tenant.name}
              {product && ` / ${product.name}`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Avatar
            label={user?.name?.charAt(0) || 'U'}
            shape="circle"
            size={isMobile ? 'small' as any : 'normal' as any}
            className="bg-[var(--secondary)] text-[var(--foreground-muted)]"
          />
          {!isMobile && <span className="text-sm text-[var(--foreground-muted)]">{user?.name}</span>}
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center justify-center w-9 h-9 rounded-[var(--radius-md)] text-[var(--foreground-muted)] hover:text-[var(--destructive)] hover:bg-[var(--secondary)] cursor-pointer border-none bg-transparent"
            title="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <aside className="w-[280px] shrink-0 border-r border-[var(--card-border)] bg-[var(--background-secondary)] overflow-hidden">
            {sidebarContent}
          </aside>
        )}

        {/* Mobile Overlay Sidebar */}
        {isMobile && (
          <Sidebar
            visible={sidebarVisible}
            onHide={() => setSidebarVisible(false)}
            className="!bg-[var(--background-secondary)] !border-r !border-[var(--card-border)]"
          >
            {sidebarContent}
          </Sidebar>
        )}

        {/* Content area */}
        <main className="flex-1 overflow-auto bg-[var(--background)]">
          <div className="p-4 md:p-6 max-w-[1200px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
