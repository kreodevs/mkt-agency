import { forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

export interface SettingsNavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    description?: string;
}

export interface SettingsLayoutProps {
    /** Items de navegación lateral */
    navigationItems: SettingsNavItem[];
    /** Título de la sección */
    title?: string;
    /** Subtítulo o descripción */
    subtitle?: string;
    /** Href del item activo */
    activeHref?: string;
    /** Contenido de la página de ajustes */
    children: ReactNode;
    /** Clases adicionales */
    className?: string;
}

/**
 * SettingsLayout - Layout especializado para páginas de perfil y configuración.
 * Proporciona una navegación vertical refinada ideal para sub-rutas administrativas.
 */
export const SettingsLayout = forwardRef<HTMLDivElement, SettingsLayoutProps>(({
    navigationItems,
    title = "Configuración",
    subtitle = "Gestiona las preferencias de tu cuenta y servicios.",
    activeHref,
    children,
    className
}, ref) => {
    return (
        <div ref={ref} className={cn("flex flex-col lg:flex-row gap-[var(--spacing-2xl)]", className)}>
            {/* Sidebar Navigation */}
            <aside className="w-full lg:w-80 shrink-0">
                <div className="mb-[var(--spacing-xl)]">
                    <h1 className="text-2xl font-black text-[var(--foreground)] tracking-tight">{title}</h1>
                    <p className="text-sm text-[var(--foreground-muted)] font-medium mt-[var(--spacing-xs)]">{subtitle}</p>
                </div>

                <nav className="flex flex-col gap-[var(--spacing-xs)]">
                    {navigationItems.map((item, idx) => {
                        const isActive = activeHref === item.href;
                        const Icon = item.icon;

                        return (
                            <a
                                key={idx}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-[var(--spacing-md)] px-[var(--spacing-md)] py-[var(--spacing-md)] rounded-[var(--radius-lg)] transition-all duration-200 group relative",
                                    isActive
                                        ? "bg-[var(--card)] border border-[var(--border)] shadow-sm text-[var(--primary)]"
                                        : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                                    isActive ? "bg-[var(--primary)]/10" : "bg-[var(--secondary)] group-hover:bg-[var(--background)]"
                                )}>
                                    <Icon className={cn("w-5 h-5", isActive ? "text-[var(--primary)]" : "text-[var(--foreground-subtle)]")} />
                                </div>

                                <div className="flex flex-col">
                                    <span className="font-bold text-sm tracking-tight">{item.label}</span>
                                    {item.description && <span className="text-[10px] text-[var(--foreground-subtle)] font-medium">{item.description}</span>}
                                </div>

                                {isActive && (
                                    <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                                )}
                            </a>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Settings Content */}
            <main className="flex-1 min-w-0">
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-2xl)] shadow-sm overflow-hidden">
                    {children}
                </div>
            </main>
        </div>
    );
});

SettingsLayout.displayName = 'SettingsLayout';
