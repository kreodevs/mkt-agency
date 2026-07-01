import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, X } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import { updateCampaign } from '@/services/campaigns';
import {
  CAMPAIGN_PLATFORMS,
  campaignPlatformLabel,
} from '@/utils/campaignPlatforms';

interface CampaignPlatformEditorProps {
  campaignId: string;
  platforms: string[];
}

export function CampaignPlatformEditor({ campaignId, platforms }: CampaignPlatformEditorProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<string[]>(platforms);

  useEffect(() => {
    if (!editing) {
      setSelected(platforms);
    }
  }, [platforms, editing]);

  const saveMutation = useMutation({
    mutationFn: (nextPlatforms: string[]) => updateCampaign(campaignId, { platforms: nextPlatforms }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Plataformas actualizadas');
      setEditing(false);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudieron guardar las plataformas');
    },
  });

  const togglePlatform = (platform: string) => {
    setSelected((prev) =>
      prev.includes(platform) ? prev.filter((item) => item !== platform) : [...prev, platform],
    );
  };

  const handleSave = () => {
    if (selected.length === 0) {
      toast.message('Selecciona al menos una plataforma');
      return;
    }
    saveMutation.mutate(selected);
  };

  if (!editing) {
    return (
      <div>
        <dt className="flex items-center justify-between gap-2 text-[var(--foreground-muted)]">
          <span>Plataformas</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => setEditing(true)}
          >
            <Pencil className="h-3 w-3" />
            Editar
          </Button>
        </dt>
        <dd className="mt-1 capitalize text-[var(--foreground)]">
          {platforms.length > 0 ? platforms.map(campaignPlatformLabel).join(', ') : '—'}
        </dd>
      </div>
    );
  }

  return (
    <div className="sm:col-span-2">
      <dt className="mb-2 text-[var(--foreground-muted)]">Plataformas</dt>
      <dd>
        <div className="mb-3 flex flex-wrap gap-2">
          {CAMPAIGN_PLATFORMS.map((platform) => {
            const isSelected = selected.includes(platform);
            return (
              <button
                key={platform}
                type="button"
                onClick={() => togglePlatform(platform)}
                className={`rounded-full border px-3 py-1 text-xs capitalize transition-colors ${
                  isSelected
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                    : 'border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--primary)]/40'
                }`}
              >
                {campaignPlatformLabel(platform)}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" loading={saveMutation.isPending} onClick={handleSave}>
            Guardar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={saveMutation.isPending}
            className="gap-1"
            onClick={() => {
              setSelected(platforms);
              setEditing(false);
            }}
          >
            <X className="h-3.5 w-3.5" />
            Cancelar
          </Button>
        </div>
      </dd>
    </div>
  );
}
