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
  linkComponent?: React.ElementType;
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
      linkComponent: LinkComponent = 'a',
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
          'relative z-[var(--z-fixed)] flex h-screen shrink-0 flex-col overflow-hidden border-r border-[var(--border)] bg-[var(--card)] transition-[width] duration-300 ease-in-out',
          collapsed ? 'w-sidebar-collapsed' : 'w-sidebar',
          className,
        )}
      >
        <div className="mb-[var(--spacing-md)] shrink-0 border-b border-[var(--border)] px-[var(--spacing-lg)] py-[var(--spacing-md)]">
          <div className="flex items-start gap-[var(--spacing-md)]">
            {collapsed ? (
              <Tooltip content={`Mkt Agency · v${appVersion}`}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-xl font-black text-[var(--primary-foreground)]">
                  M
                </div>
              </Tooltip>
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-xl font-black text-[var(--primary-foreground)]">
                M
              </div>
            )}
            {!collapsed && (
              <div className="min-w-0 pt-0.5">
                {brand ?? (
                  <span className="block whitespace-nowrap text-xl font-black uppercase tracking-tighter text-[var(--foreground)]">
                    Mkt <span className="text-[var(--primary)]">Agency</span>
                  </span>
                )}
                <p
                  className="mt-1 truncate font-mono text-[10px] text-[var(--foreground-subtle)]"
                  title={`Versión en ejecución: ${appVersion}`}
                >
                  v{appVersion}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="custom-scrollbar overflow-y-auto overflow-x-hidden px-[var(--spacing-md)] py-[var(--spacing-md)]">
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
                          'group relative flex cursor-pointer items-center gap-[var(--spacing-md)] rounded-[var(--radius)] px-[var(--spacing-md)] py-2.5 transition-all duration-200',
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
                      <LinkComponent to={item.href} href={item.href}>
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

          {user && (
            <div className="shrink-0 border-t border-[var(--border)] p-[var(--spacing-md)]">
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
                  className="flex items-center gap-1.5 rounded-[var(--radius)] px-2.5 py-1.5 text-xs font-semibold text-[var(--foreground-subtle)] transition-all hover:bg-[var(--destructive)]/10 hover:text-[var(--destructive)]"
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
                  className="rounded-[var(--radius)] p-2 text-[var(--foreground-subtle)] transition-all hover:bg-[var(--destructive)]/10 hover:text-[var(--destructive)]"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        </div>

        {collapsible && (
          <button
            type="button"
            data-collapse-trigger
            onClick={toggleCollapse}
            className="absolute -right-3 top-24 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--foreground-muted)] shadow-md transition-all hover:border-[var(--primary)] hover:text-[var(--primary)] lg:flex"
          >
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </aside>
    );
  },
);

SidebarModern.displayName = 'SidebarModern';
export default SidebarModern;
