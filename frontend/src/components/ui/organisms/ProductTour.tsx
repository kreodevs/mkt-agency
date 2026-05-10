import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { Button } from '../atoms/Button';
import { X } from 'lucide-react';

export interface TourStep {
    target: string; // CSS Selector like '#my-button'
    title: string;
    description: React.ReactNode;
}

export interface ProductTourProps {
    isOpen: boolean;
    steps: TourStep[];
    onClose: () => void;
    onComplete?: () => void;
}

export const ProductTour = ({ isOpen, steps, onClose, onComplete }: ProductTourProps) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    const updateRect = useCallback(() => {
        if (!isOpen || steps.length === 0 || currentStep >= steps.length) return;
        const step = steps[currentStep];
        const el = document.querySelector(step.target);
        if (el) {
            const rect = el.getBoundingClientRect();
            setTargetRect(rect);

            // Try to scroll into view if needed
            const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
            if (!isVisible) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            setTargetRect(null);
        }
    }, [isOpen, steps, currentStep]);

    useEffect(() => {
        updateRect();
        window.addEventListener('resize', updateRect);
        window.addEventListener('scroll', updateRect, true); // true to capture all scrolls
        return () => {
            window.removeEventListener('resize', updateRect);
            window.removeEventListener('scroll', updateRect, true);
        };
    }, [updateRect]);

    // Continuously check for rect updates to account for layout shifts
    useEffect(() => {
        if (isOpen) {
            const interval = setInterval(updateRect, 100);
            return () => clearInterval(interval);
        }
    }, [isOpen, updateRect]);

    // Reset to first step when opened
    useEffect(() => {
        if (isOpen) setCurrentStep(0);
    }, [isOpen]);

    if (!isOpen || steps.length === 0) return null;

    const step = steps[currentStep];

    // Tooltip positioning
    const PADDING = 8;
    const TOOLTIP_WIDTH = 320;

    let tooltipTop = 0;
    let tooltipLeft = 0;

    if (targetRect) {
        // Default position: bottom of element
        tooltipTop = targetRect.bottom + PADDING;
        tooltipLeft = targetRect.left;

        // Safety bounds to prevent tooltip from going off screen
        if (tooltipTop + 200 > window.innerHeight) {
            tooltipTop = targetRect.top - PADDING - 180;
        }
        if (tooltipLeft + TOOLTIP_WIDTH > window.innerWidth) {
            tooltipLeft = window.innerWidth - TOOLTIP_WIDTH - PADDING;
        }
    } else {
        // Center screen if element is not found
        tooltipTop = window.innerHeight / 2 - 100;
        tooltipLeft = window.innerWidth / 2 - TOOLTIP_WIDTH / 2;
    }

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onComplete?.();
            onClose();
        }
    };

    const content = (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
            {/* Cutout Highlight uses a massive box-shadow to grey out the rest of the screen */}
            {targetRect && (
                <div
                    className="absolute z-[9999] pointer-events-none transition-all duration-500 ease-in-out bg-transparent"
                    style={{
                        top: targetRect.top - PADDING,
                        left: targetRect.left - PADDING,
                        width: targetRect.width + PADDING * 2,
                        height: targetRect.height + PADDING * 2,
                        boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
                        borderRadius: '8px'
                    }}
                />
            )}

            {/* Fallback dark background if no target found */}
            {!targetRect && (
                <div className="absolute inset-0 bg-black/65 pointer-events-auto" />
            )}

            {/* Popover Card */}
            <div
                className={cn(
                    "absolute z-[10000] w-[320px] bg-[var(--background)] p-[var(--spacing-lg)] rounded-2xl shadow-2xl border border-[var(--border)] text-[var(--foreground)] pointer-events-auto transition-all duration-500 ease-in-out",
                    !targetRect && "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                )}
                style={targetRect ? {
                    top: tooltipTop,
                    left: Math.max(PADDING, tooltipLeft)
                } : {}}
            >
                <div className="flex items-start justify-between mb-[var(--spacing-sm)]">
                    <h3 className="font-semibold text-lg">{step.title}</h3>
                    <button onClick={onClose} className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] rounded p-[var(--spacing-xs)] transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="text-sm text-[var(--foreground-muted)] mb-[var(--spacing-lg)] leading-relaxed">
                    {step.description}
                </div>

                <div className="flex items-center justify-between mt-[var(--spacing-md)]">
                    {/* Step indicators */}
                    <div className="flex gap-1.5">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "w-2 h-2 rounded-full transition-colors",
                                    i === currentStep ? "bg-[var(--primary)]" : "bg-[var(--secondary)] border border-[var(--border)]"
                                )}
                            />
                        ))}
                    </div>

                    <div className="flex gap-[var(--spacing-sm)]">
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={currentStep === 0}
                            onClick={() => setCurrentStep(p => p - 1)}
                            className="text-xs h-8"
                        >
                            Atrás
                        </Button>
                        <Button size="sm" onClick={handleNext} className="text-xs h-8">
                            {currentStep === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );

    // Mount in document.body to escape z-index context issues
    if (typeof document === 'undefined') return null;
    return createPortal(content, document.body);
};
