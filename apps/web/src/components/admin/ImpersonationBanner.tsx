import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/atoms/Button';
import { endImpersonation } from '@/services/superadmin';
import { useAuthStore } from '@/store/auth';

export function ImpersonationBanner() {
  const navigate = useNavigate();
  const impersonation = useAuthStore((s) => s.impersonation);
  const [loading, setLoading] = useState(false);

  if (!impersonation) {
    return null;
  }

  const handleEnd = async () => {
    setLoading(true);
    try {
      await endImpersonation();
      navigate('/tenants');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--warning)]/30 bg-[var(--warning)]/15 px-4 py-3 text-sm text-[var(--foreground)]"
    >
      <div className="flex items-center gap-2 font-medium">
        <AlertTriangle className="h-4 w-4 text-[var(--warning)]" aria-hidden />
        <span>
          IMPERSONANDO — {impersonation.tenantName} como {impersonation.userName}
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => void handleEnd()}
      >
        {loading ? 'Finalizando…' : 'Salir de impersonación'}
      </Button>
    </div>
  );
}
