import { useEffect, useState, forwardRef } from "react";
import {
    CommandDialog,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandShortcut,
    CommandSeparator
} from "./Command";
import {
    Search,
    type LucideIcon
} from "lucide-react";

export interface SearchAction {
    title: string;
    category: string;
    icon: LucideIcon;
    shortcut?: string;
    onSelect: () => void;
}

export interface GlobalSearchProps {
    /** Lista de acciones disponibles para búsqueda */
    actions: SearchAction[];
    /** Texto del input */
    placeholder?: string;
    /** Estado de visibilidad (vía props si se desea controlar externamente) */
    visible?: boolean;
    /** Callback cuando cambia el estado */
    onHide?: () => void;
}

/**
 * GlobalSearch - Un "Command Palette" premium para navegación rápida.
 * Atajo de teclado: Cmd/Ctrl + K. Estética minimalista y corporativa.
 */
export const GlobalSearch = forwardRef<HTMLDivElement, GlobalSearchProps>(({
    actions,
    placeholder = "Busca comandos, páginas o archivos...",
    visible: controlledVisible,
    onHide
}, _ref) => {
    const [internalVisible, setInternalVisible] = useState(false);
    const visible = controlledVisible !== undefined ? controlledVisible : internalVisible;

    const setVisible = (val: boolean) => {
        if (!val && onHide) {
            onHide();
        }
        setInternalVisible(val);
    };

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setVisible(!visible);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [visible, onHide]);

    // Agrupar acciones por categoría
    const categories = Array.from(new Set(actions.map(a => a.category)));

    return (
        <CommandDialog
            visible={visible}
            onHide={() => setVisible(false)}
            className="max-w-2xl bg-[var(--popover)] border-[var(--border)] overflow-hidden rounded-2xl shadow-gold"
        >
            <CommandInput
                placeholder={placeholder}
                className="h-14 border-none focus:ring-0 text-base"
            />
            <CommandList className="max-h-[450px] custom-scrollbar">
                <CommandEmpty className="py-[var(--spacing-2xl)] flex flex-col items-center gap-[var(--spacing-md)]">
                    <Search className="w-10 h-10 text-[var(--foreground-subtle)] opacity-20" />
                    <p className="text-[var(--foreground-muted)] font-medium">No se encontraron resultados para tu búsqueda.</p>
                </CommandEmpty>

                {categories.map((cat, idx) => (
                    <div key={cat}>
                        {idx > 0 && <CommandSeparator className="bg-[var(--border)]/50" />}
                        <CommandGroup
                            heading={cat}
                            className="px-[var(--spacing-md)] pt-[var(--spacing-md)] pb-[var(--spacing-sm)] text-[10px] font-black uppercase tracking-[0.2em] text-[var(--primary)]"
                        >
                            {actions
                                .filter(a => a.category === cat)
                                .map((action, i) => {
                                    const Icon = action.icon;
                                    return (
                                        <CommandItem
                                            key={i}
                                            onSelect={() => {
                                                action.onSelect();
                                                setVisible(false);
                                            }}
                                            className="group flex items-center gap-[var(--spacing-md)] px-[var(--spacing-md)] py-[var(--spacing-md)] rounded-xl hover:bg-[var(--secondary)] cursor-pointer transition-all data-[selected=true]:bg-[var(--secondary)]"
                                        >
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--background)] border border-[var(--border)] group-hover:border-[var(--primary)]/30 transition-colors">
                                                <Icon className="h-5 w-5 text-[var(--foreground-muted)] group-hover:text-[var(--primary)]" />
                                            </div>
                                            <div className="flex flex-1 flex-col justify-center">
                                                <span className="text-sm font-bold text-[var(--foreground)]">{action.title}</span>
                                            </div>
                                            {action.shortcut && (
                                                <CommandShortcut className="hidden sm:inline-flex px-1.5 py-[var(--spacing-xxs)] rounded border border-[var(--border)] bg-[var(--background)] text-[10px] font-mono group-hover:bg-[var(--card)]">
                                                    {action.shortcut}
                                                </CommandShortcut>
                                            )}
                                        </CommandItem>
                                    );
                                })
                            }
                        </CommandGroup>
                    </div>
                ))}

                <div className="p-[var(--spacing-md)] bg-[var(--secondary)]/30 border-t border-[var(--border)] flex items-center justify-between text-[10px] font-bold text-[var(--foreground-subtle)] uppercase tracking-widest">
                    <div className="flex gap-[var(--spacing-md)]">
                        <span className="flex items-center gap-[var(--spacing-xs)]"><kbd className="px-[var(--spacing-xs)] py-[var(--spacing-xxs)] rounded bg-[var(--background)] border">↑↓</kbd> Navegar</span>
                        <span className="flex items-center gap-[var(--spacing-xs)]"><kbd className="px-[var(--spacing-xs)] py-[var(--spacing-xxs)] rounded bg-[var(--background)] border">↵</kbd> Seleccionar</span>
                    </div>
                    <span>Atajo: <kbd className="px-[var(--spacing-xs)] py-[var(--spacing-xxs)] rounded bg-[var(--background)] border">ESC</kbd> para cerrar</span>
                </div>
            </CommandList>
        </CommandDialog>
    );
});

GlobalSearch.displayName = 'GlobalSearch';
