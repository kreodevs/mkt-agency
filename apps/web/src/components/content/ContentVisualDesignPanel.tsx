import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { InputText } from '@/components/atoms/InputText';
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/atoms/Textarea';
import { Card } from '@/components/molecules/Card';
import { toast } from '@/components/molecules/Sonner';
import { HEALTH_UI } from '@/lib/semantic-ui';
import {
  VISUAL_DESIGN_PRESET_HINTS,
  VISUAL_DESIGN_SELECT_OPTION_GROUPS,
  VISUAL_PRESET_KIND_LABELS,
  VISUAL_SCENE_SELECT_OPTIONS,
  VISUAL_STYLE_GUIDE_ROWS,
  isCreativeScenePreset,
  isVisualDesignPreset,
  isVisualSceneId,
  resolveVisualPresetKind,
} from '@/lib/visual-template';
import {
  hasTruncationRiskWarnings,
  validateVisualTemplateText,
} from '@/lib/visual-template-text';
import { ApiError } from '@/services/api';
import { updateContent } from '@/services/content';
import type { ContentImageDestination } from '@/types/content';

interface ContentVisualDesignPanelProps {
  contentId: string;
  visualTemplateId?: string | null;
  visualScene?: string | null;
  visualHeadline?: string | null;
  visualSubline?: string | null;
  visualCta?: string | null;
  imageDestination?: ContentImageDestination | null;
  onSaved?: () => void;
}

export function ContentVisualDesignPanel({
  contentId,
  visualTemplateId = null,
  visualScene = null,
  visualHeadline = null,
  visualSubline = null,
  visualCta = null,
  imageDestination = 'feed',
  onSaved,
}: ContentVisualDesignPanelProps) {
  const queryClient = useQueryClient();
  const [templateId, setTemplateId] = useState<string>('');
  const [sceneId, setSceneId] = useState<string>('');
  const [headline, setHeadline] = useState('');
  const [subline, setSubline] = useState('');
  const [cta, setCta] = useState('');
  const [destination, setDestination] = useState<ContentImageDestination>('feed');

  useEffect(() => {
    setTemplateId(
      visualTemplateId && isVisualDesignPreset(visualTemplateId) ? visualTemplateId : '',
    );
    setSceneId(visualScene && isVisualSceneId(visualScene) ? visualScene : '');
    setHeadline(visualHeadline ?? '');
    setSubline(visualSubline ?? '');
    setCta(visualCta ?? '');
    setDestination(imageDestination === 'story' ? 'story' : 'feed');
  }, [
    visualTemplateId,
    visualScene,
    visualHeadline,
    visualSubline,
    visualCta,
    imageDestination,
  ]);

  const presetKind = resolveVisualPresetKind(templateId || null);
  const presetHint = templateId ? VISUAL_DESIGN_PRESET_HINTS[templateId] : VISUAL_DESIGN_PRESET_HINTS[''];

  const warnings = useMemo(
    () =>
      validateVisualTemplateText({
        headline,
        subline,
        cta,
        templateId: templateId || null,
      }),
    [headline, subline, cta, templateId],
  );

  const saveMutation = useMutation({
    mutationFn: () =>
      updateContent(contentId, {
        visualTemplateId: templateId || null,
        visualScene: isCreativeScenePreset(templateId) && sceneId ? sceneId : null,
        visualHeadline: headline.trim() || null,
        visualSubline: subline.trim() || null,
        visualCta: cta.trim() || null,
        imageDestination: destination,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['content', contentId] });
      void queryClient.invalidateQueries({ queryKey: ['publication-inbox'] });
      toast.success('Diseño visual guardado');
      onSaved?.();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo guardar el diseño');
    },
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (hasTruncationRiskWarnings(warnings)) {
      const proceed = window.confirm(
        'El titular o subtítulo puede truncarse en la plantilla tipográfica. ¿Guardar igualmente?',
      );
      if (!proceed) {
        return;
      }
    }
    saveMutation.mutate();
  };

  return (
    <Card
      title="Diseño visual"
      subtitle="Elige cómo se generará la imagen: escena con CM, mockup con captura del app, arte IA o plantilla con textos fijos."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--secondary)] p-[var(--spacing-sm)]">
          <p className="mb-2 text-xs font-medium text-[var(--foreground)]">¿Cuál elegir?</p>
          <dl className="space-y-2 text-xs text-[var(--foreground-muted)]">
            {VISUAL_STYLE_GUIDE_ROWS.map((row) => (
              <div
                key={row.kind}
                className="flex flex-col gap-0.5 sm:grid sm:grid-cols-[5.5rem_1fr_auto] sm:items-baseline sm:gap-x-2"
              >
                <dt className="font-medium text-[var(--foreground)]">{VISUAL_PRESET_KIND_LABELS[row.kind]}</dt>
                <dd>{row.generates}</dd>
                <dd className="sm:text-right">
                  ¿Muestra la app?{' '}
                  <span className="font-medium text-[var(--foreground)]">{row.showsApp}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <Select
          label="Modo de generación"
          value={templateId}
          onChange={(event) => {
            const next = event.target.value;
            setTemplateId(next);
            if (!isCreativeScenePreset(next)) {
              setSceneId('');
            }
            if (next === 'story-vertical') {
              setDestination('story');
            }
          }}
          optionGroups={VISUAL_DESIGN_SELECT_OPTION_GROUPS}
          hint="Escena CM ≠ mockup: la escena no muestra la interfaz del producto; el mockup sí."
        />

        {presetHint ? (
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-[var(--spacing-sm)]">
            <p className="text-xs font-semibold text-[var(--foreground)]">
              {VISUAL_PRESET_KIND_LABELS[presetKind]}
            </p>
            <p className="mt-1 text-xs text-[var(--foreground-muted)]">{presetHint}</p>
          </div>
        ) : null}

        {isCreativeScenePreset(templateId) ? (
          <Select
            label="Tipo de escena"
            value={sceneId}
            onChange={(event) => setSceneId(event.target.value)}
            options={VISUAL_SCENE_SELECT_OPTIONS}
          />
        ) : null}

        <Select
          label="Formato de imagen"
          value={destination}
          onChange={(event) => setDestination(event.target.value as ContentImageDestination)}
          options={[
            { value: 'feed', label: 'Feed cuadrado (1:1)' },
            { value: 'story', label: 'Story / Reel vertical (9:16)' },
          ]}
        />

        <InputText
          label="Titular en imagen"
          value={headline}
          onChange={(event) => setHeadline(event.target.value)}
          placeholder="3–8 palabras, sin hashtags"
          maxLength={200}
        />

        <div className="flex flex-col gap-[var(--spacing-xs)]">
          <label className="text-sm font-medium text-[var(--foreground)]">Subtítulo en imagen</label>
          <Textarea
            value={subline}
            onChange={(event) => setSubline(event.target.value)}
            rows={2}
            placeholder="Máx. 14 palabras"
            maxLength={300}
          />
        </div>

        <InputText
          label="CTA en botón"
          value={cta}
          onChange={(event) => setCta(event.target.value)}
          placeholder="2–4 palabras"
          maxLength={80}
        />

        {warnings.length > 0 ? (
          <div
            className={`space-y-1 rounded-[var(--radius-md)] border p-[var(--spacing-sm)] ${HEALTH_UI.fair.border} ${HEALTH_UI.fair.bg}`}
          >
            {warnings.map((warning) => (
              <p
                key={`${warning.field}-${warning.message}`}
                className={`flex items-start gap-2 text-sm font-medium ${HEALTH_UI.fair.text}`}
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {warning.message}
              </p>
            ))}
          </div>
        ) : null}

        <p className="text-xs text-[var(--foreground-muted)]">
          Tras guardar, pulsa <strong>Regenerar escena</strong> en el panel de imagen para aplicar el
          nuevo estilo. Si solo cambiaste textos en una plantilla tipográfica, usa{' '}
          <strong>Recomponer plantilla</strong>.
        </p>

        <Button type="submit" loading={saveMutation.isPending}>
          Guardar diseño visual
        </Button>
      </form>
    </Card>
  );
}
