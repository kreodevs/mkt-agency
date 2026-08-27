import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { InputText } from '@/components/atoms/InputText';
import { Select } from '@/components/atoms/Select';
import { Card } from '@/components/molecules/Card';
import { toast } from '@/components/molecules/Sonner';
import {
  VISUAL_TEMPLATE_IDS,
  VISUAL_TEMPLATE_LABELS,
} from '@/lib/visual-template';
import { ApiError } from '@/services/api';
import { getProductBrandVisualKit, updateProductBrandVisualKit } from '@/services/products';
import type { BrandVisualKit, BrandVisualStyle, UpdateBrandVisualKitPayload } from '@/types/product';

const STYLE_OPTIONS: Array<{ value: BrandVisualStyle; label: string }> = [
  { value: 'minimal', label: 'Minimal — limpio y legible' },
  { value: 'bold', label: 'Bold — alto contraste' },
  { value: 'luxury', label: 'Luxury — premium y espacioso' },
];

interface ProductBrandVisualKitPanelProps {
  productId: string;
}

export function ProductBrandVisualKitPanel({ productId }: ProductBrandVisualKitPanelProps) {
  const queryClient = useQueryClient();
  const kitQuery = useQuery({
    queryKey: ['product-brand-visual-kit', productId],
    queryFn: () => getProductBrandVisualKit(productId),
    enabled: Boolean(productId),
  });

  const [style, setStyle] = useState<BrandVisualStyle>('minimal');
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [secondaryColor, setSecondaryColor] = useState('#0f172a');
  const [accentColor, setAccentColor] = useState('#dbeafe');

  useEffect(() => {
    const kit = kitQuery.data;
    if (!kit) return;
    setStyle(kit.style);
    setPrimaryColor(kit.primaryColor);
    setSecondaryColor(kit.secondaryColor);
    setAccentColor(kit.accentColor);
  }, [kitQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (payload: UpdateBrandVisualKitPayload) =>
      updateProductBrandVisualKit(productId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['product-brand-visual-kit', productId] });
      void queryClient.invalidateQueries({ queryKey: ['product', productId] });
      toast.success('Kit visual de marca guardado');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo guardar el kit visual');
    },
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    saveMutation.mutate({
      style,
      primaryColor,
      secondaryColor,
      accentColor,
    });
  };

  if (kitQuery.isLoading) {
    return (
      <Card title="Kit visual de marca">
        <p className="text-sm text-[var(--foreground-muted)]">Cargando colores…</p>
      </Card>
    );
  }

  const previewKit: BrandVisualKit = {
    style,
    primaryColor,
    secondaryColor,
    accentColor,
    updatedAt: kitQuery.data?.updatedAt ?? null,
  };

  return (
    <Card
      title="Kit visual de marca"
      subtitle="Colores y estilo que usan las plantillas sociales (split, mockup, carrusel) al generar piezas."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div
          className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)]"
          style={{
            background: `linear-gradient(135deg, ${previewKit.primaryColor}, ${previewKit.secondaryColor} 55%, ${previewKit.accentColor})`,
          }}
        >
          <div className="p-[var(--spacing-md)] text-white">
            <p className="text-lg font-semibold">Vista previa de marca</p>
            <p className="mt-1 text-sm text-white/80">
              Así se verán fondos y paneles en Instagram, LinkedIn y TikTok.
            </p>
          </div>
        </div>

        <Select
          label="Estilo"
          value={style}
          onChange={(event) => setStyle(event.target.value as BrandVisualStyle)}
          options={STYLE_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-[var(--foreground)]">Color primario</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(event) => setPrimaryColor(event.target.value)}
                className="h-10 w-12 cursor-pointer rounded border border-[var(--border)] bg-transparent"
              />
              <InputText value={primaryColor} onChange={(event) => setPrimaryColor(event.target.value)} />
            </div>
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-[var(--foreground)]">Color secundario</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={secondaryColor}
                onChange={(event) => setSecondaryColor(event.target.value)}
                className="h-10 w-12 cursor-pointer rounded border border-[var(--border)] bg-transparent"
              />
              <InputText
                value={secondaryColor}
                onChange={(event) => setSecondaryColor(event.target.value)}
              />
            </div>
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-[var(--foreground)]">Color acento</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={accentColor}
                onChange={(event) => setAccentColor(event.target.value)}
                className="h-10 w-12 cursor-pointer rounded border border-[var(--border)] bg-transparent"
              />
              <InputText value={accentColor} onChange={(event) => setAccentColor(event.target.value)} />
            </div>
          </label>
        </div>

        <p className="text-xs text-[var(--foreground-muted)]">
          Plantillas disponibles:{' '}
          {VISUAL_TEMPLATE_IDS.map((id) => VISUAL_TEMPLATE_LABELS[id]).join(' · ')}
        </p>

        <Button type="submit" loading={saveMutation.isPending}>
          Guardar kit visual
        </Button>
      </form>
    </Card>
  );
}
