// REGISTRY: ColorPicker

import { forwardRef } from 'react'
import { ColorPicker as PrimeColorPicker, type ColorPickerProps as PrimeColorPickerProps } from 'primereact/colorpicker'
import { cn } from '@/lib/utils'

export interface ColorPickerProps extends PrimeColorPickerProps {
    label?: string;
}

export const ColorPicker = forwardRef<PrimeColorPicker, ColorPickerProps>(
    ({ className, label, ...props }, ref) => {
        return (
            <div className="flex items-center gap-[var(--spacing-md)]">
                {label && <label className="text-sm font-medium text-[var(--foreground)]">{label}</label>}
                <PrimeColorPicker
                    ref={ref}
                    className={cn("", className)}
                    pt={{
                        input: { className: "w-8 h-8 rounded-full shrink-0 cursor-pointer overflow-hidden border border-[var(--border)] shadow-sm focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 transition-shadow" }
                    }}
                    {...props}
                />
            </div>
        )
    }
)
ColorPicker.displayName = 'ColorPicker'
