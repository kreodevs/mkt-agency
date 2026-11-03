import { useState } from 'react';
import { Activity, ArrowRight, Check, Coins, Lightbulb, X } from 'lucide-react';
import { Button } from '@/components/atoms/Button';

interface GrowthSpotlightTourProps {
  isOpen: boolean;
  onClose: () => void;
}

const TOUR_STEPS = [
  {
    icon: Lightbulb,
    badge: 'Paso 1 de 3',
    title: 'Mesa de Estrategia Comercial',
    route: '/strategy',
    description:
      'Define objetivos comerciales (reducir CAC, ganar cuota de mercado, escalar leads). El Agente Estratega propone embudos, hipótesis de conversión y distribución de canales automáticamente.',
  },
  {
    icon: Activity,
    badge: 'Paso 2 de 3',
    title: 'Actividad Agéntica en Vivo',
    route: '/agency/activity',
    description:
      'Supervisa la coordinación en tiempo real entre tus agentes IA: investigación de competidores, diseño de briefs creativos y calibración algorítmica para cada red social.',
  },
  {
    icon: Coins,
    badge: 'Paso 3 de 3',
    title: 'Kits de Medios & Pauta de Alto Impacto',
    route: '/products/:id/media-kit',
    description:
      'Sube capturas reales de tu software o fotos de producto. El motor MeiGen monta automáticamente tus imágenes en mockups 4K para publicaciones y pauta con alta credibilidad.',
  },
];

export function GrowthSpotlightTour({ isOpen, onClose }: GrowthSpotlightTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      handleComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('mkt_growth_tour_seen', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="growth-tour-title"
        className="relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl transition-all"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleComplete}
          aria-label="Cerrar tour"
          className="absolute right-4 top-4 rounded-full p-1.5 text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Step Badge & Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
              Modo Agencia (Growth) · {step.badge}
            </span>
            <p className="text-xs text-[var(--foreground-muted)] font-mono">{step.route}</p>
          </div>
        </div>

        {/* Content */}
        <h3 id="growth-tour-title" className="text-lg font-bold text-[var(--foreground)]">
          {step.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
          {step.description}
        </p>

        {/* Indicators and Actions */}
        <div className="mt-6 flex items-center justify-between border-t border-[var(--border)] pt-4">
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentStep
                    ? 'w-6 bg-[var(--primary)]'
                    : 'w-1.5 bg-[var(--border)]'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleComplete}
              className="text-xs text-[var(--foreground-muted)]"
            >
              Omitir tour
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleNext}
              className="gap-1.5 text-xs font-medium"
            >
              {isLast ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Entendido
                </>
              ) : (
                <>
                  Siguiente
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

