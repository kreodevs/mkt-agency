import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Sparkles,
  ChevronDown,
  Target,
  Swords,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { StatusPill } from '@/components/atoms/StatusPill';
import { Button } from '@/components/atoms/Button';
import { pivotInboxContentAngle } from '@/services/publication-inbox';
import { inboxQueryKey } from '@/lib/inbox-sync.util';
import type { PublicationInboxItem, InboxPivotAngle } from '@/types/publication-inbox';

const FRAMEWORK_LABELS: Record<string, { label: string; status: 'info' | 'luxury' | 'warning' | 'success' | 'neutral' }> = {
  PAS: { label: 'Fórmula PAS (Problema → Solución)', status: 'warning' },
  BAB: { label: 'Fórmula BAB (Antes → Después)', status: 'info' },
  SocialProof: { label: 'Prueba Social & Resultados', status: 'success' },
  Contrarian: { label: 'Verdad Contraria (Anti-Mito)', status: 'luxury' },
  FOMO: { label: 'Urgencia & Oportunidad (FOMO)', status: 'warning' },
  DirectOffer: { label: 'Llamado a la Acción Directo', status: 'neutral' },
};

const PIVOT_OPTIONS: Array<{
  type: InboxPivotAngle;
  label: string;
  desc: string;
  icon: string;
}> = [
  {
    type: 'social_proof',
    label: 'Prueba Social',
    desc: 'Casos reales, testimonios y resultados cuantificables.',
    icon: '🌟',
  },
  {
    type: 'pain_agitation',
    label: 'Dolor & Agitación (PAS)',
    desc: 'Explora la fricción actual y ofrece tu solución definitiva.',
    icon: '⚡',
  },
  {
    type: 'offer_urgency',
    label: 'Urgencia & Oferta',
    desc: 'Enfoca en cupos, llamada directa y beneficio inmediato.',
    icon: '🔥',
  },
  {
    type: 'contrarian',
    label: 'Verdad Contraria',
    desc: 'Desafía un error común de tu industria para ganar autoridad.',
    icon: '🧠',
  },
  {
    type: 'educational_step',
    label: 'Paso a Paso (BAB)',
    desc: 'Guía práctica en 3 pasos con tu producto como atajo.',
    icon: '📚',
  },
];

interface InboxStrategicCapsuleProps {
  item: PublicationInboxItem;
}

export function InboxStrategicCapsule({ item }: InboxStrategicCapsuleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPivotMenu, setShowPivotMenu] = useState(false);
  const queryClient = useQueryClient();

  const pivotMutation = useMutation({
    mutationFn: (angleType: InboxPivotAngle) =>
      pivotInboxContentAngle(item.contentId, angleType),
    onSuccess: (_, angleType) => {
      queryClient.invalidateQueries({ queryKey: inboxQueryKey(item.productId) });
      toast.success('Ángulo de venta actualizado', {
        description: `Se regeneró el copy con enfoque "${PIVOT_OPTIONS.find((o) => o.type === angleType)?.label}".`,
      });
      setShowPivotMenu(false);
    },
    onError: (error) => {
      toast.error('No se pudo cambiar el ángulo', {
        description: error instanceof Error ? error.message : 'Intenta nuevamente.',
      });
    },
  });

  const frameworkInfo = item.persuasionFramework
    ? FRAMEWORK_LABELS[item.persuasionFramework] ?? { label: item.persuasionFramework, status: 'info' as const }
    : { label: 'Estrategia de Valor', status: 'info' as const };

  const hasInsights = Boolean(item.targetPainPoint || item.strategicAngle || item.persuasionFramework);

  return (
    <div className="mt-2.5 rounded-[var(--radius-sm)] border border-[var(--brand)]/20 bg-[var(--brand-muted)]/10 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-1.5 p-2">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-1.5 font-medium text-[var(--foreground)] hover:text-[var(--brand)] transition-colors text-left"
          aria-expanded={isOpen}
        >
          <Sparkles className="h-3.5 w-3.5 text-[var(--brand)]" />
          <span className="font-semibold text-[11px] tracking-wide text-[var(--foreground)]">
            Por qué vende este post
          </span>
          <StatusPill status={frameworkInfo.status} size="sm">
            {frameworkInfo.label}
          </StatusPill>
          <ChevronDown
            className={`h-3 w-3 text-[var(--foreground-muted)] transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pivotMutation.isPending}
            onClick={() => setShowPivotMenu((prev) => !prev)}
            className="h-6 gap-1 px-2 text-[11px] text-[var(--primary)] hover:bg-[var(--primary)]/10"
          >
            <RefreshCw className={`h-3 w-3 ${pivotMutation.isPending ? 'animate-spin' : ''}`} />
            {pivotMutation.isPending ? 'Pivoteando...' : 'Cambiar ángulo'}
          </Button>

          {showPivotMenu && (
            <div className="absolute right-0 top-7 z-30 w-64 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] p-1.5 shadow-xl backdrop-blur-md">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
                Selecciona otro ángulo psicológico
              </div>
              <div className="space-y-0.5">
                {PIVOT_OPTIONS.map((opt) => (
                  <button
                    key={opt.type}
                    type="button"
                    disabled={pivotMutation.isPending}
                    onClick={() => pivotMutation.mutate(opt.type)}
                    className="flex w-full items-start gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-xs transition-colors hover:bg-[var(--secondary)] disabled:opacity-50"
                  >
                    <span className="text-sm">{opt.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[var(--foreground)]">{opt.label}</div>
                      <div className="text-[10px] text-[var(--foreground-muted)] line-clamp-1">
                        {opt.desc}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-[var(--border)]/60 bg-[var(--background)]/40 p-2.5 space-y-1.5 text-[11px] leading-relaxed">
          {item.targetPainPoint && (
            <div className="flex items-start gap-2">
              <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--destructive)]" />
              <div>
                <span className="font-semibold text-[var(--foreground)]">Dolor que ataca: </span>
                <span className="text-[var(--foreground-muted)]">{item.targetPainPoint}</span>
              </div>
            </div>
          )}

          {item.strategicAngle && (
            <div className="flex items-start gap-2">
              <Swords className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--primary)]" />
              <div>
                <span className="font-semibold text-[var(--foreground)]">Diferenciador vs rivales: </span>
                <span className="text-[var(--foreground-muted)]">{item.strategicAngle}</span>
              </div>
            </div>
          )}

          {!hasInsights && (
            <div className="flex items-start gap-2 text-[var(--foreground-muted)]">
              <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--warning)]" />
              <span>
                Pieza orientada a posicionamiento orgánico y retención de marca. Usa el botón{' '}
                <strong className="text-[var(--foreground)]">«Cambiar ángulo»</strong> para enfocarla en una fórmula específica (PAS, Prueba Social, FOMO).
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
