import * as React from "react"
import { Search, Command as CommandIcon } from "lucide-react"
import {
    CommandDialog,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandSeparator,
} from "./Command"
import { Button } from '../atoms/Button'
import { cn } from "@/lib/utils"

export interface SearchBarGlobalProps {
    items?: {
        group: string
        items: {
            label: string
            value: string
            icon?: React.ReactNode
            onSelect?: (value: string) => void
            shortcut?: string
        }[]
    }[]
    placeholder?: string
    className?: string
    triggerText?: string
}

export function SearchBarGlobal({
    items = [],
    placeholder = "Busca acciones, clientes, expedientes...",
    className,
    triggerText = "Buscar..."
}: SearchBarGlobalProps) {
    const [open, setOpen] = React.useState(false)

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    return (
        <>
            <Button
                variant="outline"
                className={cn(
                    "relative w-full justify-start text-sm text-[var(--foreground-muted)] sm:pr-12 md:w-40 lg:w-64 bg-[var(--background-secondary)] border-[var(--border)] hover:bg-[var(--secondary)]",
                    className
                )}
                onClick={() => setOpen(true)}
            >
                <Search className="mr-[var(--spacing-sm)] h-4 w-4" />
                <span className="hidden lg:inline-flex">{triggerText}</span>
                <span className="inline-flex lg:hidden">Buscar</span>
                <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-[var(--spacing-xs)] rounded border border-[var(--border)] bg-[var(--muted)] px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <CommandIcon className="w-3 h-3" /> K
                </kbd>
            </Button>

            <CommandDialog visible={open} onHide={() => setOpen(false)}>
                <CommandInput placeholder={placeholder} />
                <CommandList className="border-t border-[var(--border)]">
                    <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                    {items.map((group, idx) => (
                        <React.Fragment key={group.group}>
                            <CommandGroup heading={group.group}>
                                {group.items.map((item) => (
                                    <CommandItem
                                        key={item.value}
                                        onSelect={() => {
                                            item.onSelect?.(item.value)
                                            setOpen(false)
                                        }}
                                        className="flex items-center gap-[var(--spacing-sm)] px-[var(--spacing-md)] py-[var(--spacing-md)] cursor-pointer hover:bg-[var(--secondary)] transition-colors data-[selected=true]:bg-[var(--secondary)]"
                                    >
                                        {item.icon && <div className="text-[var(--primary)]">{item.icon}</div>}
                                        <span className="flex-1 font-medium">{item.label}</span>
                                        {item.shortcut && (
                                            <span className="text-xs text-[var(--foreground-subtle)] font-mono">
                                                {item.shortcut}
                                            </span>
                                        )}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                            {idx < items.length - 1 && <CommandSeparator />}
                        </React.Fragment>
                    ))}
                </CommandList>
            </CommandDialog>
        </>
    )
}

export default SearchBarGlobal
