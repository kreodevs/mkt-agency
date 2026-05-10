import { useState, forwardRef } from "react";
import { cn } from "@/lib/utils";
import {
    Search,
    X,
    ChevronDown,
    ChevronUp,
    Save,
    RotateCcw,
    SlidersHorizontal
} from "lucide-react";
import { Button } from '../atoms/Button';
import { InputText } from '../atoms/InputText';
import { Skeleton } from '../atoms/Skeleton';

export interface FilterField {
    id: string;
    label: string;
    type: 'text' | 'select' | 'date' | 'multi-select';
    placeholder?: string;
    options?: { label: string; value: any }[];
    component?: React.ReactNode; // For custom components
}

export interface AdvancedFilterBarProps {
    /** Fields to display in the filter bar */
    fields: FilterField[];
    /** Values of the filters */
    values: Record<string, any>;
    /** Callback when values change */
    onChange: (values: Record<string, any>) => void;
    /** Callback when search is triggered */
    onSearch?: (values: Record<string, any>) => void;
    /** Callback to clear all filters */
    onClear?: () => void;
    /** Callback to save the current view */
    onSaveView?: (values: Record<string, any>) => void;
    /** Whether to show the collapsible advanced filters */
    showAdvanced?: boolean;
    /** Title for the filter section (mobile or expanded) */
    title?: string;
    /** Loading state — renders skeleton placeholder controls */
    loading?: boolean;
    /** Additional classes */
    className?: string;
}

/**
 * AdvancedFilterBar - Barra de filtrado premium y sofisticada.
 * Soporta búsqueda global, filtros rápidos y un panel expandible de filtros avanzados.
 */
export const AdvancedFilterBar = forwardRef<HTMLDivElement, AdvancedFilterBarProps>(({
    fields,
    values,
    onChange,
    onSearch,
    onClear,
    onSaveView,
    showAdvanced: initialShowAdvanced = false,
    title = "Filtros Avanzados",
    loading = false,
    className
}, ref) => {
    const [isExpanded, setIsExpanded] = useState(initialShowAdvanced);
    const activeFiltersCount = Object.values(values).filter(v => v !== undefined && v !== '' && (Array.isArray(v) ? v.length > 0 : true)).length;

    const handleFieldChange = (id: string, value: any) => {
        onChange({ ...values, [id]: value });
    };

    // ──────────────────────────────────────────────
    // Loading state: skeleton placeholder controls
    // ──────────────────────────────────────────────
    if (loading) {
        return (
            <div ref={ref} className={cn("bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-2xl)] shadow-sm overflow-hidden", className)}>
                {/* Search bar skeleton */}
                <div className="p-[var(--spacing-md)] flex flex-col md:flex-row items-center gap-[var(--spacing-md)] border-b border-[var(--border)]/50 bg-[var(--secondary)]/10">
                    <div className="relative flex-1 w-full max-w-xl">
                        <Skeleton variant="rounded" width="100%" height="2.75rem" animation="pulse" />
                    </div>
                    <div className="flex items-center gap-[var(--spacing-sm)] w-full md:w-auto">
                        {/* Filtros button skeleton */}
                        <Skeleton variant="rounded" width="6.5rem" height="2.75rem" animation="pulse" />
                        {/* Divider skeleton */}
                        <Skeleton variant="rounded" width="1px" height="1.5rem" animation="pulse" />
                        {/* Save view skeleton */}
                        <Skeleton variant="rounded" width="8rem" height="2.75rem" animation="pulse" />
                        {/* Clear button skeleton */}
                        <Skeleton variant="rounded" width="2.75rem" height="2.75rem" animation="pulse" />
                        {/* Apply button skeleton */}
                        <Skeleton variant="rounded" width="5rem" height="2.75rem" animation="pulse" />
                    </div>
                </div>

                {/* Filter pills skeleton — 3 bars */}
                <div className="p-[var(--spacing-lg)] space-y-[var(--spacing-md)]">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="space-y-[var(--spacing-sm)]">
                            <Skeleton width="30%" height="0.625rem" animation="pulse" />
                            <Skeleton variant="rounded" width="100%" height="2.5rem" animation="pulse" />
                        </div>
                    ))}
                    {/* Button bar skeleton */}
                    <div className="flex items-center justify-between pt-[var(--spacing-sm)]">
                        <Skeleton width="6rem" height="0.75rem" animation="pulse" />
                        <div className="flex gap-[var(--spacing-sm)]">
                            <Skeleton variant="rounded" width="6rem" height="2.25rem" animation="pulse" />
                            <Skeleton variant="rounded" width="7rem" height="2.25rem" animation="pulse" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div ref={ref} className={cn("bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-2xl)] shadow-sm overflow-hidden transition-all duration-300", className)}>
            {/* Top Bar: Global Search & Quick Actions */}
            <div className="p-[var(--spacing-md)] flex flex-col md:flex-row items-center gap-[var(--spacing-md)] border-b border-[var(--border)]/50 bg-[var(--secondary)]/10">
                <div className="relative flex-1 w-full max-w-xl">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
                    <InputText
                        placeholder="Búsqueda global rápida..."
                        className="w-full pl-[var(--spacing-2xl)] h-11 bg-[var(--background)] border-[var(--border)] rounded-[var(--radius-lg)]"
                        value={values.global || ''}
                        onChange={(e) => handleFieldChange('global', e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-[var(--spacing-sm)] w-full md:w-auto overflow-x-auto no-scrollbar py-[var(--spacing-xs)]">
                    <Button
                        variant={isExpanded ? "default" : "secondary"}
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="gap-[var(--spacing-sm)] shrink-0 h-11 px-[var(--spacing-lg)] rounded-[var(--radius-lg)]"
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span className="hidden sm:inline">Filtros</span>
                        {activeFiltersCount > 0 && (
                            <span className="ml-[var(--spacing-xs)] w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                                {activeFiltersCount}
                            </span>
                        )}
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>

                    <div className="w-px h-6 bg-[var(--border)] mx-[var(--spacing-xs)] hidden sm:block" />

                    {onSaveView && (
                        <Button variant="ghost" size="sm" onClick={() => onSaveView(values)} className="gap-[var(--spacing-sm)] h-11 px-[var(--spacing-md)] rounded-[var(--radius-lg)] text-[var(--foreground-muted)]">
                            <Save className="w-4 h-4" />
                            <span className="hidden lg:inline">Guardar Vista</span>
                        </Button>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClear}
                        className="h-11 w-11 rounded-[var(--radius-lg)] text-[var(--foreground-muted)] hover:text-[var(--destructive)]"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </Button>

                    <Button onClick={() => onSearch?.(values)} className="h-11 px-[var(--spacing-lg)] rounded-[var(--radius-lg)] font-black uppercase tracking-widest text-[10px]">
                        Aplicar
                    </Button>
                </div>
            </div>

            {/* Advanced Filters Panel */}
            {isExpanded && (
                <div className="p-[var(--spacing-lg)] bg-[var(--card)] animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between mb-[var(--spacing-xl)] border-b border-[var(--border)] pb-[var(--spacing-md)]">
                        <h3 className="text-sm font-black uppercase text-[var(--foreground)] tracking-[0.1em]">{title}</h3>
                        <Button variant="ghost" size="icon" onClick={() => setIsExpanded(false)} className="h-8 w-8">
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[var(--spacing-lg)]">
                        {fields.map((field) => (
                            <div key={field.id} className="space-y-[var(--spacing-sm)]">
                                <label className="text-[10px] font-black uppercase text-[var(--foreground-subtle)] tracking-[0.2em] ml-[var(--spacing-xs)]">
                                    {field.label}
                                </label>
                                <div className="relative">
                                    {field.component || (
                                        <InputText
                                            id={field.id}
                                            placeholder={field.placeholder || `Filtrar por ${field.label.toLowerCase()}...`}
                                            value={values[field.id] || ''}
                                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                            className="w-full h-10 bg-[var(--background)]/50 border-[var(--border)] rounded-[var(--radius-md)] text-sm"
                                        />
                                    )}
                                    {values[field.id] && values[field.id] !== '' && (
                                        <button
                                            onClick={() => handleFieldChange(field.id, '')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-[var(--spacing-xs)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-[var(--spacing-xl)] pt-[var(--spacing-lg)] border-t border-[var(--border)] flex items-center justify-between">
                        <div className="flex gap-[var(--spacing-md)]">
                            <span className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest">
                                {activeFiltersCount} filtros activos
                            </span>
                        </div>
                        <div className="flex gap-[var(--spacing-sm)]">
                            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)} className="text-[var(--foreground-muted)]">
                                Cerrar Panel
                            </Button>
                            <Button size="sm" onClick={() => onSearch?.(values)} className="px-[var(--spacing-xl)]">
                                Refinar Búsqueda
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

AdvancedFilterBar.displayName = 'AdvancedFilterBar';
