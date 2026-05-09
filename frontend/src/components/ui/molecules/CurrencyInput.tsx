// REGISTRY: CurrencyInput

import { forwardRef } from 'react'
import { InputNumber, type InputNumberProps } from 'primereact/inputnumber'
import { cn } from '@/lib/utils'

export interface CurrencyInputProps extends Omit<InputNumberProps, 'mode' | 'currency' | 'locale'> {
    label?: string;
    error?: string;
    currency?: string; // e.g. 'USD', 'MXN', 'EUR'
    locale?: string; // e.g. 'en-US', 'es-MX'
    decimals?: number; // Cuántos decimales permites (si se pasa, no rellena con ceros innecesarios)
}

export const CurrencyInput = forwardRef<InputNumber, CurrencyInputProps>(
    ({ className, label, error, currency = 'USD', locale = 'en-US', decimals, ...props }, ref) => {
        // Fallback robusto para evitar colapsos al teclear props en Storybook
        // currency requiere 3 letras ('USD', 'MXN').
        const safeCurrency = currency.length === 3 ? currency : 'USD';

        // locale requiere un formato BCP 47 válido, una manera simple de verificar
        // es que tenga al menos 4 caracteres si trae guion o no estar vacío.
        // Un chequeo de validez real usando Intl:
        let safeLocale = 'en-US';
        try {
            // Evaluamos si el navegador nativamente soporta el string en crudo
            Intl.NumberFormat(locale);
            safeLocale = locale;
        } catch (e) {
            safeLocale = 'en-US';
        }

        // Intercepta símbolos apretados como "MX$" y separa el texto del símbolo
        let resolvedMode: "currency" | "decimal" = "currency";
        let customPrefix: string | undefined = undefined;
        let defaultCurrencyDecimals = 2; // Por defecto

        try {
            const parts = new Intl.NumberFormat(safeLocale, { style: 'currency', currency: safeCurrency }).formatToParts(1.1);
            const currencyPart = parts.find(p => p.type === 'currency');

            // Si el motor empuja un string tipo "MX$" o "CA$" sin espacio
            if (currencyPart && currencyPart.value.length > 1 && currencyPart.value.endsWith('$')) {
                resolvedMode = 'decimal';
                customPrefix = currencyPart.value.replace('$', ' $ ');

                // Mantenemos los decimales originales de la moneda
                const fractionPart = parts.find(p => p.type === 'fraction');
                defaultCurrencyDecimals = fractionPart ? fractionPart.value.length : 0;
            }
        } catch (e) {
            // Ignorar errores en parseo nativo.
        }

        // Determinar límites de decimales finales a inyectar al InputNumber
        const finalMaxDecimals = decimals !== undefined ? decimals : (resolvedMode === 'decimal' ? defaultCurrencyDecimals : undefined);
        const finalMinDecimals = decimals !== undefined ? 0 : (resolvedMode === 'decimal' ? defaultCurrencyDecimals : undefined);

        return (
            <div className="flex flex-col gap-1.5 w-full">
                {label && <label className="text-sm font-medium leading-none text-[var(--foreground)]">{label}</label>}
                <InputNumber
                    ref={ref}
                    mode={resolvedMode}
                    currency={resolvedMode === 'currency' ? safeCurrency : undefined}
                    prefix={customPrefix}
                    minFractionDigits={props.minFractionDigits !== undefined ? props.minFractionDigits : finalMinDecimals}
                    maxFractionDigits={props.maxFractionDigits !== undefined ? props.maxFractionDigits : finalMaxDecimals}
                    locale={safeLocale}
                    className={cn("w-full", className)}
                    pt={{
                        root: { className: "w-full" },
                        input: {
                            root: {
                                className: cn(
                                    "flex h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-[var(--spacing-md)] py-[var(--spacing-sm)] text-sm ring-offset-[var(--background)] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--foreground-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
                                    error && "border-[var(--destructive)] focus-visible:ring-[var(--destructive)]"
                                )
                            }
                        }
                    }}
                    {...props}
                />
                {error && <span className="text-[14px] text-[var(--destructive)]">{error}</span>}
            </div>
        )
    }
)
CurrencyInput.displayName = 'CurrencyInput'
