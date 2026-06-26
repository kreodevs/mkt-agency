import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { StatusPill } from '@/components/atoms/StatusPill';
import { Card } from '@/components/molecules/Card';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import { getDomain, verifyDomainDns } from '@/services/domains';
import {
  SSL_STATUS_LABELS,
  VERIFICATION_STATUS_LABELS,
  type CustomDomain,
  type SslStatus,
  type VerificationStatus,
} from '@/types/domains';

const verificationStatus: Record<
  VerificationStatus,
  'success' | 'warning' | 'error'
> = {
  pending: 'warning',
  verified: 'success',
  failed: 'error',
};

const sslStatus: Record<SslStatus, 'success' | 'warning' | 'error' | 'info'> = {
  pending: 'warning',
  processing: 'info',
  active: 'success',
  failed: 'error',
};

interface DNSVerificationProps {
  domainId: string;
  initial?: CustomDomain;
}

export function DNSVerification({ domainId, initial }: DNSVerificationProps) {
  const queryClient = useQueryClient();

  const domainQuery = useQuery({
    queryKey: ['domain', domainId],
    queryFn: () => getDomain(domainId),
    initialData: initial,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      if (data.sslStatus === 'processing') return 3000;
      return false;
    },
  });

  const verifyMutation = useMutation({
    mutationFn: () => verifyDomainDns(domainId),
    onSuccess: (updated) => {
      queryClient.setQueryData(['domain', domainId], updated);
      void queryClient.invalidateQueries({ queryKey: ['domains'] });
      toast.success('DNS verificado. Emitiendo certificado SSL…');
    },
    onError: (error) => {
      void domainQuery.refetch();
      toast.error(error instanceof ApiError ? error.message : 'Verificación DNS fallida');
    },
  });

  const domain = domainQuery.data;
  if (!domain) {
    return null;
  }

  const txtRecord = `_mktos-verify.${domain.domain}`;

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill status={verificationStatus[domain.verificationStatus]}>
          DNS: {VERIFICATION_STATUS_LABELS[domain.verificationStatus]}
        </StatusPill>
        <StatusPill status={sslStatus[domain.sslStatus]}>
          SSL: {SSL_STATUS_LABELS[domain.sslStatus]}
        </StatusPill>
        {domain.isActive ? (
          <StatusPill status="success">
            <CheckCircle2 className="mr-1 inline h-3 w-3" />
            Dominio activo
          </StatusPill>
        ) : null}
      </div>

      <div className="space-y-2 text-sm text-[var(--foreground-muted)]">
        <p>
          Crea un registro <strong>CName</strong> en tu DNS apuntando a:
        </p>
        <code className="block rounded bg-[var(--muted)] px-3 py-2 font-mono text-[var(--foreground)]">
          {domain.domain} → {domain.cnameValue ?? '—'}
        </code>
        <p>
          Alternativa: registro <strong>TXT</strong> en{' '}
          <code className="font-mono">{txtRecord}</code> con valor:
        </p>
        <code className="block break-all rounded bg-[var(--muted)] px-3 py-2 font-mono text-[var(--foreground)]">
          {domain.verificationToken ?? '—'}
        </code>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => verifyMutation.mutate()}
          disabled={
            verifyMutation.isPending ||
            domain.verificationStatus === 'verified' ||
            domain.sslStatus === 'processing'
          }
        >
          {verifyMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Verificar DNS
        </Button>
        {domain.sslStatus === 'processing' ? (
          <span className="flex items-center text-sm text-[var(--foreground-muted)]">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Emitiendo certificado SSL…
          </span>
        ) : null}
      </div>
    </Card>
  );
}
