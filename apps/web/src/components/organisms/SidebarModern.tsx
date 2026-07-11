import { forwardRef, useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/atoms/Avatar';
import { Tooltip } from '@/components/molecules/Tooltip';

export interface SidebarLink {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  children?: { label: string; href: string }[];
}

export interface SidebarGroup {
  title?: string;
  items: SidebarLink[];
}

export interface SidebarModernProps {
  groups: SidebarGroup[];
  activeHref?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  brand?: React.ReactNode;
  user?: { name: string; email: string; avatar?: string };
  onLogout?: () => void;
  onNavClick?: () => void;
  linkComponent?: React.ElementType;
  sidebarFooter?: React.ReactNode;
  className?: string;
}

export const SidebarModern = forwardRef<HTMLElement, SidebarModernProps>(
  (
    {
      groups,
      activeHref,
      collapsible = true,
      defaultCollapsed = false,
      onCollapsedChange,
      brand,
      user,
      onLogout,
      onNavClick,
      linkComponent: LinkComponent = 'a',
      sidebarFooter,
      className,
    },
    ref,
  ) => {
    const [collapsed, setCollapsed] = useState(defaultCollapsed);
    const appVersion = import.meta.env.VITE_APP_VERSION?.trim() || 'dev';

    const toggleCollapse = () => {
      const next = !collapsed;
      setCollapsed(next);
      onCollapsedChange?.(next);
    };

    return (
      <aside
        ref={ref}
        className={cn(
          'relative flex h-full min-h-0 w-full shrink-0 flex-col overflow-visible border-r border-[var(--border)]/60 material-sidebar transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          collapsed ? 'lg:w-sidebar-collapsed' : 'lg:w-sidebar',
          className,
        )}
      >
        <div className="relative flex h-header shrink-0 items-center overflow-visible border-b border-[var(--border)]/40 px-[var(--spacing-lg)]">
          <div className="flex min-w-0 flex-1 items-center gap-[var(--spacing-md)]">
            {collapsed ? (
              <Tooltip content={`Mkt Agency · v${appVersion}`}>
                <div className="flex h-avatar-sm w-avatar-sm shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-xl font-black text-[var(--primary-foreground)]">
                  M
                </div>
              </Tooltip>
            ) : (
              <Tooltip content={`Versión en ejecución: v${appVersion}`}>
                <div className="flex min-w-0 flex-1 items-center gap-[var(--spacing-md)]">
                  <div className="flex h-avatar-sm w-avatar-sm shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-xl font-black text-[var(--primary-foreground)]">
                    M
                  </div>
                  <div className="min-w-0">
                    {brand ?? (
                      <span className="block truncate whitespace-nowrap text-xl font-black uppercase tracking-tighter text-[var(--foreground)]">
                        Mkt <span className="text-[var(--primary)]">Agency</span>
                      </span>
                    )}
                  </div>
                </div>
              </Tooltip>
            )}
          </div>

          {collapsible && (
            <button
              type="button"
              data-collapse-trigger
              onClick={toggleCollapse}
              className="absolute top-1/2 -right-3 z-50 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--foreground-muted)] shadow-md transition-all hover:border-[var(--primary)] hover:text-[var(--primary)] lg:flex press-subtle"
              aria-label={collapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}
            >
              {collapsed ? (
                <ChevronRight className="h-3.5 w-3.5" />
              ) : (
                <ChevronLeft className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-[var(--spacing-md)] py-[var(--spacing-md)]">
            {groups.map((group, idx) => (
              <div key={idx} className="mb-[var(--spacing-xl)]">
                {!collapsed && group.title && (
                  <h3 className="mb-[var(--spacing-md)] px-[var(--spacing-md)] text-[10px] font-black uppercase tracking-[0.2em] text-[var(--foreground-subtle)]">
                    {group.title}
                  </h3>
                )}
                <div className="space-y-[var(--spacing-xs)]">
                  {group.items.map((item, i) => {
                    const isActive = activeHref === item.href;
                    const Icon = item.icon;
                    const content = (
                      <div
                        className={cn(
                          'group relative flex cursor-pointer items-center gap-[var(--spacing-md)] rounded-[var(--radius)] px-[var(--spacing-md)] py-2.5 transition-all duration-200 press-subtle',
                          isActive
                            ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md'
                            : 'text-[var(--foreground-muted)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]',
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {!collapsed && (
                          <span className="flex-1 whitespace-nowrap text-sm font-semibold">
                            {item.label}
                          </span>
                        )}
                        {!collapsed && item.children?.length ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : null}
                      </div>
                    );

                    const link = (
                      <LinkComponent
                        to={item.href}
                        href={item.href}
                        onClick={() => onNavClick?.()}
                      >
                        {content}
                      </LinkComponent>
                    );

                    return (
                      <div key={i}>
                        {collapsed ? (
                          <Tooltip content={item.label}>{link}</Tooltip>
                        ) : (
                          link
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {sidebarFooter && !collapsed && (
            <div className="shrink-0 border-t border-[var(--border)]/40 px-[var(--spacing-md)] py-[var(--spacing-sm)]">
              {sidebarFooter}
            </div>
          )}

          {user && (
            <div className="mt-auto shrink-0 border-t border-[var(--border)]/40 p-[var(--spacing-md)]">
              <div className="flex items-center gap-[var(--spacing-md)]">
                <Avatar src={user.avatar} name={user.name} size="sm" />
                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[var(--foreground)]">
                      {user.name}
                    </p>
                    <p className="truncate text-[10px] text-[var(--foreground-muted)]">
                      {user.email}
                    </p>
                  </div>
                )}
                {onLogout && !collapsed && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="flex items-center gap-1.5 rounded-[var(--radius)] px-2.5 py-1.5 text-xs font-semibold text-[var(--foreground-subtle)] transition-all hover:bg-[var(--destructive)]/10 hover:text-[var(--destructive)] press-subtle"
                    aria-label="Cerrar sesión"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Salir
                  </button>
                )}
                {onLogout && collapsed && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="rounded-[var(--radius)] p-2 text-[var(--foreground-subtle)] transition-all hover:bg-[var(--destructive)]/10 hover:text-[var(--destructive)] press-subtle"
                    aria-label="Cerrar sesión"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

      </aside>
    );
  },
);

SidebarModern.displayName = 'SidebarModern';
export default SidebarModern;
