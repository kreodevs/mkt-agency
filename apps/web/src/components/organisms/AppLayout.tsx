import { forwardRef, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Menu as MenuIcon, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/atoms/Button';
import { SidebarModern, type SidebarGroup } from './SidebarModern';

export interface AppLayoutProps {
  sidebar?: React.ReactNode;
  navigationGroups?: SidebarGroup[];
  children: React.ReactNode;
  activeHref?: string;
  user?: { name: string; email: string; avatar?: string };
  headerActions?: React.ReactNode;
  brand?: React.ReactNode;
  className?: string;
  linkComponent?: React.ElementType;
  onLogout?: () => void;
}

export const AppLayout = forwardRef<HTMLDivElement, AppLayoutProps>(
  (
    {
      sidebar,
      navigationGroups,
      children,
      activeHref,
      user,
      headerActions,
      brand,
      linkComponent,
      className,
      onLogout,
    },
    ref,
  ) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();
    const hasSidebar = !!(sidebar || navigationGroups);

    useEffect(() => {
      setMobileMenuOpen(false);
    }, [location.pathname]);

    const sidebarNode =
      sidebar ??
      (navigationGroups ? (
        <SidebarModern
          groups={navigationGroups}
          activeHref={activeHref}
          user={user}
          brand={brand}
          linkComponent={linkComponent}
          onLogout={onLogout}
          onNavClick={() => setMobileMenuOpen(false)}
        />
      ) : null);

    return (
      <div
        ref={ref}
        className={cn('flex h-screen overflow-hidden bg-[var(--background)]', className)}
      >
        {hasSidebar && <div className="hidden h-full shrink-0 lg:flex">{sidebarNode}</div>}

        {mobileMenuOpen && hasSidebar && (
          <div className="fixed inset-0 z-[var(--z-modal)] flex lg:hidden">
            <div className="flex h-full w-[85vw] max-w-sm shrink-0 flex-col overflow-hidden bg-[var(--card)] shadow-xl">
              {sidebarNode}
            </div>
            <button
              type="button"
              className="min-w-0 flex-1 cursor-default bg-black/60 backdrop-blur-sm"
              aria-label="Cerrar menú"
              onClick={() => setMobileMenuOpen(false)}
            />
          </div>
        )}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="z-20 flex min-h-16 shrink-0 items-center gap-3 border-b border-[var(--border)] bg-[var(--card)] px-4 py-2.5 md:min-h-20 md:px-6 md:py-3 lg:px-8">
            <div className="flex shrink-0 items-center gap-[var(--spacing-md)]">
              {hasSidebar && (
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="rounded-[var(--radius)] p-[var(--spacing-sm)] text-[var(--foreground-muted)] hover:bg-[var(--secondary)] lg:hidden"
                >
                  <MenuIcon className="h-5 w-5" />
                </button>
              )}
              <div className="hidden w-64 items-center gap-[var(--spacing-sm)] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background)] px-[var(--spacing-md)] py-[var(--spacing-sm)] text-[var(--foreground-subtle)] md:flex lg:w-96">
                <Search className="h-4 w-4" />
                <span className="text-sm font-medium">Buscar...</span>
              </div>
            </div>
            <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-[var(--spacing-sm)]">
              {headerActions}
              <Button
                variant="ghost"
                size="icon"
                className="relative shrink-0 text-[var(--foreground-muted)]"
              >
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </header>
          <main className="custom-scrollbar flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 lg:px-10 lg:py-10">
            <div className="mx-auto max-w-[1600px] animate-fade-in">{children}</div>
          </main>
        </div>
      </div>
    );
  },
);

AppLayout.displayName = 'AppLayout';
export default AppLayout;
