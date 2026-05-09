import { forwardRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
    Search,
    Bell,
    Menu as MenuIcon,
    Moon,
    Sun,
    Maximize2
} from "lucide-react";
import { SidebarModern } from "./SidebarModern";
import type { SidebarGroup } from "./SidebarModern";
import { Button } from '../atoms/Button';

export interface AppLayoutProps {
    /** Grupos de navegación para el Sidebar */
    navigationGroups: SidebarGroup[];
    /** Contenido principal */
    children: React.ReactNode;
    /** Href activo para resaltar */
    activeHref?: string;
    /** Información del usuario */
    user?: {
        name: string;
        email: string;
        avatar?: string;
    };
    /** Acciones del header (derecha) */
    headerActions?: React.ReactNode;
    /** Logo o Marca para el header/sidebar */
    brand?: React.ReactNode;
    /** Clases adicionales */
    className?: string;
}

/**
 * AppLayout - Estructura maestra para aplicaciones dashboard.
 * Gestiona el Sidebar, el Header superior y el área de contenido principal scrollable.
 */
export const AppLayout = forwardRef<HTMLDivElement, AppLayoutProps>(({
    navigationGroups,
    children,
    activeHref,
    user,
    headerActions,
    brand,
    className
}, ref) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div ref={ref} className={cn("flex h-screen bg-[var(--background)] overflow-hidden", className)}>
            {/* Persistant Sidebar (Desktop) */}
            <SidebarModern
                groups={navigationGroups}
                activeHref={activeHref}
                user={user}
                brand={brand}
                onCollapsedChange={() => { }}
                className="hidden lg:flex shrink-0"
            />

            {/* Mobile Sidebar (Overlay) */}
            <div className={cn(
                "fixed inset-0 z-[var(--z-modal)] lg:hidden transition-opacity duration-300",
                mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}>
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
                <SidebarModern
                    groups={navigationGroups}
                    activeHref={activeHref}
                    user={user}
                    brand={brand}
                    collapsible={false}
                    className={cn(
                        "relative w-72 h-full transition-transform duration-300",
                        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                    )}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Header */}
                <header className="h-20 bg-[var(--card)] border-b border-[var(--border)] flex items-center justify-between px-6 shrink-0 z-20">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="lg:hidden p-2 rounded-[var(--radius)] text-[var(--foreground-muted)] hover:bg-[var(--secondary)]"
                        >
                            <MenuIcon className="w-5 h-5" />
                        </button>

                        {/* Breadcrumb / Search Trigger Placeholder */}
                        <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-[var(--radius-lg)] w-64 lg:w-96 text-[var(--foreground-subtle)] cursor-text hover:border-[var(--primary)]/50 transition-colors group">
                            <Search className="w-4 h-4 group-hover:text-[var(--primary)] transition-colors" />
                            <span className="text-sm font-medium">Buscar en la plataforma...</span>
                            <kbd className="ml-auto hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-[var(--secondary)] px-1.5 font-mono text-[10px] font-medium opacity-100">
                                <span className="text-xs">⌘</span>K
                            </kbd>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        {headerActions}

                        <div className="flex items-center gap-1 sm:gap-2 mr-2 border-r border-[var(--border)] pr-2 sm:pr-4">
                            <Button variant="ghost" size="icon" className="text-[var(--foreground-muted)] relative">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--primary)] rounded-full border-2 border-[var(--card)]" />
                            </Button>
                            <Button variant="ghost" size="icon" className="hidden sm:flex text-[var(--foreground-muted)] text-[var(--foreground-muted)]">
                                <Maximize2 className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Basic Mobile Header actions could go here */}
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="text-[var(--foreground-muted)]">
                                <Moon className="w-5 h-5 hidden dark:block" />
                                <Sun className="w-5 h-5 block dark:hidden" />
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Content Viewport */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar scroll-smooth">
                    <div className="max-w-[1600px] mx-auto animate-fade-in">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
});

AppLayout.displayName = 'AppLayout';
