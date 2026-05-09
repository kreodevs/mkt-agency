import { useState, forwardRef } from "react";
import { cn } from "@/lib/utils";
import {
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    LogOut,
    type LucideIcon
} from "lucide-react";
import { Avatar } from '../atoms/Avatar';
import { Tooltip } from '../molecules/Tooltip';

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
    user?: {
        name: string;
        email: string;
        avatar?: string;
    };
    className?: string;
}

/**
 * SidebarModern - Navegación lateral premium para aplicaciones administrativas.
 * Soporta estados colapsados, grupos de navegación, submenús y perfiles de usuario.
 */
export const SidebarModern = forwardRef<HTMLElement, SidebarModernProps>(({
    groups,
    activeHref,
    collapsible = true,
    defaultCollapsed = false,
    onCollapsedChange,
    brand,
    user,
    className
}, ref) => {
    const [collapsed, setCollapsed] = useState(defaultCollapsed);
    const [openMenus, setOpenMenus] = useState<string[]>([]);

    const toggleCollapse = () => {
        const newState = !collapsed;
        setCollapsed(newState);
        onCollapsedChange?.(newState);
    };

    const toggleSubmenu = (label: string) => {
        if (collapsed) return;
        setOpenMenus(prev =>
            prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
        );
    };

    return (
        <aside
            ref={ref}
            className={cn(
                "flex flex-col h-screen bg-[var(--card)] border-r border-[var(--border)] transition-all duration-300 ease-in-out z-[var(--z-fixed)] relative",
                collapsed ? "w-20" : "w-72",
                className
            )}
        >
            {/* Brand / Logo */}
            <div className="h-20 flex items-center px-6 mb-4 overflow-hidden shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] font-black text-xl shrink-0">
                        K
                    </div>
                    {!collapsed && (
                        <div className="animate-fade-in whitespace-nowrap">
                            {brand || <span className="text-xl font-black text-[var(--foreground)] tracking-tighter uppercase">KREO <span className="text-[var(--primary)]">ADMIN</span></span>}
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 custom-scrollbar">
                {groups.map((group, idx) => (
                    <div key={idx} className="mb-8">
                        {!collapsed && group.title && (
                            <h3 className="px-4 mb-4 text-[10px] font-black text-[var(--foreground-subtle)] uppercase tracking-[0.2em] animate-fade-in">
                                {group.title}
                            </h3>
                        )}

                        <div className="space-y-1">
                            {group.items.map((item, i) => {
                                const isActive = activeHref === item.href;
                                const Icon = item.icon;
                                const hasChildren = item.children && item.children.length > 0;
                                const isMenuOpen = openMenus.includes(item.label);

                                const NavItemContent = (
                                    <div
                                        onClick={() => hasChildren ? toggleSubmenu(item.label) : null}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius)] cursor-pointer transition-all duration-200 group relative",
                                            isActive
                                                ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md"
                                                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
                                        )}
                                    >
                                        <Icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-inherit" : "text-[var(--foreground-subtle)] group-hover:text-[var(--primary)]")} />

                                        {!collapsed && (
                                            <>
                                                <span className="flex-1 font-semibold text-sm whitespace-nowrap animate-fade-in">{item.label}</span>
                                                {item.badge && (
                                                    <span className={cn(
                                                        "px-1.5 py-0.5 text-[10px] font-black rounded-md",
                                                        isActive ? "bg-black/20 text-white" : "bg-[var(--primary)]/10 text-[var(--primary)]"
                                                    )}>
                                                        {item.badge}
                                                    </span>
                                                )}
                                                {hasChildren && (
                                                    <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isMenuOpen && "rotate-180")} />
                                                )}
                                            </>
                                        )}

                                        {collapsed && isActive && (
                                            <div className="absolute left-0 w-1 h-6 bg-[var(--primary-foreground)] rounded-full -translate-x-1" />
                                        )}
                                    </div>
                                );

                                return (
                                    <div key={i}>
                                        {collapsed ? (
                                            <Tooltip content={item.label}>
                                                <a href={hasChildren ? undefined : item.href}>{NavItemContent}</a>
                                            </Tooltip>
                                        ) : (
                                            <a href={hasChildren ? undefined : item.href}>{NavItemContent}</a>
                                        )}

                                        {!collapsed && hasChildren && isMenuOpen && (
                                            <div className="mt-1 ml-9 space-y-1 animate-slide-down">
                                                {item.children?.map((child, j) => (
                                                    <a
                                                        key={j}
                                                        href={child.href}
                                                        className={cn(
                                                            "block py-2 px-3 text-sm text-[var(--foreground-muted)] hover:text-[var(--primary)] transition-colors relative",
                                                            "before:content-[''] before:absolute before:left-[-1.5rem] before:top-1/2 before:w-1.5 before:h-1.5 before:border-l before:border-b before:border-[var(--border)]"
                                                        )}
                                                    >
                                                        {child.label}
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* User / Logout Section */}
            <div className="p-4 mt-auto border-t border-[var(--border)] shrink-0">
                {user && !collapsed ? (
                    <div className="flex items-center gap-3 p-2 rounded-[var(--radius-lg)] hover:bg-[var(--secondary)] transition-colors cursor-pointer group">
                        <Avatar src={user.avatar} name={user.name} size="sm" />
                        <div className="flex-1 min-w-0 overflow-hidden">
                            <p className="text-sm font-bold text-[var(--foreground)] truncate">{user.name}</p>
                            <p className="text-[10px] text-[var(--foreground-muted)] truncate">{user.email}</p>
                        </div>
                        <LogOut className="w-4 h-4 text-[var(--foreground-subtle)] group-hover:text-[var(--destructive)] transition-colors" />
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        {user && (
                            <Tooltip content={`${user.name} - Perfil`}>
                                <div className="cursor-pointer group">
                                    <Avatar src={user.avatar} name={user.name} size="sm" className="group-hover:ring-2 ring-[var(--primary)]" />
                                </div>
                            </Tooltip>
                        )}
                        <button className="p-2 text-[var(--foreground-muted)] hover:text-[var(--destructive)] transition-colors">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>

            {/* Collapse Trigger */}
            {collapsible && (
                <button
                    onClick={toggleCollapse}
                    className="absolute -right-3 top-24 w-6 h-6 rounded-full border border-[var(--border)] bg-[var(--card)] flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-all shadow-md z-10"
                >
                    {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
                </button>
            )}
        </aside>
    );
});

SidebarModern.displayName = 'SidebarModern';
