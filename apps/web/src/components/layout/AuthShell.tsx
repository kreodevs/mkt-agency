import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AuthShellProps {
  children: ReactNode;
  /** Título principal de la pantalla (ej. «Iniciar sesión») */
  headline?: string;
  /** Subtítulo bajo el headline */
  tagline?: string;
  className?: string;
}

/**
 * Layout centrado para rutas públicas (login, setup).
 * Usa tokens Kreo, safe-area iOS y fondo con gradiente sutil.
 */
export function AuthShell({ children, headline, tagline, className }: AuthShellProps) {
  return (
    <div
      className={cn(
        'relative flex min-h-[100dvh] flex-col items-center justify-center bg-[var(--background)]',
        'px-[var(--spacing-md)] py-[var(--spacing-xl)]',
        'pt-[calc(var(--spacing-xl)+var(--safe-area-top))]',
        'pb-[calc(var(--spacing-xl)+var(--safe-area-bottom))]',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,var(--color-ivory-medium)_0%,transparent_55%)]"
        aria-hidden
      />

      <header className="relative mb-[var(--spacing-lg)] flex flex-col items-center gap-[var(--spacing-sm)] text-center">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] text-[var(--primary)] shadow-sm"
          aria-hidden
        >
          <Sparkles className="h-6 w-6" />
        </div>
        <p className="type-detail-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
          Mkt Agency OS
        </p>
        {headline ? (
          <h1 className="type-ui-sans-semibold text-[var(--foreground)]">{headline}</h1>
        ) : null}
        {tagline ? (
          <p className="max-w-sm type-body-serif-s text-[var(--foreground-muted)]">{tagline}</p>
        ) : null}
      </header>

      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}

export default AuthShell;
