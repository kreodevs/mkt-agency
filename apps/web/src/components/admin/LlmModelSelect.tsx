import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '@/components/atoms/Button';
import {
  formatCostPer1M,
  formatModelOptionLabel,
  type LlmModelOption,
} from '@/lib/llm-models';
import { listLlmProviderModels } from '@/services/superadmin';

const selectClass =
  'h-10 w-full appearance-none rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 pr-10 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-60';

interface LlmModelSelectProps {
  providerId: string;
  value: string;
  onChange: (modelId: string) => void;
  enabled?: boolean;
  label?: string;
  selectId?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
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
}: LlmModelSelectProps) {
  const modelsQuery = useQuery({
    queryKey: ['llm-provider-models', providerId],
    queryFn: () => listLlmProviderModels(providerId),
    enabled: enabled && Boolean(providerId),
    staleTime: 5 * 60 * 1000,
  });

  const models = modelsQuery.data?.models ?? [];

  const options: LlmModelOption[] = useMemo(() => {
    if (models.length) {
      return models;
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
  }, [models, value]);

  const selected = options.find((item) => item.id === value);

  return (
    <div className="flex flex-col gap-[var(--spacing-xs)]">
      <label htmlFor={selectId} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          className={selectClass}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={!providerId || modelsQuery.isLoading || (!allowEmpty && options.length === 0)}
        >
          {allowEmpty ? <option value="">{emptyLabel}</option> : null}
          {modelsQuery.isLoading ? (
            <option value="">Cargando modelos…</option>
          ) : options.length === 0 ? (
            <option value="">Sin modelos disponibles</option>
          ) : (
            options.map((item) => (
              <option key={item.id} value={item.id}>
                {formatModelOptionLabel(item)}
              </option>
            ))
          )}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]"
        />
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
      ) : selected && (selected.inputCostPer1M != null || selected.outputCostPer1M != null) ? (
        <p className="text-xs text-[var(--foreground-muted)]">
          Seleccionado: entrada {formatCostPer1M(selected.inputCostPer1M)}/1M · salida{' '}
          {formatCostPer1M(selected.outputCostPer1M)}/1M
          {selected.contextLength
            ? ` · contexto ${Math.round(selected.contextLength / 1000)}k tokens`
            : ''}
        </p>
      ) : null}
    </div>
  );
}
