import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Settings2, Trash2 } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { DNSVerification } from '@/components/domains/DNSVerification';
import { Button } from '@/components/atoms/Button';
import { IconButton } from '@/components/atoms/IconButton';
import { InputText } from '@/components/atoms/InputText';
import { StatusPill } from '@/components/atoms/StatusPill';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { DataTable, type DataTableColumn } from '@/components/organisms/DataTable';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import { createDomain, deleteDomain, listDomains } from '@/services/domains';
import {
  SSL_STATUS_LABELS,
  VERIFICATION_STATUS_LABELS,
  type CustomDomain,
} from '@/types/domains';

export default function DomainSettingsPage() {
  const queryClient = useQueryClient();
  const [newDomain, setNewDomain] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const domainsQuery = useQuery({
    queryKey: ['domains'],
    queryFn: listDomains,
  });

  const createMutation = useMutation({
    mutationFn: () => createDomain(newDomain.trim()),
    onSuccess: (domain) => {
      void queryClient.invalidateQueries({ queryKey: ['domains'] });
      setSelectedId(domain.id);
      setNewDomain('');
      toast.success('Dominio registrado');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo registrar');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDomain,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['domains'] });
      setSelectedId(null);
      toast.message('Dominio eliminado');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo eliminar');
    },
  });

  const items = domainsQuery.data?.items ?? [];
  const selected = items.find((item) => item.id === selectedId) ?? null;

  const columns: DataTableColumn[] = [
    { field: 'domain', header: 'Dominio', sortable: true },
    {
      field: 'verificationStatus',
      header: 'DNS',
      body: (row: CustomDomain) => (
        <StatusPill status={row.verificationStatus === 'verified' ? 'success' : 'warning'} size="sm">
          {VERIFICATION_STATUS_LABELS[row.verificationStatus]}
        </StatusPill>
      ),
    },
    {
      field: 'sslStatus',
      header: 'SSL',
      body: (row: CustomDomain) => (
        <StatusPill status={row.sslStatus === 'active' ? 'success' : 'warning'} size="sm">
          {SSL_STATUS_LABELS[row.sslStatus]}
        </StatusPill>
      ),
    },
    {
      field: 'actions',
      header: '',
      body: (row: CustomDomain) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            type="button"
            variant="ghost"
            label="Configurar dominio"
            onClick={() => setSelectedId(row.id)}
          >
            <Settings2 className="h-4 w-4" />
          </IconButton>
          <IconButton
            type="button"
            variant="ghost"
            label="Eliminar dominio"
            className="text-[var(--destructive)] hover:text-[var(--destructive)]"
            disabled={row.isActive || deleteMutation.isPending}
            onClick={() => deleteMutation.mutate(row.id)}
          >
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <DashboardShell>
      <div className="space-y-6">
        <PageHeader
          title="Dominio personalizado"
          description="Configura un CNAME para acceder al dashboard con tu marca (whitelabel)."
        />

        <Card className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <InputText
              label="Nuevo dominio"
              placeholder="marketing.miempresa.com"
              value={newDomain}
              onChange={(event) => setNewDomain(event.target.value)}
            />
          </div>
          <Button
            type="button"
            onClick={() => createMutation.mutate()}
            disabled={!newDomain.trim() || createMutation.isPending}
          >
            <Plus className="mr-2 h-4 w-4" />
            Registrar
          </Button>
        </Card>

        <DataTable
          columns={columns}
          data={items}
          loading={domainsQuery.isLoading}
          emptyMessage="Aún no hay dominios configurados"
        />

        {selected ? (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Verificación — {selected.domain}
            </h2>
            <DNSVerification domainId={selected.id} initial={selected} />
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}
