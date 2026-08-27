import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useEffect, useState } from 'react';
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
import { ApiError } from '@/services/api';
import { updateContent } from '@/services/content';

interface ContentVisualDesignPanelProps {
  contentId: string;
  visualTemplateId?: string | null;
  visualHeadline?: string | null;
  visualSubline?: string | null;
  visualCta?: string | null;
  onSaved?: () => void;
}

export function ContentVisualDesignPanel({
  contentId,
  visualTemplateId = null,
  visualHeadline = null,
  visualSubline = null,
  visualCta = null,
  onSaved,
}: ContentVisualDesignPanelProps) {
  const queryClient = useQueryClient();
  const [templateId, setTemplateId] = useState<VisualTemplateId | ''>('');
  const [headline, setHeadline] = useState('');
  const [subline, setSubline] = useState('');
  const [cta, setCta] = useState('');

  useEffect(() => {
    setTemplateId(
      visualTemplateId && VISUAL_TEMPLATE_IDS.includes(visualTemplateId as VisualTemplateId)
        ? (visualTemplateId as VisualTemplateId)
        : '',
    );
    setHeadline(visualHeadline ?? '');
    setSubline(visualSubline ?? '');
    setCta(visualCta ?? '');
  }, [visualTemplateId, visualHeadline, visualSubline, visualCta]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateContent(contentId, {
        visualTemplateId: templateId || null,
        visualHeadline: headline.trim() || null,
        visualSubline: subline.trim() || null,
        visualCta: cta.trim() || null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['content', contentId] });
      toast.success('Diseño visual guardado');
      onSaved?.();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo guardar el diseño');
    },
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
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
          onChange={(event) => setTemplateId(event.target.value as VisualTemplateId | '')}
          options={[
            { value: '', label: 'Automática (según tipo de post)' },
            ...VISUAL_TEMPLATE_IDS.map((id) => ({
              value: id,
              label: VISUAL_TEMPLATE_LABELS[id],
            })),
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
