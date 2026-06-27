import { forwardRef, useState } from 'react';
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
    const hasSidebar = !!(sidebar || navigationGroups);

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
        />
      ) : null);

    return (
      <div
        ref={ref}
        className={cn('flex h-screen overflow-hidden bg-[var(--background)]', className)}
      >
        {hasSidebar && <div className="hidden shrink-0 lg:flex">{sidebarNode}</div>}

        {mobileMenuOpen && hasSidebar && (
          <div className="fixed inset-0 z-[var(--z-modal)] lg:hidden">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative h-full w-[85vw] max-w-sm overflow-y-auto">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--card)] text-[var(--foreground-muted)] shadow-md hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                aria-label="Cerrar menú"
              >
                ✕
              </button>
              {sidebarNode}
            </div>
          </div>
        )}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-4 md:h-20 md:px-6 lg:px-8">
            <div className="flex items-center gap-[var(--spacing-md)]">
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
            <div className="flex items-center gap-[var(--spacing-sm)]">
              {headerActions}
              <Button variant="ghost" size="icon" className="relative text-[var(--foreground-muted)]">
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
