import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/atoms/Button';
import { InputText } from '@/components/atoms/InputText';
import { Textarea } from '@/components/atoms/Textarea';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import { createCampaign, listCampaignTemplates } from '@/services/campaigns';
import type { CreateCampaignPayload } from '@/types/campaign';

const PLATFORMS = ['facebook', 'instagram', 'google', 'linkedin', 'tiktok', 'email'] as const;

const selectClass =
  'h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';

export default function CampaignCreatePage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [platforms, setPlatforms] = useState<string[]>([]);

  const templatesQuery = useQuery({
    queryKey: ['campaign-templates'],
    queryFn: () => listCampaignTemplates({ page: 1, limit: 50 }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateCampaignPayload) => createCampaign(payload),
    onSuccess: (campaign) => {
      toast.success('Campaña creada');
      navigate(`/campaigns/${campaign.id}`);
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : 'No se pudo crear la campaña';
      toast.error(message);
    },
  });

  const togglePlatform = (platform: string) => {
    setPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform],
    );
  };

  const onTemplateChange = (id: string) => {
    setTemplateId(id);
    const template = templatesQuery.data?.items.find((t) => t.id === id);
    if (template) {
      if (!objective && template.objective) setObjective(template.objective);
      if (platforms.length === 0 && template.platforms.length > 0) {
        setPlatforms(template.platforms);
      }
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const payload: CreateCampaignPayload = {
      name: name.trim(),
      objective: objective.trim() || undefined,
      templateId: templateId || undefined,
      platforms: platforms.length > 0 ? platforms : undefined,
    };

    const budget = parseFloat(totalBudget);
    if (!Number.isNaN(budget) && budget > 0) {
      payload.totalBudget = budget;
    }

    createMutation.mutate(payload);
  };

  return (
    <DashboardShell>
      <PageHeader
        title="Nueva campaña"
        description="Crea una campaña desde cero o basada en una plantilla"
      />

      <Card>
        <form className="mx-auto max-w-xl space-y-4" onSubmit={onSubmit}>
          <InputText
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
          />

          <div className="flex flex-col gap-[var(--spacing-xs)]">
            <label className="text-sm font-medium text-[var(--foreground)]">Objetivo</label>
            <Textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-[var(--spacing-xs)]">
            <label className="text-sm font-medium text-[var(--foreground)]">
              Plantilla (opcional)
            </label>
            <select
              className={selectClass}
              value={templateId}
              onChange={(e) => onTemplateChange(e.target.value)}
              disabled={templatesQuery.isLoading}
            >
              <option value="">Sin plantilla</option>
              {templatesQuery.data?.items.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                  {template.isPredefined ? ' (predefinida)' : ''}
                </option>
              ))}
            </select>
          </div>

          <InputText
            label="Presupuesto total (USD)"
            type="number"
            min="0"
            step="0.01"
            value={totalBudget}
            onChange={(e) => setTotalBudget(e.target.value)}
            fullWidth
          />

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-[var(--foreground)]">
              Plataformas
            </legend>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((platform) => {
                const selected = platforms.includes(platform);
                return (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => togglePlatform(platform)}
                    className={`rounded-full border px-3 py-1 text-xs capitalize transition-colors ${
                      selected
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                        : 'border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--primary)]/40'
                    }`}
                  >
                    {platform}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => navigate('/campaigns')}>
              Cancelar
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Crear campaña
            </Button>
          </div>
        </form>
      </Card>
    </DashboardShell>
  );
}
