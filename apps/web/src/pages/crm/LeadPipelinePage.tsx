import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { CreateLeadDialog, type CreateLeadFormValues } from '@/components/crm/CreateLeadDialog';
import { LeadDetail } from '@/components/crm/LeadDetail';
import { LeadDetailMobileSheet } from '@/components/crm/LeadDetailMobileSheet';
import { LeadPipeline } from '@/components/crm/LeadPipeline';
import { Button } from '@/components/atoms/Button';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import { useOperatingProfile } from '@/hooks/useOperatingProfile';
import { useMobileLeadDetailLayout } from '@/hooks/useMediaQuery';
import { useResolvedProductId } from '@/hooks/useResolvedProductId';
import { changeLeadStage, createLead, deleteLead, getLead, listLeads } from '@/services/leads';
import { listProducts } from '@/services/products';
import type { LeadStage } from '@/types/lead.constants';

const selectClass =
  'h-10 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';

export default function LeadPipelinePage() {
  const queryClient = useQueryClient();
  const { isSoho } = useOperatingProfile();
  const activeProductId = useResolvedProductId();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [productFilter, setProductFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: () => listProducts({ status: 'active', limit: 100 }),
  });

  const products = productsQuery.data?.items ?? [];
  const productNameById = useMemo(
    () => new Map(products.map((p) => [p.id, p.name])),
    [products],
  );

  const leadsQuery = useQuery({
    queryKey: ['leads', productFilter],
    queryFn: () =>
      listLeads({
        page: 1,
        limit: 100,
        ...(productFilter ? { productId: productFilter } : {}),
      }),
  });

  const leadDetailQuery = useQuery({
    queryKey: ['lead', selectedId],
    queryFn: () => getLead(selectedId!),
    enabled: !!selectedId,
  });

  const createMutation = useMutation({
    mutationFn: (values: CreateLeadFormValues) =>
      createLead({
        email: values.email.trim(),
        name: values.name.trim() || undefined,
        phone: values.phone.trim() || undefined,
        company: values.company.trim() || undefined,
        productId: values.productId || undefined,
        note: values.note.trim() || undefined,
      }),
    onSuccess: (lead) => {
      void queryClient.invalidateQueries({ queryKey: ['leads'] });
      setCreateOpen(false);
      setSelectedId(lead.id);
      toast.success('Lead creado');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo crear el lead');
    },
  });

  const stageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: LeadStage }) =>
      changeLeadStage(id, { stage }),
    onSuccess: (lead) => {
      void queryClient.invalidateQueries({ queryKey: ['leads'] });
      void queryClient.invalidateQueries({ queryKey: ['lead', lead.id] });
      void queryClient.invalidateQueries({ queryKey: ['lead-interactions', lead.id] });
      toast.success('Etapa actualizada');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo mover el lead');
      void queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteLead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leads'] });
      setSelectedId(null);
      toast.message('Lead eliminado');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo eliminar');
    },
  });

  const leads = leadsQuery.data?.items ?? [];
  const selectedLead = leadDetailQuery.data ?? null;
  const selectedProductName = selectedLead?.productId
    ? productNameById.get(selectedLead.productId) ?? null
    : null;

  const defaultCreateProductId = productFilter || activeProductId;
  const isMobileLeadLayout = useMobileLeadDetailLayout();

  return (
    <DashboardShell>
      <PageHeader
        title="Pipeline CRM"
        description={
          isSoho
            ? 'Prospectos desde inbox social, formularios o alta manual — arrastra tarjetas entre etapas'
            : 'Leads capturados desde formularios — filtra por producto, score IA y etapas Kanban'
        }
        actions={
          <div className="flex flex-wrap items-end gap-3">
            <Button type="button" className="gap-1.5" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Agregar lead
            </Button>
            <div className="min-w-[200px]">
              <label className="mb-1 block text-xs font-medium text-[var(--foreground-muted)]">
                Filtrar por producto
              </label>
              <select
                className={selectClass}
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
              >
                <option value="">Todos los productos</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <LeadPipeline
            leads={leads}
            loading={leadsQuery.isLoading}
            selectedId={selectedId}
            productNameById={productNameById}
            onStageChange={(id, stage) => stageMutation.mutate({ id, stage })}
            onSelectLead={setSelectedId}
          />
        </Card>

        <div className="hidden lg:col-span-2 lg:block">
          <LeadDetail
            lead={selectedLead}
            productName={selectedProductName}
            loading={!!selectedId && leadDetailQuery.isLoading}
            onClose={() => setSelectedId(null)}
            onDelete={(id) => deleteMutation.mutate(id)}
            deleting={deleteMutation.isPending}
          />
        </div>
      </div>

      {isMobileLeadLayout ? (
        <LeadDetailMobileSheet
          open={!!selectedId}
          lead={selectedLead}
          productName={selectedProductName}
          loading={!!selectedId && leadDetailQuery.isLoading}
          onClose={() => setSelectedId(null)}
          onDelete={(id) => deleteMutation.mutate(id)}
          deleting={deleteMutation.isPending}
        />
      ) : null}

      <CreateLeadDialog
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(values) => createMutation.mutate(values)}
        isPending={createMutation.isPending}
        products={products}
        defaultProductId={defaultCreateProductId}
      />
    </DashboardShell>
  );
}
