import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menubar } from 'primereact/menubar';
import { PanelMenu } from 'primereact/panelmenu';
import { Avatar } from 'primereact/avatar';
import { useAuthStore, getCurrentTenant, getCurrentProduct } from '../stores/authStore';

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const tenant = getCurrentTenant();
  const product = getCurrentProduct();
  const [collapsed] = useState(false);

  const navItems = [
    {
      label: 'Dashboard',
      icon: 'pi pi-chart-bar',
      command: () => navigate('/dashboard'),
      className: location.pathname === '/dashboard' ? 'p-highlight' : '',
    },
    {
      label: 'CRM',
      icon: 'pi pi-users',
      command: () => navigate('/crm'),
      className: location.pathname.startsWith('/crm') ? 'p-highlight' : '',
    },
    {
      label: 'Contenido',
      icon: 'pi pi-calendar',
      command: () => navigate('/content'),
      className: location.pathname === '/content' ? 'p-highlight' : '',
    },
    {
      label: 'Anuncios',
      icon: 'pi pi-megaphone',
      command: () => navigate('/campaigns'),
      className: location.pathname === '/campaigns' ? 'p-highlight' : '',
    },
    ...(user?.isSuperAdmin
      ? [
          {
            label: 'Admin',
            icon: 'pi pi-cog',
            command: () => navigate('/admin'),
            className: location.pathname === '/admin' ? 'p-highlight' : '',
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-column min-h-screen">
      {/* Top Bar */}
      <Menubar
        start={
          <div className="flex align-items-center gap-3">
            <span className="text-xl font-bold text-primary">MktAgencyOS</span>
            {tenant && (
              <span className="text-sm text-500 border-1 border-round p-1 px-2">
                {tenant.name}
                {product && ` / ${product.name}`}
              </span>
            )}
          </div>
        }
        end={
          <div className="flex align-items-center gap-2">
            <Avatar label={user?.name?.charAt(0) || 'U'} shape="circle" size="normal" />
            <span className="text-sm">{user?.name}</span>
            <i className="pi pi-sign-out cursor-pointer text-lg" onClick={() => { logout(); navigate('/login'); }} />
          </div>
        }
      />

      {/* Body */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <div className={collapsed ? 'w-2rem' : 'w-15rem'} style={{ transition: 'width 0.2s' }}>
          <PanelMenu model={navItems} className="h-full border-noround" />
        </div>

        {/* Content */}
        <div className="flex-1 p-3 overflow-auto" style={{ background: '#f8f9fa' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
