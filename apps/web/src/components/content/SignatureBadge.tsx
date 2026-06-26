import { ShieldCheck } from 'lucide-react';
import { StatusPill } from '@/components/atoms/StatusPill';

interface SignatureBadgeProps {
  signatureHash: string | null;
  signedAt: string | null;
}

export function SignatureBadge({ signatureHash, signedAt }: SignatureBadgeProps) {
  if (!signatureHash || !signedAt) {
    return (
      <StatusPill status="warning" size="sm">
        Sin firma
      </StatusPill>
    );
  }

  const shortHash = `${signatureHash.slice(0, 8)}…${signatureHash.slice(-8)}`;
  const signedLabel = new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(signedAt));

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)]/40 p-3">
      <div className="mb-2 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-[var(--primary)]" />
        <StatusPill status="success" size="sm">
          Firmado (Kill Switch)
        </StatusPill>
      </div>
      <p className="font-mono text-xs text-[var(--foreground-muted)]">{shortHash}</p>
      <p className="mt-1 text-xs text-[var(--foreground-muted)]">Firmado el {signedLabel}</p>
    </div>
  );
}

export default SignatureBadge;
