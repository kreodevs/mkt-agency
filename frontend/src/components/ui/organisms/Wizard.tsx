import { useState, forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from '../atoms/Button';
import { Stepper, StepperItem } from '../molecules/Stepper';

export interface WizardStep extends StepperItem {
    content: ReactNode;
    isValid?: boolean;
}

export interface WizardProps {
    steps: WizardStep[];
    onComplete?: (data?: any) => void;
    onStepChange?: (stepIndex: number) => void;
    className?: string;
    finishLabel?: string;
    loading?: boolean;
}

/**
 * Wizard - Componente de flujo por pasos (Step-by-step).
 * Ideal para onboarding, configuraciones complejas o procesos de registro.
 */
export const Wizard = forwardRef<HTMLDivElement, WizardProps>(({
    steps,
    onComplete,
    onStepChange,
    className,
    finishLabel = "Finalizar",
    loading = false,
}, ref) => {
    const [currentStep, setCurrentStep] = useState(0);
    const totalSteps = steps.length;
    const isLastStep = currentStep === totalSteps - 1;
    const isFirstStep = currentStep === 0;

    const totalIndicatorSteps = Math.max(totalSteps, 4);

    const handleNext = () => {
        if (currentStep < totalSteps - 1) {
            const nextStep = currentStep + 1;
            setCurrentStep(nextStep);
            onStepChange?.(nextStep);
        } else {
            onComplete?.();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            const prevStep = currentStep - 1;
            setCurrentStep(prevStep);
            onStepChange?.(prevStep);
        }
    };

    // Extraer la configuracion visual para el stepper
    const stepperModel = steps.map(({ label, description, icon }) => ({
        label,
        description,
        icon
    }));

    // ─── Loading Skeleton ──────────────────────────────────────
    if (loading) {
        const skeletonSteps = Array.from({ length: Math.min(totalIndicatorSteps, 4) });
        const skeletonFields = Array.from({ length: 5 });

        return (
            <div ref={ref} className={cn("flex flex-col h-full bg-[var(--card)] rounded-[var(--radius-2xl)] border border-[var(--border)] overflow-hidden shadow-sm", className)}>
                {/* Skeleton Header / Step Indicators */}
                <header className="px-[var(--spacing-xl)] pb-[var(--spacing-md)] pt-[var(--spacing-xl)] border-b border-[var(--border)] bg-[var(--background-secondary)]">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-center gap-0">
                            {skeletonSteps.map((_, i) => (
                                <div key={i} className="flex items-center">
                                    {/* Step circle */}
                                    <div className="w-10 h-10 rounded-full bg-[var(--border)] animate-pulse shrink-0" />
                                    {/* Connecting bar (except after last) */}
                                    {i < skeletonSteps.length - 1 && (
                                        <div className="w-16 h-1 mx-2 rounded-full bg-[var(--border)] animate-pulse" style={{ animationDelay: '0.1s' }} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </header>

                {/* Skeleton Content Area */}
                <main className="flex-1 overflow-y-auto p-[var(--spacing-xl)] lg:p-12">
                    <div className="max-w-2xl mx-auto">
                        {/* Title skeleton */}
                        <div className="mb-[var(--spacing-2xl)] text-center">
                            <div className="h-8 w-3/5 mx-auto rounded-full bg-[var(--border)] animate-pulse mb-[var(--spacing-sm)]" style={{ animationDelay: '0.2s' }} />
                            <div className="h-5 w-2/5 mx-auto rounded-full bg-[var(--border)] animate-pulse" style={{ animationDelay: '0.3s' }} />
                        </div>

                        {/* Field bars */}
                        <div className="space-y-[var(--spacing-lg)]">
                            {skeletonFields.map((_, i) => (
                                <div key={i} className="space-y-[var(--spacing-sm)]">
                                    <div
                                        className="h-4 w-1/4 rounded-full bg-[var(--border)] animate-pulse"
                                        style={{ animationDelay: `${0.4 + i * 0.1}s` }}
                                    />
                                    <div
                                        className="h-10 w-full rounded-[var(--radius)] bg-[var(--border)] animate-pulse"
                                        style={{ animationDelay: `${0.5 + i * 0.1}s` }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </main>

                {/* Skeleton Footer */}
                <footer className="px-[var(--spacing-xl)] py-[var(--spacing-lg)] border-t border-[var(--border)] bg-[var(--secondary)]/10">
                    <div className="flex items-center justify-between max-w-2xl mx-auto">
                        <div className="h-10 w-28 rounded-[var(--radius)] bg-[var(--border)] animate-pulse" style={{ animationDelay: '0.6s' }} />
                        <div className="h-10 w-[140px] rounded-[var(--radius)] bg-[var(--border)] animate-pulse" style={{ animationDelay: '0.7s' }} />
                    </div>
                </footer>
            </div>
        );
    }

    // ─── Normal Render ────────────────────────────────────────
    return (
        <div ref={ref} className={cn("flex flex-col h-full bg-[var(--card)] rounded-[var(--radius-2xl)] border border-[var(--border)] overflow-hidden shadow-sm", className)}>
            {/* Header / Steps Indicator */}
            <header className="px-[var(--spacing-xl)] pb-[var(--spacing-md)] pt-[var(--spacing-xl)] border-b border-[var(--border)] bg-[var(--background-secondary)]">
                <div className="max-w-4xl mx-auto">
                    <Stepper
                        model={stepperModel}
                        activeIndex={currentStep}
                        readOnly={true}
                    />
                </div>
            </header>

            {/* Content Area */}
            <main className="flex-1 overflow-y-auto p-[var(--spacing-xl)] lg:p-12">
                <div className="max-w-2xl mx-auto animate-fade-in" key={currentStep}>
                    <div className="mb-[var(--spacing-2xl)] text-center">
                        <h2 className="text-3xl font-black text-[var(--foreground)] tracking-tight mb-[var(--spacing-sm)]">{steps[currentStep].label}</h2>
                        {steps[currentStep].description && (
                            <p className="text-[var(--foreground-muted)] font-medium">{steps[currentStep].description}</p>
                        )}
                    </div>

                    <div className="relative">
                        {steps[currentStep].content}
                    </div>
                </div>
            </main>

            {/* Footer Navigation */}
            <footer className="px-[var(--spacing-xl)] py-[var(--spacing-lg)] border-t border-[var(--border)] bg-[var(--secondary)]/10">
                <div className="flex items-center justify-between max-w-2xl mx-auto">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={isFirstStep}
                        className="gap-[var(--spacing-sm)]"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Anterior
                    </Button>

                    <Button
                        onClick={handleNext}
                        className="gap-[var(--spacing-sm)] min-w-[140px]"
                        disabled={steps[currentStep].isValid === false}
                    >
                        {isLastStep ? finishLabel : "Continuar"}
                        {!isLastStep && <ChevronRight className="w-4 h-4" />}
                    </Button>
                </div>
            </footer>
        </div>
    );
});

Wizard.displayName = 'Wizard';
