import { forwardRef, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Menu as MenuIcon } from 'lucide-react';
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
  banner?: React.ReactNode;
  brand?: React.ReactNode;
  className?: string;
  linkComponent?: React.ElementType;
  onLogout?: () => void;
  sidebarFooter?: React.ReactNode;
  notificationCount?: number;
  onNotificationsClick?: () => void;
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
      banner,
      brand,
      linkComponent,
      className,
      onLogout,
      sidebarFooter,
      notificationCount = 0,
      onNotificationsClick,
    },
    ref,
  ) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();
    const hasSidebar = !!(sidebar || navigationGroups);
    const touchStartX = useRef(0);
    const touchFromEdge = useRef(false);

    useEffect(() => {
      setMobileMenuOpen(false);
    }, [location.pathname]);

    const handleTouchStart = (e: React.TouchEvent) => {
      touchFromEdge.current = e.touches[0].clientX < 24;
      touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
      if (!hasSidebar) return;
      const endX = e.changedTouches[0].clientX;
      const dx = endX - touchStartX.current;
      if (!mobileMenuOpen && touchFromEdge.current && dx > 60) {
        setMobileMenuOpen(true);
        return;
      }
      if (mobileMenuOpen && dx < -60) {
        setMobileMenuOpen(false);
      }
    };

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
          sidebarFooter={sidebarFooter}
        />
      ) : null);

    return (
      <div
        ref={ref}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={cn('flex h-[100dvh] overflow-hidden bg-[var(--background)]', className)}
      >
        {hasSidebar && (
          <div className="relative z-30 hidden h-full shrink-0 overflow-visible lg:block">
            {sidebarNode}
          </div>
        )}

        {mobileMenuOpen && hasSidebar && (
          <div className="fixed inset-0 z-[var(--z-modal)] flex lg:hidden" role="dialog" aria-modal="true" aria-label="Menú de navegación">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
              className="flex h-full w-sidebar max-w-[85vw] shrink-0 flex-col overflow-hidden shadow-xl pb-[var(--safe-area-bottom)]"
            >
              {sidebarNode}
            </motion.div>
            <button
              type="button"
              className="min-w-0 flex-1 cursor-default bg-[var(--foreground)]/40 backdrop-blur-sm"
              aria-label="Cerrar menú"
              onClick={() => setMobileMenuOpen(false)}
            />
          </div>
        )}

        <div className="relative z-0 flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="relative flex h-header shrink-0 items-center gap-3 border-b border-[var(--border)]/40 material-header scroll-edge-bottom px-4 md:px-6 lg:px-8 pb-[var(--safe-area-bottom)]">
            <div className="flex shrink-0 items-center gap-[var(--spacing-md)]">
              {hasSidebar && (
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="rounded-[var(--radius)] p-[var(--spacing-sm)] text-[var(--foreground-muted)] hover:bg-[var(--secondary)] lg:hidden press-subtle"
                  aria-label="Abrir menú de navegación"
                >
                  <MenuIcon className="h-5 w-5" />
                </button>
              )}
            </div>
            <div className="relative z-30 flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-[var(--spacing-sm)]">
              {headerActions}
              {onNotificationsClick ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative shrink-0 text-[var(--foreground-muted)]"
                  aria-label={
                    notificationCount > 0
                      ? `${notificationCount} avisos sin leer`
                      : 'Ver avisos'
                  }
                  onClick={onNotificationsClick}
                >
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 ? (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--destructive)] px-1 text-[10px] font-bold text-white">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  ) : null}
                </Button>
              ) : null}
            </div>
          </header>
          {banner}
          <main className="custom-scrollbar rubber-band min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 lg:px-10 lg:py-10">
            <div className="mx-auto max-w-[1600px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    );
  },
);

AppLayout.displayName = 'AppLayout';
export default AppLayout;
