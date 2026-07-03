import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Search } from 'lucide-react';
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { Button } from '@/components/atoms/Button';
import {
  filterLlmModels,
  formatCostPer1M,
  formatModelOptionLabel,
  modelSupportsImages,
  modelSupportsVideo,
  sortModelsForTask,
  type LlmModelOption,
} from '@/lib/llm-models';
import { cn } from '@/lib/utils';
import { listLlmProviderModels } from '@/services/superadmin';

const DROPDOWN_Z_INDEX = 1060;

const inputClass =
  'h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 pr-10 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-60';

const optionButtonClass =
  'w-full px-3 py-2 text-left text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--secondary)]';

interface LlmModelSelectProps {
  providerId: string;
  value: string;
  onChange: (modelId: string) => void;
  enabled?: boolean;
  label?: string;
  selectId?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  /** Prioriza modelos Image API al buscar (p. ej. tarea image_generation). */
  taskType?: string;
}

export function LlmModelSelect({
  providerId,
  value,
  onChange,
  enabled = true,
  label = 'Modelo',
  selectId = 'llm-model-select',
  allowEmpty = false,
  emptyLabel = 'Sin fallback',
  taskType,
}: LlmModelSelectProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

  const modelsQuery = useQuery({
    queryKey: ['llm-provider-models', providerId],
    queryFn: () => listLlmProviderModels(providerId),
    enabled: enabled && Boolean(providerId),
    staleTime: 5 * 60 * 1000,
  });

  const catalog = modelsQuery.data?.models ?? [];

  const options: LlmModelOption[] = useMemo(() => {
    const sorted = sortModelsForTask(catalog, taskType);
    if (sorted.length) {
      return sorted;
    }
    if (value.trim()) {
      return [
        {
          id: value,
          name: value,
          inputCostPer1M: null,
          outputCostPer1M: null,
          contextLength: null,
        },
      ];
    }
    return [];
  }, [catalog, taskType, value]);

  const filtered = useMemo(
    () => filterLlmModels(options, query),
    [options, query],
  );

  const selected = useMemo(() => {
    const match = options.find((item) => item.id === value);
    if (match) {
      return match;
    }
    if (value.trim()) {
      return {
        id: value,
        name: value,
        inputCostPer1M: null,
        outputCostPer1M: null,
        contextLength: null,
      } satisfies LlmModelOption;
    }
    return null;
  }, [options, value]);

  const displayValue = open ? query : (selected ? formatModelOptionLabel(selected) : '');

  const updateMenuPosition = () => {
    if (!inputRef.current) {
      return;
    }

    const rect = inputRef.current.getBoundingClientRect();
    const width = rect.width;
    const maxHeight = Math.min(256, window.innerHeight - rect.bottom - 16);

    setMenuStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: Math.min(Math.max(8, rect.left), window.innerWidth - width - 8),
      width,
      maxHeight: Math.max(maxHeight, 120),
      zIndex: DROPDOWN_Z_INDEX,
      pointerEvents: 'auto',
    });
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);

    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [open, query, filtered.length]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
      setQuery('');
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const commitCustomValue = () => {
    const next = query.trim();
    if (!next) {
      if (allowEmpty) {
        onChange('');
      }
      setOpen(false);
      setQuery('');
      return;
    }

    onChange(next);
    setOpen(false);
    setQuery('');
  };

  const handleSelect = (modelId: string) => {
    onChange(modelId);
    setOpen(false);
    setQuery('');
    requestAnimationFrame(() => inputRef.current?.blur());
  };

  const showCustomHint =
    open &&
    query.trim().length > 0 &&
    !filtered.some((item) => item.id.toLowerCase() === query.trim().toLowerCase());

  const disabled =
    !providerId || modelsQuery.isLoading || (!allowEmpty && options.length === 0);

  return (
    <div ref={rootRef} className="flex flex-col gap-[var(--spacing-xs)]">
      <label htmlFor={selectId} className="text-sm font-medium">
        {label}
      </label>

      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]"
        />
        <input
          ref={inputRef}
          id={selectId}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          className={`${inputClass} pl-9`}
          value={displayValue}
          placeholder={
            modelsQuery.isLoading
              ? 'Cargando catálogo…'
              : 'Buscar o escribir slug del modelo…'
          }
          disabled={disabled}
          onFocus={() => {
            setOpen(true);
            setQuery(value);
          }}
          onChange={(event) => {
            setOpen(true);
            setQuery(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commitCustomValue();
            }
            if (event.key === 'Escape') {
              setOpen(false);
              setQuery('');
            }
          }}
        />
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]"
        />

        {open && !disabled ? (
          <ul
            ref={menuRef}
            id={listboxId}
            role="listbox"
            data-llm-model-listbox
            style={menuStyle}
            className="pointer-events-auto overflow-y-auto rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] py-1 text-[var(--foreground)] shadow-lg"
          >
            {allowEmpty ? (
              <li>
                <button
                  type="button"
                  className={optionButtonClass}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect('')}
                >
                  {emptyLabel}
                </button>
              </li>
            ) : null}

            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-[var(--foreground-muted)]">
                Sin coincidencias en el catálogo
              </li>
            ) : (
              filtered.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={item.id === value}
                    className={cn(
                      optionButtonClass,
                      item.id === value && 'bg-[var(--secondary)] font-medium',
                    )}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelect(item.id)}
                  >
                    <span className="block truncate">{formatModelOptionLabel(item)}</span>
                    {modelSupportsImages(item) && taskType === 'image_generation' ? (
                      <span className="mt-0.5 block text-[10px] text-[var(--primary)]">
                        Recomendado para Image Generator
                      </span>
                    ) : null}
                    {modelSupportsVideo(item) && taskType === 'video_generation' ? (
                      <span className="mt-0.5 block text-[10px] text-[var(--primary)]">
                        Recomendado para video / reel / GIF
                      </span>
                    ) : null}
                  </button>
                </li>
              ))
            )}

            {showCustomHint ? (
              <li className="border-t border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs text-[var(--foreground-muted)]">
                Pulsa Enter para usar{' '}
                <code className="text-[var(--foreground)]">{query.trim()}</code>
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>

      {modelsQuery.isError ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-[var(--destructive)]">
            No se pudo cargar el catálogo del proveedor.
          </p>
          <Button size="sm" variant="ghost" onClick={() => modelsQuery.refetch()}>
            Reintentar
          </Button>
        </div>
      ) : selected && selected.source === 'video' ? (
        <p className="text-xs text-[var(--foreground-muted)]">
          Modelo Video API · slug: <code>{selected.id}</code>
        </p>
      ) : selected && selected.source === 'image' ? (
        <p className="text-xs text-[var(--foreground-muted)]">
          Modelo Image API · slug: <code>{selected.id}</code>
        </p>
      ) : selected &&
        (selected.inputCostPer1M != null || selected.outputCostPer1M != null) ? (
        <p className="text-xs text-[var(--foreground-muted)]">
          Seleccionado: entrada {formatCostPer1M(selected.inputCostPer1M)}/1M · salida{' '}
          {formatCostPer1M(selected.outputCostPer1M)}/1M
          {selected.contextLength
            ? ` · contexto ${Math.round(selected.contextLength / 1000)}k tokens`
            : ''}
        </p>
      ) : selected ? (
        <p className="text-xs text-[var(--foreground-muted)]">
          Modelo personalizado: <code>{selected.id}</code>
        </p>
      ) : null}

      <p className="text-xs text-[var(--foreground-muted)]">
        Catálogo OpenRouter (chat + Image API + Video API). Busca en la lista o escribe el slug y
        pulsa Enter.
      </p>
    </div>
  );
}
