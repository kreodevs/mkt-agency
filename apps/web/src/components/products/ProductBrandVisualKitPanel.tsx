import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { InputText } from '@/components/atoms/InputText';
import { Select } from '@/components/atoms/Select';
import { Card } from '@/components/molecules/Card';
import { toast } from '@/components/molecules/Sonner';
import {
  buildBrandGradient,
  contrastingTextColor,
  DEFAULT_BRAND_COLORS,
  hexForColorInput,
  isValidHexColor,
  normalizeHexColor,
  resolvePreviewKit,
} from '@/lib/brand-visual-kit';
import {
  VISUAL_TEMPLATE_IDS,
  VISUAL_TEMPLATE_LABELS,
} from '@/lib/visual-template';
import { ApiError } from '@/services/api';
import { getProductBrandVisualKit, updateProductBrandVisualKit } from '@/services/products';
import type { BrandVisualStyle, UpdateBrandVisualKitPayload } from '@/types/product';

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
  const hasInitializedRef = useRef(false);
  const kitQuery = useQuery({
    queryKey: ['product-brand-visual-kit', productId],
    queryFn: () => getProductBrandVisualKit(productId),
    enabled: Boolean(productId),
  });

  const [style, setStyle] = useState<BrandVisualStyle>('minimal');
  const [primaryColor, setPrimaryColor] = useState<string>(DEFAULT_BRAND_COLORS.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState<string>(DEFAULT_BRAND_COLORS.secondaryColor);
  const [accentColor, setAccentColor] = useState<string>(DEFAULT_BRAND_COLORS.accentColor);
  const [fontFamily, setFontFamily] = useState('');

  useEffect(() => {
    hasInitializedRef.current = false;
  }, [productId]);

  useEffect(() => {
    const kit = kitQuery.data;
    if (!kit || hasInitializedRef.current) return;
    setStyle(kit.style);
    setPrimaryColor(kit.primaryColor);
    setSecondaryColor(kit.secondaryColor);
    setAccentColor(kit.accentColor);
    setFontFamily(kit.fontFamily ?? '');
    hasInitializedRef.current = true;
  }, [kitQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (payload: UpdateBrandVisualKitPayload) =>
      updateProductBrandVisualKit(productId, payload),
    onSuccess: (savedKit) => {
      setStyle(savedKit.style);
      setPrimaryColor(savedKit.primaryColor);
      setSecondaryColor(savedKit.secondaryColor);
      setAccentColor(savedKit.accentColor);
      setFontFamily(savedKit.fontFamily ?? '');
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

    const normalized = resolvePreviewKit(
      { style, primaryColor, secondaryColor, accentColor },
      kitQuery.data ?? DEFAULT_BRAND_COLORS,
    );

    if (
      !isValidHexColor(primaryColor) ||
      !isValidHexColor(secondaryColor) ||
      !isValidHexColor(accentColor)
    ) {
      toast.error('Usa colores en formato hexadecimal (#RRGGBB)');
      return;
    }

    saveMutation.mutate({
      style: normalized.style,
      primaryColor: normalized.primaryColor,
      secondaryColor: normalized.secondaryColor,
      accentColor: normalized.accentColor,
      fontFamily: fontFamily.trim() || null,
    });
  };

  if (kitQuery.isLoading) {
    return (
      <Card title="Kit visual de marca">
        <p className="text-sm text-[var(--foreground-muted)]">Cargando colores…</p>
      </Card>
    );
  }

  const previewKit = resolvePreviewKit(
    { style, primaryColor, secondaryColor, accentColor },
    kitQuery.data ?? DEFAULT_BRAND_COLORS,
  );
  const previewGradient = buildBrandGradient(previewKit, kitQuery.data ?? DEFAULT_BRAND_COLORS);
  const previewTextColor = contrastingTextColor(previewKit.secondaryColor);

  return (
    <Card
      title="Kit visual de marca"
      subtitle="Colores y estilo que usan las plantillas sociales (split, mockup, carrusel) al generar piezas."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-3">
          <div
            className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)]"
            style={{ background: previewGradient }}
          >
            <div className="p-[var(--spacing-md)]" style={{ color: previewTextColor }}>
              <p className="text-lg font-semibold">Vista previa de marca</p>
              <p className="mt-1 text-sm opacity-80">
                Así se verán fondos y paneles en Instagram, LinkedIn y TikTok.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['Primario', previewKit.primaryColor],
                ['Secundario', previewKit.secondaryColor],
                ['Acento', previewKit.accentColor],
              ] as const
            ).map(([label, color]) => (
              <div
                key={label}
                className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)]"
              >
                <div className="h-10" style={{ backgroundColor: color }} aria-hidden />
                <div className="px-2 py-1.5 text-center">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
                    {label}
                  </p>
                  <p className="font-mono text-[11px] text-[var(--foreground)]">{color}</p>
                </div>
              </div>
            ))}
          </div>

          <div
            className="rounded-[var(--radius-md)] border border-[var(--border)] p-4"
            style={{ backgroundColor: previewKit.secondaryColor, color: previewKit.primaryColor }}
          >
            <p className="text-xs uppercase tracking-wide opacity-70">Ejemplo de post</p>
            <p className="mt-2 text-base font-semibold">Tu mensaje en redes</p>
            <p className="mt-1 text-sm opacity-80">Texto sobre fondo secundario con color primario.</p>
            <span
              className="mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                backgroundColor: previewKit.accentColor,
                color: contrastingTextColor(previewKit.accentColor),
              }}
            >
              Ver más
            </span>
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

        <InputText
          label="Tipografía de marca (opcional)"
          value={fontFamily}
          onChange={(event) => setFontFamily(event.target.value)}
          placeholder='"Helvetica Neue", Arial, sans-serif'
        />
        <p className="text-xs text-[var(--foreground-muted)]">
          Se aplica a titulares en plantillas SVG. Vacío = estilo por defecto del kit.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-[var(--foreground)]">Color primario</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={hexForColorInput(primaryColor, previewKit.primaryColor)}
                onChange={(event) => setPrimaryColor(event.target.value)}
                className="h-10 w-12 cursor-pointer rounded border border-[var(--border)] bg-transparent"
              />
              <InputText
                value={primaryColor}
                onChange={(event) => setPrimaryColor(event.target.value)}
                onBlur={() => {
                  if (isValidHexColor(primaryColor)) {
                    setPrimaryColor(normalizeHexColor(primaryColor, previewKit.primaryColor));
                  }
                }}
              />
            </div>
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-[var(--foreground)]">Color secundario</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={hexForColorInput(secondaryColor, previewKit.secondaryColor)}
                onChange={(event) => setSecondaryColor(event.target.value)}
                className="h-10 w-12 cursor-pointer rounded border border-[var(--border)] bg-transparent"
              />
              <InputText
                value={secondaryColor}
                onChange={(event) => setSecondaryColor(event.target.value)}
                onBlur={() => {
                  if (isValidHexColor(secondaryColor)) {
                    setSecondaryColor(normalizeHexColor(secondaryColor, previewKit.secondaryColor));
                  }
                }}
              />
            </div>
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-[var(--foreground)]">Color acento</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={hexForColorInput(accentColor, previewKit.accentColor)}
                onChange={(event) => setAccentColor(event.target.value)}
                className="h-10 w-12 cursor-pointer rounded border border-[var(--border)] bg-transparent"
              />
              <InputText
                value={accentColor}
                onChange={(event) => setAccentColor(event.target.value)}
                onBlur={() => {
                  if (isValidHexColor(accentColor)) {
                    setAccentColor(normalizeHexColor(accentColor, previewKit.accentColor));
                  }
                }}
              />
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
