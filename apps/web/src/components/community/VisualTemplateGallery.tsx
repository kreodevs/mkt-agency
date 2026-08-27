import type { CSSProperties } from 'react';
import { VISUAL_TEMPLATE_IDS, VISUAL_TEMPLATE_LABELS, type VisualTemplateId } from '@/lib/visual-template';

const TEMPLATE_PREVIEW_STYLES: Record<
  VisualTemplateId,
  { gradient: string; layout: string }
> = {
  'product-hero': {
    gradient: 'linear-gradient(135deg, var(--preview-primary), var(--preview-secondary))',
    layout: 'Split + mockup',
  },
  'tip-card': {
    gradient: 'linear-gradient(160deg, var(--preview-secondary), var(--preview-primary))',
    layout: 'Mockup centrado',
  },
  'quote-insight': {
    gradient: 'linear-gradient(120deg, var(--preview-primary), var(--preview-accent))',
    layout: 'Cita editorial',
  },
  'promo-cta': {
    gradient: 'linear-gradient(180deg, var(--preview-primary), var(--preview-secondary))',
    layout: 'CTA destacado',
  },
  'stat-highlight': {
    gradient: 'linear-gradient(135deg, var(--preview-accent), var(--preview-secondary))',
    layout: 'Dato + mini mockup',
  },
  'story-vertical': {
    gradient: 'linear-gradient(180deg, var(--preview-secondary), var(--preview-primary))',
    layout: 'Story 9:16',
  },
};

interface VisualTemplateGalleryProps {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  className?: string;
}

export function VisualTemplateGallery({
  primaryColor = '#c2410c',
  secondaryColor = '#141413',
  accentColor = '#fff7ed',
  className = '',
}: VisualTemplateGalleryProps) {
  return (
    <div className={className}>
      <p className="mb-[var(--spacing-sm)] text-sm font-medium text-[var(--foreground)]">
        Plantillas que usará el copiloto
      </p>
      <p className="mb-[var(--spacing-md)] text-xs text-[var(--foreground-muted)]">
        Vista previa orientativa según el kit visual del producto. La IA elige la plantilla por post;
        puedes ajustarla después en cada pieza.
      </p>
      <div className="grid gap-[var(--spacing-sm)] sm:grid-cols-2 lg:grid-cols-3">
        {VISUAL_TEMPLATE_IDS.map((templateId) => {
          const preview = TEMPLATE_PREVIEW_STYLES[templateId];
          return (
            <div
              key={templateId}
              className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] transition-[var(--transition-base)] hover:-translate-y-0.5"
              style={
                {
                  '--preview-primary': primaryColor,
                  '--preview-secondary': secondaryColor,
                  '--preview-accent': accentColor,
                } as CSSProperties
              }
            >
              <div
                className="relative aspect-square p-[var(--spacing-sm)]"
                style={{ background: preview.gradient }}
              >
                <div className="absolute inset-x-[var(--spacing-sm)] top-[var(--spacing-sm)] h-[38%] rounded-md bg-white/15 backdrop-blur-sm" />
                <div className="absolute bottom-[var(--spacing-sm)] left-[var(--spacing-sm)] right-[var(--spacing-sm)] space-y-1">
                  <div className="h-2 w-3/4 rounded bg-white/80" />
                  <div className="h-2 w-1/2 rounded bg-white/50" />
                </div>
              </div>
              <div className="border-t border-[var(--border)] px-[var(--spacing-sm)] py-[var(--spacing-xs)]">
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {VISUAL_TEMPLATE_LABELS[templateId]}
                </p>
                <p className="text-xs text-[var(--foreground-muted)]">{preview.layout}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
