import React, { useState, useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Plus, GripVertical, Inbox } from 'lucide-react'
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragStartEvent,
    type DragEndEvent,
    type DragOverEvent,
    type UniqueIdentifier,
} from '@dnd-kit/core'
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

export interface KanbanCardData {
    id: string
    title: string
    description?: string
    status?: string
    [key: string]: any
}

export interface KanbanColumnData {
    id: string
    title: string
    cards: KanbanCardData[]
}

export interface KanbanBoardProps {
    columns: KanbanColumnData[]
    onCardMove?: (cardId: string, sourceColId: string, destColId: string, newIndex: number) => void
    onAddCard?: (colId: string) => void
    customCardRenderer?: (card: KanbanCardData) => React.ReactNode
    emptyState?: React.ReactNode
    loading?: boolean
    loadingSkeletonCount?: number
    className?: string
    columnClassName?: string
    cardClassName?: string
}

// ─────────────────────────────────────────────────────────
// KanbanCard
// ─────────────────────────────────────────────────────────

interface KanbanCardWrapperProps {
    card: KanbanCardData
    isDragging: boolean
    customRenderer?: (card: KanbanCardData) => React.ReactNode
    className?: string
}

const DefaultCardRenderer = ({ card }: { card: KanbanCardData }) => (
    <>
        <div className="flex items-start gap-2">
            <GripVertical className="w-3.5 h-3.5 text-[var(--foreground-subtle)] shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-[var(--foreground)] mb-1 leading-snug">
                    {card.title}
                </div>
                {card.description && (
                    <div className="text-xs text-[var(--foreground-muted)] line-clamp-2 leading-relaxed">
                        {card.description}
                    </div>
                )}
            </div>
        </div>
        {card.status && (
            <div className="mt-2 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--foreground-subtle)]">
                    {card.status}
                </span>
            </div>
        )}
    </>
)

const SortableCard = ({ card, customRenderer, className }: Omit<KanbanCardWrapperProps, 'isDragging'>) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: card.id,
        data: { type: 'card', card },
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'bg-[var(--background)] rounded-lg shadow-sm border border-[var(--border)] transition-all',
                isDragging
                    ? 'opacity-40 ring-2 ring-[var(--primary)] shadow-lg z-50'
                    : 'hover:border-[var(--primary)]/40 hover:shadow-md active:border-[var(--primary)]',
                className
            )}
            {...attributes}
            {...listeners}
        >
            <div className="p-3.5">
                {customRenderer ? customRenderer(card) : <DefaultCardRenderer card={card} />}
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────
// KanbanColumn
// ─────────────────────────────────────────────────────────

interface KanbanColumnProps {
    column: KanbanColumnData
    onAddCard?: (colId: string) => void
    customCardRenderer?: (card: KanbanCardData) => React.ReactNode
    cardClassName?: string
    isOver: boolean
}

const KanbanColumn = ({ column, onAddCard, customCardRenderer, cardClassName, isOver }: KanbanColumnProps) => {
    const cardIds = useMemo(() => column.cards.map(c => c.id), [column.cards])

    return (
        <div
            className={cn(
                'flex flex-col min-w-[300px] w-[300px] rounded-xl transition-all duration-200',
                'bg-[var(--secondary)] border border-[var(--border)] shadow-sm',
                isOver && 'ring-2 ring-[var(--primary)]/40 border-[var(--primary)]/30'
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]/60">
                <div className="flex items-center gap-2.5">
                    <h3 className="font-semibold text-sm text-[var(--foreground)] tracking-tight">
                        {column.title}
                    </h3>
                    <span className="text-xs font-semibold text-[var(--foreground-muted)] bg-[var(--background)] px-2.5 py-0.5 rounded-full border border-[var(--border)]">
                        {column.cards.length}
                    </span>
                </div>
            </div>

            {/* Cards area */}
            <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-2.5 p-3 overflow-y-auto min-h-[80px] flex-1">
                    {column.cards.length > 0 ? (
                        column.cards.map((card) => (
                            <SortableCard
                                key={card.id}
                                card={card}
                                customRenderer={customCardRenderer}
                                className={cardClassName}
                            />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Inbox className="w-8 h-8 text-[var(--foreground-subtle)] mb-2 opacity-40" />
                            <p className="text-xs text-[var(--foreground-subtle)] font-medium">
                                Sin tarjetas
                            </p>
                        </div>
                    )}
                </div>
            </SortableContext>

            {/* Add button */}
            <div className="px-3 pb-3">
                <button
                    onClick={() => onAddCard?.(column.id)}
                    className="flex items-center justify-center gap-1.5 w-full text-sm font-medium text-[var(--foreground-muted)] py-2 rounded-lg transition-colors hover:text-[var(--foreground)] hover:bg-[var(--background)] border border-transparent hover:border-[var(--border)]"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Card</span>
                </button>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────
// Loading Skeleton
// ─────────────────────────────────────────────────────────

const KanbanSkeleton = ({ count = 3 }: { count: number }) => (
    <div className="flex gap-[var(--spacing-lg)] overflow-x-auto pb-[var(--spacing-md)]">
        {Array.from({ length: count }).map((_, i) => (
            <div
                key={i}
                className="flex flex-col min-w-[300px] w-[300px] rounded-xl bg-[var(--secondary)] border border-[var(--border)] shadow-sm animate-pulse"
            >
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--border)]/60">
                    <div className="h-4 w-24 rounded bg-[var(--muted)]" />
                    <div className="h-5 w-7 rounded-full bg-[var(--muted)]" />
                </div>
                <div className="flex flex-col gap-2.5 p-3">
                    {Array.from({ length: 3 }).map((_, j) => (
                        <div key={j} className="p-3.5 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                            <div className="h-3.5 w-3/4 rounded bg-[var(--muted)] mb-2" />
                            <div className="h-3 w-1/2 rounded bg-[var(--muted)]" />
                        </div>
                    ))}
                </div>
            </div>
        ))}
    </div>
)

// ─────────────────────────────────────────────────────────
// Main KanbanBoard Component
// ─────────────────────────────────────────────────────────

export const KanbanBoard = ({
    columns: initialColumns,
    onCardMove,
    onAddCard,
    customCardRenderer,
    emptyState,
    loading = false,
    loadingSkeletonCount = 3,
    className,
    cardClassName,
}: KanbanBoardProps) => {
    const [, setColumns] = useState(initialColumns)
    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
    const [overColumnId, setOverColumnId] = useState<string | null>(null)

    // Keep internal state in sync with external prop
    const currentColumns = initialColumns

    // Find which column a card belongs to
    const findColumnOfCard = useCallback(
        (cardId: string): string | null => {
            for (const col of currentColumns) {
                if (col.cards.some(c => c.id === cardId)) return col.id
            }
            return null
        },
        [currentColumns]
    )

    // Sensors for pointer + keyboard
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 }, // 5px drag threshold
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // Find active card data
    const activeCard = useMemo(() => {
        if (!activeId) return null
        for (const col of currentColumns) {
            const card = col.cards.find(c => c.id === activeId)
            if (card) return { card, columnId: col.id }
        }
        return null
    }, [activeId, currentColumns])

    const handleDragStart = useCallback(
        (event: DragStartEvent) => {
            setActiveId(event.active.id)
        },
        []
    )

    const handleDragOver = useCallback(
        (event: DragOverEvent) => {
            const { active, over } = event
            if (!over) {
                setOverColumnId(null)
                return
            }

            const activeColId = findColumnOfCard(active.id as string)
            const overId = over.id as string

            // Check if hovering over a column directly (the column container)
            const overColumn = currentColumns.find(c => c.id === overId)
            const overCardColId = findColumnOfCard(overId)

            let destColId: string | null = null

            if (overColumn) {
                // Hovering over a column container directly
                destColId = overColumn.id
            } else if (overCardColId) {
                // Hovering over a card, use its column
                destColId = overCardColId
            }

            if (activeColId && destColId && activeColId !== destColId) {
                // Moving between columns — optimistically move the card visually
                setColumns(prev => {
                    const sourceCol = prev.find(c => c.id === activeColId)
                    const destCol = prev.find(c => c.id === destColId)
                    if (!sourceCol || !destCol) return prev

                    const card = sourceCol.cards.find(c => c.id === active.id)
                    if (!card) return prev

                    return prev.map(col => {
                        if (col.id === activeColId) {
                            return { ...col, cards: col.cards.filter(c => c.id !== active.id) }
                        }
                        if (col.id === destColId) {
                            return { ...col, cards: [...col.cards, card] }
                        }
                        return col
                    })
                })
                setOverColumnId(destColId)
            } else if (destColId) {
                setOverColumnId(destColId)
            }
        },
        [findColumnOfCard, currentColumns]
    )

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event
            setActiveId(null)
            setOverColumnId(null)

            if (!over) return

            const activeColId = findColumnOfCard(active.id as string)
            const overId = over.id as string
            const overCardColId = findColumnOfCard(overId)

            // Determine destination column
            const destCol = currentColumns.find(c => c.id === overId)
            const destColId = destCol?.id || overCardColId

            if (!activeColId || !destColId) return

            // If dropped in the same column, reorder within it
            if (activeColId === destColId) {
                const col = currentColumns.find(c => c.id === activeColId)
                if (!col) return

                const oldIndex = col.cards.findIndex(c => c.id === active.id)
                const newIndex = col.cards.findIndex(c => c.id === overId)

                if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return

                setColumns(prev => {
                    return prev.map(c => {
                        if (c.id !== activeColId) return c
                        const newCards = [...c.cards]
                        const [moved] = newCards.splice(oldIndex, 1)
                        newCards.splice(newIndex, 0, moved)
                        return { ...c, cards: newCards }
                    })
                })

                onCardMove?.(active.id as string, activeColId, destColId, newIndex)
            } else {
                // Cross-column move — find the dropped position
                const destColumn = currentColumns.find(c => c.id === destColId)
                if (!destColumn) return

                const newIndex = destColumn.cards.findIndex(c => c.id === overId)
                const insertIndex = newIndex >= 0 ? newIndex : destColumn.cards.length

                onCardMove?.(active.id as string, activeColId, destColId, insertIndex)
            }
        },
        [findColumnOfCard, currentColumns, onCardMove]
    )

    if (loading) {
        return <KanbanSkeleton count={loadingSkeletonCount} />
    }

    if (!loading && currentColumns.length === 0) {
        return (
            <div className={cn(
                'flex flex-col items-center justify-center py-16 text-center',
                'rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--secondary)]/30',
                className
            )}>
                {emptyState || (
                    <>
                        <Inbox className="w-12 h-12 text-[var(--foreground-subtle)] mb-4 opacity-30" />
                        <p className="text-sm font-medium text-[var(--foreground-muted)]">
                            No hay columnas en este tablero
                        </p>
                        <p className="text-xs text-[var(--foreground-subtle)] mt-1">
                            Agrega columnas para comenzar
                        </p>
                    </>
                )}
            </div>
        )
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className={cn('flex gap-[var(--spacing-lg)] overflow-x-auto pb-[var(--spacing-md)] h-full scrollbar-thin scrollbar-thumb-[var(--border)]', className)}>
                {currentColumns.map((col) => (
                    <KanbanColumn
                        key={col.id}
                        column={col}
                        onAddCard={onAddCard}
                        customCardRenderer={customCardRenderer}
                        cardClassName={cardClassName}
                        isOver={overColumnId === col.id}
                    />
                ))}
            </div>

            {/* Drag overlay — shows the card being dragged */}
            <DragOverlay>
                {activeId && activeCard ? (
                    <div className="bg-[var(--background)] rounded-lg shadow-xl border-2 border-[var(--primary)] rotate-2 scale-105 opacity-90">
                        <div className="p-3.5">
                            {customCardRenderer
                                ? customCardRenderer(activeCard.card)
                                : <DefaultCardRenderer card={activeCard.card} />
                            }
                        </div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}
