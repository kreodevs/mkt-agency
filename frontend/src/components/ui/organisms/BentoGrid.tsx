import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface BentoGridProps {
    children?: ReactNode;
    className?: string;
    rows?: string; // e.g. "auto-rows-[18rem]"
}

export interface BentoGridItemProps {
    title?: ReactNode;
    description?: ReactNode;
    header?: ReactNode;
    icon?: ReactNode;
    className?: string;
    colSpan?: 1 | 2 | 3 | 4;
    rowSpan?: 1 | 2 | 3;
}

/**
 * BentoGrid - Un contenedor de cuadrícula asimétrico para mostrar funcionalidades o métricas.
 * Estilo popularizado por Apple y Vercel.
 */
export const BentoGrid = ({ children, className, rows = "md:auto-rows-[20rem]" }: BentoGridProps) => {
    return (
        <div
            className={cn(
                "grid grid-cols-1 md:grid-cols-4 gap-[var(--spacing-md)] max-w-7xl mx-auto",
                rows,
                className
            )}
        >
            {children}
        </div>
    );
};

export const BentoGridItem = ({
    title,
    description,
    header,
    icon,
    className,
    colSpan = 1,
    rowSpan = 1,
}: BentoGridItemProps) => {
    const spanClasses = {
        col: {
            1: "md:col-span-1",
            2: "md:col-span-2",
            3: "md:col-span-3",
            4: "md:col-span-4",
        },
        row: {
            1: "row-span-1",
            2: "row-span-2",
            3: "row-span-3",
        }
    }

    return (
        <div
            className={cn(
                "group/bento relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background-secondary)] hover:border-[var(--primary)]/30 transition-all duration-300 flex flex-col justify-between p-[var(--spacing-lg)]",
                spanClasses.col[colSpan],
                spanClasses.row[rowSpan],
                className
            )}
        >
            {/* Overlay de brillo en hover */}
            <div className="absolute inset-x-0 -top-px h-px w-full bg-gradient-to-r from-transparent via-[var(--primary)]/30 to-transparent opacity-0 group-hover/bento:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 to-transparent opacity-0 group-hover/bento:opacity-100 transition-opacity duration-300" />

            {header && (
                <div className="z-10 w-full mb-[var(--spacing-md)] flex-1 overflow-hidden rounded-md border border-[var(--border)]/30 bg-[var(--background)]/50">
                    {header}
                </div>
            )}

            <div className="z-10 transition-transform duration-300 group-hover/bento:translate-x-1">
                {icon && <div className="text-[var(--primary)] mb-[var(--spacing-sm)] transition-transform duration-300 group-hover/bento:scale-110 origin-left">{icon}</div>}
                <div className="font-bold text-[var(--foreground)] mt-[var(--spacing-sm)] tracking-tight text-lg">
                    {title}
                </div>
                <div className="font-normal text-[var(--foreground-muted)] text-sm mt-[var(--spacing-xs)] leading-relaxed">
                    {description}
                </div>
            </div>

            {/* Decoración sutil en la esquina */}
            <div className="absolute bottom-2 right-2 opacity-[0.03] group-hover/bento:opacity-[0.07] transition-opacity">
                {icon}
            </div>
        </div>
    );
};
