import { useEffect } from 'react';
import { toast } from '@/components/molecules/Sonner';

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}

/** Atajos ligeros en la bandeja SOHO (solo cuando no hay foco en inputs). */
export function useInboxKeyboardHints(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      if (event.key === '?' && !event.metaKey && !event.ctrlKey) {
        toast.message(
          'Tip: «Copiar texto» + «Abrir red» publican rápido. «Ver ficha completa» para aprobar con contexto.',
          { duration: 6000 },
        );
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
