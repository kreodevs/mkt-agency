import { forwardRef, useCallback, useMemo, useState } from 'react'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core'
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
    ChevronRight,
    ChevronLeft,
    ChevronsRight,
    ChevronsLeft,
    GripVertical,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TransferListProps {
    source?: any[]
    target?: any[]
    onChange?: (e: { source: any[]; target: any[] }) => void
    sourceHeader?: string
    targetHeader?: string
    className?: string
    error?: string
    label?: string
}

// ── Item render helper ────────────────────────────────────

function itemLabel(item: any): string {
    if (typeof item === 'string') return item
    if (typeof item === 'number') return String(item)
    return item?.label ?? item?.name ?? String(item)
}

// ── Draggable Sortable Item ───────────────────────────────

interface DraggableItemProps {
    id: string
    label: string
    selected: boolean
    onSelect: (id: string, metaKey: boolean) => void
}

function DraggableItem({ id, label, selected, onSelect }: DraggableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            aria-selected={selected}
            onClick={(e) => onSelect(id, e.metaKey || e.ctrlKey)}
            className={cn(
                'flex items-center gap-2 px-[var(--spacing-md)] py-[var(--spacing-md)] text-sm border-b border-[var(--border)] last:border-b-0 transition-colors cursor-pointer select-none',
                selected && 'bg-[var(--accent)] text-[var(--accent-foreground)]',
                !selected && 'hover:bg-[var(--secondary)]',
                isDragging && 'opacity-50 shadow-[var(--shadow-md)]'
            )}
            {...attributes}
            {...listeners}
        >
            <GripVertical className="w-3.5 h-3.5 shrink-0 text-[var(--foreground-muted)]" />
            <span className="truncate">{label}</span>
        </div>
    )
}

// ── Draggable List ────────────────────────────────────────

interface DraggableListProps {
    items: any[]
    ids: string[]
    prefix: string
    selectedSet: Set<string>
    onSelect: (id: string, metaKey: boolean) => void
}

function DraggableList({ items, ids, prefix, selectedSet, onSelect }: DraggableListProps) {
    return (
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            {items.map((item, i) => {
                const id = `${prefix}-${i}`
                return (
                    <DraggableItem
                        key={id}
                        id={id}
                        label={itemLabel(item)}
                        selected={selectedSet.has(id)}
                        onSelect={onSelect}
                    />
                )
            })}
        </SortableContext>
    )
}

// ── Button ────────────────────────────────────────────────

interface TransferButtonProps {
    onClick: () => void
    disabled: boolean
    children: React.ReactNode
    label: string
}

function TransferButton({ onClick, disabled, children, label }: TransferButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            title={label}
            className={cn(
                'inline-flex items-center justify-center w-9 h-9 rounded-[var(--radius)] transition-colors',
                'text-[var(--foreground)] hover:bg-[var(--secondary)]',
                'disabled:opacity-30 disabled:cursor-not-allowed',
                'focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none'
            )}
        >
            {children}
        </button>
    )
}

// ── Transfer List ─────────────────────────────────────────

export const TransferList = forwardRef<HTMLDivElement, TransferListProps>(
    (
        {
            source = [],
            target = [],
            onChange,
            sourceHeader,
            targetHeader,
            className,
            error,
            label,
        },
        ref
    ) => {
        // ── Selection state (internal) ────────────────────
        const [sourceSelected, setSourceSelected] = useState<Set<string>>(new Set())
        const [targetSelected, setTargetSelected] = useState<Set<string>>(new Set())

        // ── Stable sortable IDs ───────────────────────────
        const sourceIds = useMemo(
            () => source.map((_, i) => `s-${i}`),
            [source]
        )
        const targetIds = useMemo(
            () => target.map((_, i) => `t-${i}`),
            [target]
        )

        // ── Reset selection when items change ─────────────
        const resetSelections = useCallback(() => {
            setSourceSelected(new Set())
            setTargetSelected(new Set())
        }, [])

        // ── Select handlers ──────────────────────────────
        const handleSourceSelect = useCallback(
            (id: string, metaKey: boolean) => {
                setSourceSelected((prev) => {
                    const next = new Set(prev)
                    if (next.has(id)) {
                        if (metaKey) next.delete(id)
                        else next.clear()
                    } else {
                        if (!metaKey) next.clear()
                        next.add(id)
                    }
                    return next
                })
                setTargetSelected(new Set())
            },
            []
        )

        const handleTargetSelect = useCallback(
            (id: string, metaKey: boolean) => {
                setTargetSelected((prev) => {
                    const next = new Set(prev)
                    if (next.has(id)) {
                        if (metaKey) next.delete(id)
                        else next.clear()
                    } else {
                        if (!metaKey) next.clear()
                        next.add(id)
                    }
                    return next
                })
                setSourceSelected(new Set())
            },
            []
        )

        // ── Move helpers ─────────────────────────────────
        const moveSelected = useCallback(
            (from: any[], _to: any[], selectedSet: Set<string>, prefix: string) => {
                const selectedIndices = new Set(
                    [...selectedSet].map((id) => parseInt(id.slice(prefix.length + 1), 10))
                )
                const moved: any[] = []
                const remaining: any[] = []
                from.forEach((item, i) => {
                    if (selectedIndices.has(i)) {
                        moved.push(item)
                    } else {
                        remaining.push(item)
                    }
                })
                return { remaining, moved }
            },
            []
        )

        const moveOne = useCallback(
            (from: any[], to: any[]) => {
                if (from.length === 0) return null
                const [item, ...rest] = from
                return { from: rest, to: [...to, item] }
            },
            []
        )

        // ── Move handlers ─────────────────────────────────
        const handleMoveToTarget = useCallback(() => {
            if (!onChange) return
            if (sourceSelected.size > 0) {
                const { remaining, moved } = moveSelected(
                    source,
                    target,
                    sourceSelected,
                    's'
                )
                onChange({ source: remaining, target: [...target, ...moved] })
                resetSelections()
            } else {
                const result = moveOne(source, target)
                if (result) {
                    onChange({ source: result.from, target: result.to })
                }
            }
        }, [onChange, source, target, sourceSelected, moveSelected, moveOne, resetSelections])

        const handleMoveToSource = useCallback(() => {
            if (!onChange) return
            if (targetSelected.size > 0) {
                const { remaining, moved } = moveSelected(
                    target,
                    source,
                    targetSelected,
                    't'
                )
                onChange({ source: [...source, ...moved], target: remaining })
                resetSelections()
            } else {
                const result = moveOne(target, source)
                if (result) {
                    onChange({ source: result.to, target: result.from })
                }
            }
        }, [onChange, source, target, targetSelected, moveSelected, moveOne, resetSelections])

        const handleMoveAllToTarget = useCallback(() => {
            if (!onChange || source.length === 0) return
            onChange({ source: [], target: [...target, ...source] })
            resetSelections()
        }, [onChange, source, target, resetSelections])

        const handleMoveAllToSource = useCallback(() => {
            if (!onChange || target.length === 0) return
            onChange({ source: [...source, ...target], target: [] })
            resetSelections()
        }, [onChange, source, target, resetSelections])

        // ── DnD sensors ──────────────────────────────────
        const sensors = useSensors(
            useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
            useSensor(KeyboardSensor, {
                coordinateGetter: sortableKeyboardCoordinates,
            })
        )

        // ── DnD handler ───────────────────────────────────
        const handleDragEnd = useCallback(
            (event: DragEndEvent) => {
                const { active, over } = event
                if (!over || active.id === over.id) return

                const activeStr = String(active.id)
                const overStr = String(over.id)
                const isSource = activeStr.startsWith('s-')

                const oldIndex = parseInt(activeStr.slice(2), 10)
                const newIndex = parseInt(overStr.slice(2), 10)
                if (isNaN(oldIndex) || isNaN(newIndex)) return

                const newList = [...(isSource ? source : target)]
                const [moved] = newList.splice(oldIndex, 1)
                newList.splice(newIndex, 0, moved)

                const result = isSource
                    ? { source: newList, target }
                    : { source, target: newList }

                onChange?.(result)
            },
            [onChange, source, target]
        )

        // ── Render ────────────────────────────────────────
        return (
            <div ref={ref} className={cn('flex flex-col gap-1.5 w-full', className)}>
                {label && (
                    <label className="text-sm font-medium leading-none text-[var(--foreground)]">
                        {label}
                    </label>
                )}

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex md:flex-row flex-col gap-[var(--spacing-md)] items-stretch">
                        {/* ── Source List ──────────────────── */}
                        <div className="flex-1 border border-[var(--border)] rounded-[var(--radius)] overflow-hidden bg-[var(--background)] shadow-sm">
                            {sourceHeader && (
                                <div className="bg-[var(--secondary)] px-[var(--spacing-md)] py-[var(--spacing-md)] text-sm font-semibold border-b border-[var(--border)] text-[var(--foreground)]">
                                    {sourceHeader}
                                    <span className="ml-2 text-xs font-normal text-[var(--foreground-muted)]">
                                        ({source.length})
                                    </span>
                                </div>
                            )}
                            <div
                                role="listbox"
                                className="min-h-[200px] max-h-[320px] overflow-y-auto"
                            >
                                {source.length === 0 ? (
                                    <div className="flex items-center justify-center h-[200px] text-sm text-[var(--foreground-muted)]">
                                        No items available
                                    </div>
                                ) : (
                                    <DraggableList
                                        items={source}
                                        ids={sourceIds}
                                        prefix="s"
                                        selectedSet={sourceSelected}
                                        onSelect={handleSourceSelect}
                                    />
                                )}
                            </div>
                        </div>

                        {/* ── Control Buttons ─────────────── */}
                        <div className="flex md:flex-col items-center justify-center gap-[var(--spacing-sm)]">
                            <TransferButton
                                onClick={handleMoveToTarget}
                                disabled={source.length === 0}
                                label="Move selected to target"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </TransferButton>
                            <TransferButton
                                onClick={handleMoveToSource}
                                disabled={target.length === 0}
                                label="Move selected to source"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </TransferButton>
                            <TransferButton
                                onClick={handleMoveAllToTarget}
                                disabled={source.length === 0}
                                label="Move all to target"
                            >
                                <ChevronsRight className="w-4 h-4" />
                            </TransferButton>
                            <TransferButton
                                onClick={handleMoveAllToSource}
                                disabled={target.length === 0}
                                label="Move all to source"
                            >
                                <ChevronsLeft className="w-4 h-4" />
                            </TransferButton>
                        </div>

                        {/* ── Target List ─────────────────── */}
                        <div className="flex-1 border border-[var(--border)] rounded-[var(--radius)] overflow-hidden bg-[var(--background)] shadow-sm">
                            {targetHeader && (
                                <div className="bg-[var(--secondary)] px-[var(--spacing-md)] py-[var(--spacing-md)] text-sm font-semibold border-b border-[var(--border)] text-[var(--foreground)]">
                                    {targetHeader}
                                    <span className="ml-2 text-xs font-normal text-[var(--foreground-muted)]">
                                        ({target.length})
                                    </span>
                                </div>
                            )}
                            <div
                                role="listbox"
                                className="min-h-[200px] max-h-[320px] overflow-y-auto"
                            >
                                {target.length === 0 ? (
                                    <div className="flex items-center justify-center h-[200px] text-sm text-[var(--foreground-muted)]">
                                        No items selected
                                    </div>
                                ) : (
                                    <DraggableList
                                        items={target}
                                        ids={targetIds}
                                        prefix="t"
                                        selectedSet={targetSelected}
                                        onSelect={handleTargetSelect}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </DndContext>

                {error && (
                    <span className="text-[14px] text-[var(--destructive)]">{error}</span>
                )}
            </div>
        )
    }
)
TransferList.displayName = 'TransferList'
