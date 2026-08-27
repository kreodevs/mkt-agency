import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { InputText } from '@/components/atoms/InputText';
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/atoms/Textarea';
import { Card } from '@/components/molecules/Card';
import { toast } from '@/components/molecules/Sonner';
import {
  VISUAL_TEMPLATE_IDS,
  VISUAL_TEMPLATE_LABELS,
  type VisualTemplateId,
} from '@/lib/visual-template';
import { validateVisualTemplateText } from '@/lib/visual-template-text';
import { ApiError } from '@/services/api';
import { updateContent } from '@/services/content';
import type { ContentImageDestination } from '@/types/content';

interface ContentVisualDesignPanelProps {
  contentId: string;
  visualTemplateId?: string | null;
  visualHeadline?: string | null;
  visualSubline?: string | null;
  visualCta?: string | null;
  imageDestination?: ContentImageDestination | null;
  onSaved?: () => void;
}

export function ContentVisualDesignPanel({
  contentId,
  visualTemplateId = null,
  visualHeadline = null,
  visualSubline = null,
  visualCta = null,
  imageDestination = 'feed',
  onSaved,
}: ContentVisualDesignPanelProps) {
  const queryClient = useQueryClient();
  const [templateId, setTemplateId] = useState<VisualTemplateId | ''>('');
  const [headline, setHeadline] = useState('');
  const [subline, setSubline] = useState('');
  const [cta, setCta] = useState('');
  const [destination, setDestination] = useState<ContentImageDestination>('feed');

  useEffect(() => {
    setTemplateId(
      visualTemplateId && VISUAL_TEMPLATE_IDS.includes(visualTemplateId as VisualTemplateId)
        ? (visualTemplateId as VisualTemplateId)
        : '',
    );
    setHeadline(visualHeadline ?? '');
    setSubline(visualSubline ?? '');
    setCta(visualCta ?? '');
    setDestination(imageDestination === 'story' ? 'story' : 'feed');
  }, [visualTemplateId, visualHeadline, visualSubline, visualCta, imageDestination]);

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
    if (warnings.length > 0) {
      const proceed = window.confirm(
        'Hay avisos de longitud en los textos. ¿Guardar igualmente? La imagen puede truncar titulares o subtítulos.',
      );
      if (!proceed) {
        return;
      }
    }
    saveMutation.mutate();
  };

  return (
    <Card
      title="Diseño de plantilla"
      subtitle="Textos y plantilla que el compositor usa para maquetar la imagen (independiente del copy publicable)."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Select
          label="Plantilla gráfica"
          value={templateId}
          onChange={(event) => {
            const next = event.target.value as VisualTemplateId | '';
            setTemplateId(next);
            if (next === 'story-vertical') {
              setDestination('story');
            }
          }}
          options={[
            { value: '', label: 'Automática (según tipo de post)' },
            ...VISUAL_TEMPLATE_IDS.map((id) => ({
              value: id,
              label: VISUAL_TEMPLATE_LABELS[id],
            })),
          ]}
        />

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
          <div className="space-y-1 rounded-[var(--radius-md)] border border-amber-500/40 bg-amber-500/10 p-[var(--spacing-sm)]">
            {warnings.map((warning) => (
              <p
                key={`${warning.field}-${warning.message}`}
                className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200"
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {warning.message}
              </p>
            ))}
          </div>
        ) : null}

        <p className="text-xs text-[var(--foreground-muted)]">
          Tras guardar, usa <strong>Recomponer plantilla</strong> en el panel de imagen para aplicar
          los cambios sin volver a generar copy.
        </p>

        <Button type="submit" loading={saveMutation.isPending}>
          Guardar diseño visual
        </Button>
      </form>
    </Card>
  );
}
