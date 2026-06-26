import React, { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Plus, GripVertical, Inbox } from 'lucide-react';
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
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface KanbanCardData {
  id: string;
  title: string;
  description?: string;
  status?: string;
  [key: string]: unknown;
}

export interface KanbanColumnData {
  id: string;
  title: string;
  cards: KanbanCardData[];
}

export interface KanbanBoardProps {
  columns: KanbanColumnData[];
  onCardMove?: (cardId: string, sourceColId: string, destColId: string, newIndex: number) => void;
  onAddCard?: (colId: string) => void;
  customCardRenderer?: (card: KanbanCardData) => React.ReactNode;
  emptyState?: React.ReactNode;
  loading?: boolean;
  loadingSkeletonCount?: number;
  className?: string;
  columnClassName?: string;
  cardClassName?: string;
}

interface KanbanCardWrapperProps {
  card: KanbanCardData;
  isDragging: boolean;
  customRenderer?: (card: KanbanCardData) => React.ReactNode;
  className?: string;
}

const DefaultCardRenderer = ({ card }: { card: KanbanCardData }) => (
  <>
    <div className="flex items-start gap-2">
      <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--foreground-subtle)]" />
      <div className="min-w-0 flex-1">
        <div className="mb-1 text-sm font-semibold leading-snug text-[var(--foreground)]">
          {card.title}
        </div>
        {card.description && (
          <div className="line-clamp-2 text-xs leading-relaxed text-[var(--foreground-muted)]">
            {card.description}
          </div>
        )}
      </div>
    </div>
    {card.status && (
      <div className="mt-2 flex items-center gap-1.5">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
        <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--foreground-subtle)]">
          {card.status}
        </span>
      </div>
    )}
  </>
);

const SortableCard = ({
  card,
  customRenderer,
  className,
}: Omit<KanbanCardWrapperProps, 'isDragging'>) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', card },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-lg border border-[var(--border)] bg-[var(--background)] shadow-sm transition-all',
        isDragging
          ? 'z-50 opacity-40 shadow-lg ring-2 ring-[var(--primary)]'
          : 'hover:border-[var(--primary)]/40 hover:shadow-md active:border-[var(--primary)]',
        className,
      )}
      {...attributes}
      {...listeners}
    >
      <div className="p-3.5">
        {customRenderer ? customRenderer(card) : <DefaultCardRenderer card={card} />}
      </div>
    </div>
  );
};

interface KanbanColumnProps {
  column: KanbanColumnData;
  onAddCard?: (colId: string) => void;
  customCardRenderer?: (card: KanbanCardData) => React.ReactNode;
  cardClassName?: string;
  isOver: boolean;
}

const KanbanColumn = ({
  column,
  onAddCard,
  customCardRenderer,
  cardClassName,
  isOver,
}: KanbanColumnProps) => {
  const cardIds = useMemo(() => column.cards.map((c) => c.id), [column.cards]);

  return (
    <div
      className={cn(
        'flex w-[300px] min-w-[300px] flex-col rounded-xl transition-all duration-200',
        'border border-[var(--border)] bg-[var(--secondary)] shadow-sm',
        isOver && 'border-[var(--primary)]/30 ring-2 ring-[var(--primary)]/40',
      )}
    >
      <div className="flex items-center justify-between border-b border-[var(--border)]/60 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <h3 className="text-sm font-semibold tracking-tight text-[var(--foreground)]">
            {column.title}
          </h3>
          <span className="rounded-full border border-[var(--border)] bg-[var(--background)] px-2.5 py-0.5 text-xs font-semibold text-[var(--foreground-muted)]">
            {column.cards.length}
          </span>
        </div>
      </div>

      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-[80px] flex-1 flex-col gap-2.5 overflow-y-auto p-3">
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
              <Inbox className="mb-2 h-8 w-8 opacity-40 text-[var(--foreground-subtle)]" />
              <p className="text-xs font-medium text-[var(--foreground-subtle)]">Sin tarjetas</p>
            </div>
          )}
        </div>
      </SortableContext>

      {onAddCard && (
        <div className="px-3 pb-3">
          <button
            type="button"
            onClick={() => onAddCard(column.id)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-transparent py-2 text-sm font-medium text-[var(--foreground-muted)] transition-colors hover:border-[var(--border)] hover:bg-[var(--background)] hover:text-[var(--foreground)]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Añadir</span>
          </button>
        </div>
      )}
    </div>
  );
};

const KanbanSkeleton = ({ count = 3 }: { count: number }) => (
  <div className="flex gap-[var(--spacing-lg)] overflow-x-auto pb-[var(--spacing-md)]">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="flex w-[300px] min-w-[300px] animate-pulse flex-col rounded-xl border border-[var(--border)] bg-[var(--secondary)] shadow-sm"
      >
        <div className="flex items-center gap-2.5 border-b border-[var(--border)]/60 px-4 py-3">
          <div className="h-4 w-24 rounded bg-[var(--muted)]" />
          <div className="h-5 w-7 rounded-full bg-[var(--muted)]" />
        </div>
        <div className="flex flex-col gap-2.5 p-3">
          {Array.from({ length: 3 }).map((_, j) => (
            <div
              key={j}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3.5"
            >
              <div className="mb-2 h-3.5 w-3/4 rounded bg-[var(--muted)]" />
              <div className="h-3 w-1/2 rounded bg-[var(--muted)]" />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

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
  const [, setColumns] = useState(initialColumns);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);

  const currentColumns = initialColumns;

  const findColumnOfCard = useCallback(
    (cardId: string): string | null => {
      for (const col of currentColumns) {
        if (col.cards.some((c) => c.id === cardId)) return col.id;
      }
      return null;
    },
    [currentColumns],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const activeCard = useMemo(() => {
    if (!activeId) return null;
    for (const col of currentColumns) {
      const card = col.cards.find((c) => c.id === activeId);
      if (card) return { card, columnId: col.id };
    }
    return null;
  }, [activeId, currentColumns]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) {
        setOverColumnId(null);
        return;
      }

      const activeColId = findColumnOfCard(active.id as string);
      const overId = over.id as string;
      const overColumn = currentColumns.find((c) => c.id === overId);
      const overCardColId = findColumnOfCard(overId);

      let destColId: string | null = null;

      if (overColumn) {
        destColId = overColumn.id;
      } else if (overCardColId) {
        destColId = overCardColId;
      }

      if (activeColId && destColId && activeColId !== destColId) {
        setColumns((prev) => {
          const sourceCol = prev.find((c) => c.id === activeColId);
          const destCol = prev.find((c) => c.id === destColId);
          if (!sourceCol || !destCol) return prev;

          const card = sourceCol.cards.find((c) => c.id === active.id);
          if (!card) return prev;

          return prev.map((col) => {
            if (col.id === activeColId) {
              return { ...col, cards: col.cards.filter((c) => c.id !== active.id) };
            }
            if (col.id === destColId) {
              return { ...col, cards: [...col.cards, card] };
            }
            return col;
          });
        });
        setOverColumnId(destColId);
      } else if (destColId) {
        setOverColumnId(destColId);
      }
    },
    [findColumnOfCard, currentColumns],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      setOverColumnId(null);

      if (!over) return;

      const activeColId = findColumnOfCard(active.id as string);
      const overId = over.id as string;
      const overCardColId = findColumnOfCard(overId);
      const destCol = currentColumns.find((c) => c.id === overId);
      const destColId = destCol?.id || overCardColId;

      if (!activeColId || !destColId) return;

      if (activeColId === destColId) {
        const col = currentColumns.find((c) => c.id === activeColId);
        if (!col) return;

        const oldIndex = col.cards.findIndex((c) => c.id === active.id);
        const newIndex = col.cards.findIndex((c) => c.id === overId);

        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

        setColumns((prev) =>
          prev.map((c) => {
            if (c.id !== activeColId) return c;
            const newCards = [...c.cards];
            const [moved] = newCards.splice(oldIndex, 1);
            newCards.splice(newIndex, 0, moved);
            return { ...c, cards: newCards };
          }),
        );

        onCardMove?.(active.id as string, activeColId, destColId, newIndex);
      } else {
        const destColumn = currentColumns.find((c) => c.id === destColId);
        if (!destColumn) return;

        const newIndex = destColumn.cards.findIndex((c) => c.id === overId);
        const insertIndex = newIndex >= 0 ? newIndex : destColumn.cards.length;

        onCardMove?.(active.id as string, activeColId, destColId, insertIndex);
      }
    },
    [findColumnOfCard, currentColumns, onCardMove],
  );

  if (loading) {
    return <KanbanSkeleton count={loadingSkeletonCount} />;
  }

  if (!loading && currentColumns.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--secondary)]/30 py-16 text-center',
          className,
        )}
      >
        {emptyState || (
          <>
            <Inbox className="mb-4 h-12 w-12 opacity-30 text-[var(--foreground-subtle)]" />
            <p className="text-sm font-medium text-[var(--foreground-muted)]">
              No hay columnas en este tablero
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div
        className={cn(
          'scrollbar-thin scrollbar-thumb-[var(--border)] flex h-full gap-[var(--spacing-lg)] overflow-x-auto pb-[var(--spacing-md)]',
          className,
        )}
      >
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

      <DragOverlay>
        {activeId && activeCard ? (
          <div className="scale-105 rotate-2 rounded-lg border-2 border-[var(--primary)] bg-[var(--background)] opacity-90 shadow-xl">
            <div className="p-3.5">
              {customCardRenderer ? (
                customCardRenderer(activeCard.card)
              ) : (
                <DefaultCardRenderer card={activeCard.card} />
              )}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;
