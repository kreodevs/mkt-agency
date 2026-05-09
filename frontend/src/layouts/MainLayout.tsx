import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menubar } from 'primereact/menubar';
import { PanelMenu } from 'primereact/panelmenu';
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import { useAuthStore, getCurrentTenant, getCurrentProduct } from '../stores/authStore';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const tenant = getCurrentTenant();
  const product = getCurrentProduct();
  const isMobile = useIsMobile();
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const navItems = [
    {
      label: 'Dashboard',
      icon: 'pi pi-chart-bar',
      command: () => { navigate('/dashboard'); setSidebarVisible(false); },
      className: location.pathname === '/dashboard' ? 'p-highlight' : '',
    },
    {
      label: 'CRM',
      icon: 'pi pi-users',
      command: () => { navigate('/crm'); setSidebarVisible(false); },
      className: location.pathname.startsWith('/crm') ? 'p-highlight' : '',
    },
    {
      label: 'Contenido',
      icon: 'pi pi-calendar',
      command: () => { navigate('/content'); setSidebarVisible(false); },
      className: location.pathname === '/content' ? 'p-highlight' : '',
    },
    {
      label: 'Anuncios',
      icon: 'pi pi-megaphone',
      command: () => { navigate('/campaigns'); setSidebarVisible(false); },
      className: location.pathname === '/campaigns' ? 'p-highlight' : '',
    },
    {
      label: 'Competencia',
      icon: 'pi pi-eye',
      command: () => { navigate('/competitors'); setSidebarVisible(false); },
      className: location.pathname === '/competitors' ? 'p-highlight' : '',
    },
    {
      label: 'SEO Local',
      icon: 'pi pi-map',
      command: () => { navigate('/seo'); setSidebarVisible(false); },
      className: location.pathname === '/seo' ? 'p-highlight' : '',
    },
    {
      label: 'Onboarding',
      icon: 'pi pi-check-circle',
      command: () => { navigate('/onboarding'); setSidebarVisible(false); },
      className: location.pathname === '/onboarding' ? 'p-highlight' : '',
    },
    ...(user?.isSuperAdmin
      ? [
          {
            label: 'Admin',
            icon: 'pi pi-cog',
            command: () => { navigate('/admin'); setSidebarVisible(false); },
            className: location.pathname === '/admin' ? 'p-highlight' : '',
          },
        ]
      : []),
    {
      label: 'Ayuda',
      icon: 'pi pi-question-circle',
      command: () => { navigate('/help'); setSidebarVisible(false); },
      className: location.pathname === '/help' ? 'p-highlight' : '',
    },
    {
      label: 'Conexiones',
      icon: 'pi pi-plug',
      command: () => { navigate('/settings'); setSidebarVisible(false); },
      className: location.pathname === '/settings' ? 'p-highlight' : '',
    },
  ];

  const sidebarContent = (
    <PanelMenu model={navItems} className="h-full border-noround w-full" />
  );

  return (
    <div className="flex flex-column min-h-screen">
      {/* Top Bar */}
      <Menubar
        start={
          <div className="flex align-items-center gap-2 md:gap-3">
            {isMobile && (
              <Button
                icon="pi pi-bars"
                className="p-button-rounded p-button-text p-button-sm"
                onClick={() => setSidebarVisible(true)}
              />
            )}
            <span className="text-lg md:text-xl font-bold text-primary">MktAgencyOS</span>
            {!isMobile && tenant && (
              <span className="text-xs md:text-sm text-500 border-1 border-round p-1 px-2">
                {tenant.name}
                {product && ` / ${product.name}`}
              </span>
            )}
          </div>
        }
        end={
          <div className="flex align-items-center gap-1 md:gap-2">
            <Avatar label={user?.name?.charAt(0) || 'U'} shape="circle" size={isMobile ? 'small' : 'normal'} />
            {!isMobile && <span className="text-sm">{user?.name}</span>}
            <i className="pi pi-sign-out cursor-pointer text-lg" onClick={() => { logout(); navigate('/login'); }} />
          </div>
        }
        className="p-menubar-sm"
      />

      {/* Body */}
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <div className="w-15rem" style={{ minWidth: '15rem' }}>
            {sidebarContent}
          </div>
        )}

        {/* Mobile Overlay Sidebar */}
        {isMobile && (
          <Sidebar
            visible={sidebarVisible}
            onHide={() => setSidebarVisible(false)}
            className="w-18rem"
          >
            {tenant && (
              <div className="mb-3 pb-3 border-bottom-1 surface-border">
                <div className="font-bold text-primary">{tenant.name}</div>
                {product && <div className="text-sm text-500">{product.name}</div>}
              </div>
            )}
            {sidebarContent}
          </Sidebar>
        )}

        {/* Content */}
        <div className="flex-1 p-2 md:p-3 overflow-auto" style={{ background: '#f8f9fa' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
