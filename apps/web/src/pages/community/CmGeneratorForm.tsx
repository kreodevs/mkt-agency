import { Bookmark, Globe, Sparkles } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';
import {
  PLATFORM_ICONS,
  PLATFORM_LABELS,
  PLATFORM_KEYS,
  type CmPlatform,
} from './community-manager.constants';
import type { TonePreset } from './community-manager.types';

type CmGeneratorFormProps = {
  platforms: CmPlatform[];
  onTogglePlatform: (platform: CmPlatform) => void;
  count: number;
  onCountChange: (count: number) => void;
  tone: string;
  onToneChange: (tone: string) => void;
  topics: string;
  onTopicsChange: (topics: string) => void;
  productId: string;
  onProductIdChange: (id: string) => void;
  products: Array<{ id: string; name: string; isPrimary?: boolean }>;
  onGenerate: () => void;
  isGenerating: boolean;
  isSavingPreferences: boolean;
  tonePresets: TonePreset[];
  onSavePreset: (name: string, toneText: string) => void;
};

export function CmGeneratorForm({
  platforms,
  onTogglePlatform,
  count,
  onCountChange,
  tone,
  onToneChange,
  topics,
  onTopicsChange,
  productId,
  onProductIdChange,
  products,
  onGenerate,
  isGenerating,
  isSavingPreferences,
  tonePresets,
  onSavePreset,
}: CmGeneratorFormProps) {
  return (
    <Card className="mb-6">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
            Producto a promocionar
          </label>
          <select
            value={productId}
            onChange={(e) => onProductIdChange(e.target.value)}
            className="h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)]"
          >
            <option value="">Selecciona un producto</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
                {product.isPrimary ? ' (principal)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label className="text-sm font-medium text-[var(--foreground)]">Plataformas</label>
            <span className="text-xs text-[var(--foreground-subtle)]">
              {isSavingPreferences ? 'Guardando…' : 'Se guardan al activar o desactivar'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PLATFORM_KEYS.map((key) => {
              const Icon = PLATFORM_ICONS[key] ?? Globe;
              const selected = platforms.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={selected}
                  aria-label={`${selected ? 'Desactivar' : 'Activar'} ${PLATFORM_LABELS[key]}`}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                    selected
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                      : 'border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--foreground-subtle)]'
                  }`}
                  onClick={() => onTogglePlatform(key)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {PLATFORM_LABELS[key]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              Posts a generar
            </label>
            <select
              value={count}
              onChange={(e) => onCountChange(Number(e.target.value))}
              className="h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)]"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'post' : 'posts'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              Tono (opcional)
            </label>
            <ToneInput
              tone={tone}
              onToneChange={onToneChange}
              presets={tonePresets}
              onSavePreset={onSavePreset}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              Temas (opcional)
            </label>
            <input
              type="text"
              placeholder="Separados por coma"
              value={topics}
              onChange={(e) => onTopicsChange(e.target.value)}
              className="h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)]"
            />
          </div>
        </div>

        <Button
          onClick={onGenerate}
          loading={isGenerating}
          disabled={platforms.length === 0 || !productId}
          className="w-full gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Generar copy para redes
        </Button>
      </div>
    </Card>
  );
}

function ToneInput({
  tone,
  onToneChange,
  presets,
  onSavePreset,
}: {
  tone: string;
  onToneChange: (tone: string) => void;
  presets: TonePreset[];
  onSavePreset: (name: string, toneText: string) => void;
}) {
  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Ej. Profesional, divertido, inspirador..."
          value={tone}
          onChange={(e) => onToneChange(e.target.value)}
          className="h-10 flex-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)]"
        />
        {tone.trim() && (
          <button
            type="button"
            onClick={() => onSavePreset(tone.trim().slice(0, 40), tone.trim())}
            className="flex h-10 shrink-0 items-center gap-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-2.5 text-xs font-medium text-[var(--foreground-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            <Bookmark className="h-4 w-4" />
          </button>
        )}
      </div>
      {presets.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {presets.slice(0, 5).map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onToneChange(preset.toneText)}
              className={`rounded-full px-[var(--spacing-sm)] py-0.5 text-xs font-medium transition-colors ${
                tone === preset.toneText
                  ? 'bg-[var(--primary)]/10 text-[var(--primary)] ring-1 ring-[var(--primary)]'
                  : 'bg-[var(--secondary)] text-[var(--foreground-muted)] hover:bg-[var(--secondary)]/80'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
