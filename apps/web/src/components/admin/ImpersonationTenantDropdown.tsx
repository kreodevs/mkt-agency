import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IMPERSONATION_SELECT_CLASS } from './impersonation-select.constants';

export const IMPERSONATION_CONSOLE_VALUE = '__console__';

export interface ImpersonationTenantOption {
  id: string;
  name: string;
}

interface ImpersonationTenantDropdownProps {
  value: string;
  options: ImpersonationTenantOption[];
  onSelect: (value: string) => void;
  busy?: boolean;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

export function ImpersonationTenantDropdown({
  value,
  options,
  onSelect,
  busy = false,
  loading = false,
  error = null,
  className,
}: ImpersonationTenantDropdownProps) {
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const label =
    value === IMPERSONATION_CONSOLE_VALUE
      ? 'Consola superadmin'
      : (options.find((option) => option.id === value)?.name ?? 'Tenant');

  useEffect(() => {
    if (!open || !triggerRef.current) return;

    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const width = Math.max(rect.width, 224);

      setMenuStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8),
        width,
        zIndex: 1060,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      const menu = document.getElementById(menuId);
      if (menu?.contains(target)) return;
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuId, open]);

  const handleSelect = (next: string) => {
    setOpen(false);
    onSelect(next);
  };

  const menu =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            id={menuId}
            role="listbox"
            style={menuStyle}
            className="max-h-panel-md overflow-y-auto rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] py-1 shadow-lg"
          >
            <button
              type="button"
              role="option"
              aria-selected={value === IMPERSONATION_CONSOLE_VALUE}
              className={cn(
                'flex w-full items-center px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--secondary)]',
                value === IMPERSONATION_CONSOLE_VALUE && 'bg-[var(--secondary)] font-semibold',
              )}
              onClick={() => handleSelect(IMPERSONATION_CONSOLE_VALUE)}
            >
              Consola superadmin
            </button>

            {loading ? (
              <div className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--foreground-muted)]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Cargando tenants…
              </div>
            ) : null}

            {error ? (
              <div className="px-3 py-2 text-xs text-[var(--destructive)]">{error}</div>
            ) : null}

            {!loading && !error && options.length === 0 ? (
              <div className="px-3 py-2 text-xs text-[var(--foreground-muted)]">
                No hay tenants activos
              </div>
            ) : null}

            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={value === option.id}
                className={cn(
                  'flex w-full items-center px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--secondary)]',
                  value === option.id && 'bg-[var(--secondary)] font-semibold',
                )}
                onClick={() => handleSelect(option.id)}
              >
                <span className="truncate">{option.name}</span>
              </button>
            ))}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={busy}
        title="Impersonar tenant"
        className={cn(
          IMPERSONATION_SELECT_CLASS,
          'inline-flex items-center justify-between gap-2 text-left',
          className,
        )}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="min-w-0 truncate">{busy ? 'Impersonando…' : label}</span>
        {busy ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        ) : (
          <ChevronDown className={cn('h-4 w-4 shrink-0 opacity-60 transition-transform', open && 'rotate-180')} />
        )}
      </button>
      {menu}
    </>
  );
}
