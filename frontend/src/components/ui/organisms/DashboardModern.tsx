import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "../atoms/Skeleton";

export interface DashboardModernProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
    /** Estado de carga: muestra un skeleton grid de 4 KPI cards + 2 chart panels */
    loading?: boolean;
}

/**
 * DashboardModern - Un contenedor premium para dashboards ejecutivos.
 * Proporciona una estructura de rejilla visualmente equilibrada para métricas y gráficos.
 */
export const DashboardModern = forwardRef<HTMLDivElement, DashboardModernProps>(({
    title,
    description,
    actions,
    children,
    className,
    loading = false
}, ref) => {
    if (loading) {
        return (
            <div ref={ref} className={cn("space-y-[var(--spacing-xl)]", className)}>
                {/* Skeleton Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-[var(--spacing-md)]">
                    <div className="space-y-[var(--spacing-sm)]">
                        <Skeleton width="240px" height="2.25rem" animation="pulse" />
                        {description && <Skeleton width="180px" height="1rem" animation="pulse" />}
                    </div>
                    {actions && (
                        <div className="flex items-center gap-[var(--spacing-md)]">
                            <Skeleton width="100px" height="2.5rem" variant="rounded" animation="pulse" />
                        </div>
                    )}
                </div>

                {/* Skeleton KPI Cards Grid — 4 cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[var(--spacing-lg)]">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="rounded-[var(--radius-2xl)] bg-[var(--card)] border border-[var(--border)] p-[var(--spacing-lg)] shadow-sm space-y-[var(--spacing-md)]"
                        >
                            <div className="flex items-center justify-between">
                                <Skeleton width="80px" height="0.875rem" animation="pulse" />
                                <Skeleton width="2rem" height="2rem" variant="circular" animation="pulse" />
                            </div>
                            <div className="space-y-[var(--spacing-sm)]">
                                <Skeleton width="140px" height="2rem" animation="pulse" />
                                <Skeleton width="100px" height="0.875rem" animation="pulse" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Skeleton Chart Panels — 2 full-width panels */}
                <div className="space-y-[var(--spacing-lg)]">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <div
                            key={i}
                            className="rounded-[var(--radius-2xl)] bg-[var(--card)] border border-[var(--border)] shadow-sm overflow-hidden"
                        >
                            {/* Chart Header Bar */}
                            <div className="flex items-center justify-between px-[var(--spacing-lg)] py-[var(--spacing-md)] border-b border-[var(--border)]">
                                <Skeleton width="160px" height="1rem" animation="pulse" />
                                <div className="flex items-center gap-[var(--spacing-md)]">
                                    <Skeleton width="80px" height="1.75rem" variant="rounded" animation="pulse" />
                                    <Skeleton width="80px" height="1.75rem" variant="rounded" animation="pulse" />
                                </div>
                            </div>
                            {/* Chart Area ~200px h */}
                            <div className="p-[var(--spacing-lg)]">
                                <Skeleton
                                    variant="rounded"
                                    height="200px"
                                    animation="pulse"
                                    className="rounded-[var(--radius)]"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div ref={ref} className={cn("space-y-[var(--spacing-xl)]", className)}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-[var(--spacing-md)]">
                <div>
                    <h1 className="text-4xl font-black text-[var(--foreground)] tracking-tight">{title}</h1>
                    {description && <p className="text-[var(--foreground-muted)] font-medium mt-[var(--spacing-xs)]">{description}</p>}
                </div>
                <div className="flex items-center gap-[var(--spacing-md)]">
                    {actions}
                </div>
            </div>

            {children}
        </div>
    );
});

/**
 * DashboardSection - Una sección lógica dentro del dashboard.
 */
export const DashboardSection = ({ title, children, className }: { title?: string, children: React.ReactNode, className?: string }) => (
    <div className={cn("space-y-[var(--spacing-md)]", className)}>
        {title && (
            <h2 className="text-[10px] font-black uppercase text-[var(--foreground-subtle)] tracking-[0.2em] ml-[var(--spacing-xs)]">
                {title}
            </h2>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[var(--spacing-lg)]">
            {children}
        </div>
    </div>
);

DashboardModern.displayName = 'DashboardModern';
