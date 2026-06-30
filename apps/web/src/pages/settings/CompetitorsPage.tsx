import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { MentionList, filterSelectClass } from '@/components/competitors/MentionList';
import { Button } from '@/components/atoms/Button';
import { IconButton, ACTION_BUTTON_GROUP_CLASS } from '@/components/atoms/IconButton';
import { InputText } from '@/components/atoms/InputText';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { DataTable, type DataTableColumn } from '@/components/organisms/DataTable';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import { createCompetitor, deleteCompetitor, listCompetitors } from '@/services/competitors';
import { CompetitorDiscoveryPanel } from '@/components/competitors/CompetitorDiscoveryPanel';
import { SENTIMENT_LABELS, type Competitor, type MentionSentiment } from '@/types/competitors';

export default function CompetitorsPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sentimentFilter, setSentimentFilter] = useState<'' | MentionSentiment>('');
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');

  const competitorsQuery = useQuery({
    queryKey: ['competitors'],
    queryFn: listCompetitors,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createCompetitor({
        name: name.trim(),
        website: website.trim() || undefined,
        industry: industry.trim() || undefined,
      }),
    onSuccess: (competitor) => {
      void queryClient.invalidateQueries({ queryKey: ['competitors'] });
      setSelectedId(competitor.id);
      setName('');
      setWebsite('');
      setIndustry('');
      toast.success('Competidor registrado');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo registrar');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCompetitor,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['competitors'] });
      setSelectedId(null);
      toast.message('Competidor eliminado');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo eliminar');
    },
  });

  const items = competitorsQuery.data?.items ?? [];
  const selected = items.find((item) => item.id === selectedId) ?? null;

  const columns: DataTableColumn[] = [
    { field: 'name', header: 'Nombre', sortable: true },
    {
      field: 'website',
      header: 'Web',
      body: (row) => {
        const site = (row as Competitor).website;
        if (!site) return '—';
        return (
          <a
            href={site.startsWith('http') ? site : `https://${site}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--primary)] hover:underline"
          >
            {site}
          </a>
        );
      },
    },
    { field: 'industry', header: 'Sector', body: (row) => (row as Competitor).industry ?? '—' },
    {
      field: 'actions',
      header: '',
      body: (row) => {
        const competitor = row as Competitor;
        return (
          <div className={`${ACTION_BUTTON_GROUP_CLASS} justify-end`}>
            <IconButton type="button" label="Ver menciones" onClick={() => setSelectedId(competitor.id)}>
              <MessageSquare />
            </IconButton>
            <IconButton
              type="button"
              tone="destructive"
              label="Eliminar competidor"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(competitor.id)}
            >
              <Trash2 />
            </IconButton>
          </div>
        );
      },
    },
  ];

  return (
    <DashboardShell>
      <div className="space-y-6">
        <PageHeader
          title="Competidores"
          description="Registra competidores y consulta menciones detectadas en fuentes públicas."
        />

        <Card className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <InputText
            label="Nombre"
            placeholder="Competidor S.L."
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <InputText
            label="Web (opcional)"
            placeholder="competidor.com"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
          />
          <InputText
            label="Sector (opcional)"
            placeholder="Retail"
            value={industry}
            onChange={(event) => setIndustry(event.target.value)}
          />
          <Button
            type="button"
            onClick={() => createMutation.mutate()}
            disabled={!name.trim() || createMutation.isPending}
          >
            <Plus className="mr-2 h-4 w-4" />
            Registrar
          </Button>
        </Card>

        {items.length === 0 && !competitorsQuery.isLoading && (
          <CompetitorDiscoveryPanel
            onRegistered={() => {
              void queryClient.invalidateQueries({ queryKey: ['competitors'] });
            }}
          />
        )}

        <DataTable
          columns={columns}
          data={items}
          loading={competitorsQuery.isLoading}
          emptyMessage="Aún no hay competidores registrados"
        />

        {selected ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Menciones — {selected.name}
              </h2>
              <select
                className={filterSelectClass}
                value={sentimentFilter}
                onChange={(event) =>
                  setSentimentFilter(event.target.value as '' | MentionSentiment)
                }
              >
                <option value="">Todos los sentimientos</option>
                {Object.entries(SENTIMENT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <MentionList competitorId={selected.id} sentimentFilter={sentimentFilter} />
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}
