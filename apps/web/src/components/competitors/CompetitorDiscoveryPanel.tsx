import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Globe, MapPin, Sparkles } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Checkbox } from '@/components/atoms/Checkbox';
import { InputText } from '@/components/atoms/InputText';
import { Card } from '@/components/molecules/Card';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import { bulkCreateCompetitors, discoverCompetitors } from '@/services/competitors';
import type { CompetitorDiscoveryScope, DiscoveredCompetitor } from '@/types/competitors';

const SCOPE_OPTIONS: Array<{
  value: CompetitorDiscoveryScope;
  label: string;
  description: string;
  icon: typeof Globe;
}> = [
  {
    value: 'global',
    label: 'Global',
    description: 'Competidores a nivel internacional en tu sector',
    icon: Globe,
  },
  {
    value: 'country',
    label: 'País',
    description: 'Enfocada en un mercado nacional concreto',
    icon: MapPin,
  },
  {
    value: 'city',
    label: 'Ciudad',
    description: 'Competencia local en una ciudad y país',
    icon: MapPin,
  },
];

interface CompetitorDiscoveryPanelProps {
  onRegistered?: (count: number) => void;
  title?: string;
  subtitle?: string;
}

export function CompetitorDiscoveryPanel({
  onRegistered,
  title = 'Buscar competidores con IA',
  subtitle = 'Usa tu perfil de empresa y Brand Brief para sugerir competidores del mismo rubro (no retail genérico).',
}: CompetitorDiscoveryPanelProps) {
  const [scope, setScope] = useState<CompetitorDiscoveryScope>('country');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [results, setResults] = useState<DiscoveredCompetitor[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const discoverMutation = useMutation({
    mutationFn: () =>
      discoverCompetitors({
        scope,
        country: scope === 'global' ? undefined : country.trim(),
        city: scope === 'city' ? city.trim() : undefined,
      }),
    onSuccess: (response) => {
      setResults(response.items);
      setSelected(Object.fromEntries(response.items.map((item) => [item.name, true])));
      if (response.items.length === 0) {
        toast.message('No se encontraron sugerencias. Prueba otro alcance.');
      }
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo buscar competidores');
    },
  });

  const registerMutation = useMutation({
    mutationFn: () => {
      const items = results
        .filter((item) => selected[item.name])
        .map((item) => ({
          name: item.name,
          website: item.website ?? undefined,
          industry: item.industry ?? undefined,
        }));
      return bulkCreateCompetitors(items);
    },
    onSuccess: (response) => {
      const count = response.created.length;
      if (count === 0) {
        toast.message('No se registraron competidores nuevos (posiblemente ya existían).');
        return;
      }
      toast.success(
        `${count} competidor${count === 1 ? '' : 'es'} registrado${count === 1 ? '' : 's'}`,
      );
      setResults([]);
      setSelected({});
      onRegistered?.(count);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudieron registrar');
    },
  });

  const selectedCount = useMemo(
    () => results.filter((item) => selected[item.name]).length,
    [results, selected],
  );

  const canSearch =
    scope === 'global' ||
    (scope === 'country' && country.trim().length > 0) ||
    (scope === 'city' && country.trim().length > 0 && city.trim().length > 0);

  return (
    <Card title={title} subtitle={subtitle}>
      <div className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-3">
          {SCOPE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const active = scope === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setScope(option.value)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  active
                    ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                    : 'border-[var(--border)] hover:border-[var(--primary)]/40'
                }`}
              >
                <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                  <Icon className="h-4 w-4 text-[var(--primary)]" />
                  {option.label}
                </div>
                <p className="text-xs leading-relaxed text-[var(--foreground-muted)]">
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>

        {scope !== 'global' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <InputText
              label={scope === 'city' ? 'País' : 'País'}
              placeholder="México"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
            />
            {scope === 'city' && (
              <InputText
                label="Ciudad"
                placeholder="Ciudad de México"
                value={city}
                onChange={(event) => setCity(event.target.value)}
              />
            )}
          </div>
        )}

        <Button
          type="button"
          className="gap-2"
          loading={discoverMutation.isPending}
          disabled={!canSearch}
          onClick={() => discoverMutation.mutate()}
        >
          <Sparkles className="h-4 w-4" />
          Buscar competidores
        </Button>

        {results.length > 0 && (
          <div className="space-y-3 rounded-xl border border-[var(--border)] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {results.length} sugerencia{results.length === 1 ? '' : 's'}
              </p>
              <button
                type="button"
                className="text-xs font-medium text-[var(--primary)] hover:underline"
                onClick={() =>
                  setSelected(Object.fromEntries(results.map((item) => [item.name, true])))
                }
              >
                Seleccionar todas
              </button>
            </div>

            <div className="max-h-72 space-y-2 overflow-y-auto">
              {results.map((item) => (
                <label
                  key={item.name}
                  className="flex cursor-pointer gap-3 rounded-lg border border-[var(--border)] p-3 hover:bg-[var(--secondary)]/40"
                >
                  <Checkbox
                    checked={!!selected[item.name]}
                    onChange={(checked) =>
                      setSelected((prev) => ({ ...prev, [item.name]: checked }))
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--foreground)]">{item.name}</p>
                    <p className="text-xs text-[var(--foreground-muted)]">
                      {[item.website, item.industry].filter(Boolean).join(' · ') || 'Sin web'}
                    </p>
                    {item.rationale && (
                      <p className="mt-1 text-xs leading-relaxed text-[var(--foreground-subtle)]">
                        {item.rationale}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              loading={registerMutation.isPending}
              disabled={selectedCount === 0}
              onClick={() => registerMutation.mutate()}
            >
              Registrar seleccionados ({selectedCount})
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
