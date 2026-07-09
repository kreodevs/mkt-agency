import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Instagram,
  Linkedin,
  MessageCircle,
  Music2,
  Twitter,
} from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { OperatingProfileCard } from '@/components/agency/OperatingProfileCard';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { Button } from '@/components/atoms/Button';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import {
  getCommunityManagerPreferences,
  saveCommunityManagerPreferences,
  type CmPlatform,
} from '@/services/community-manager';
import { useOperatingProfile } from '@/hooks/useOperatingProfile';

const PLATFORM_ICONS: Record<CmPlatform, React.FC<{ className?: string }>> = {
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: Twitter,
  facebook: MessageCircle,
  tiktok: Music2,
};

const PLATFORM_LABELS: Record<CmPlatform, string> = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  twitter: 'X / Twitter',
  facebook: 'Facebook',
  tiktok: 'TikTok',
};

const ALL_PLATFORMS = Object.keys(PLATFORM_LABELS) as CmPlatform[];

export default function CopilotSettingsPage() {
  const queryClient = useQueryClient();
  const { isGrowth } = useOperatingProfile();
  const [platforms, setPlatforms] = useState<CmPlatform[]>(['instagram', 'linkedin']);
  const [count, setCount] = useState(7);
  const [prefsReady, setPrefsReady] = useState(false);

  const preferencesQuery = useQuery({
    queryKey: ['cm-preferences'],
    queryFn: getCommunityManagerPreferences,
  });

  useEffect(() => {
    if (!preferencesQuery.data || prefsReady) return;
    setPlatforms(preferencesQuery.data.platforms);
    setCount(preferencesQuery.data.count);
    setPrefsReady(true);
  }, [preferencesQuery.data, prefsReady]);

  const saveMutation = useMutation({
    mutationFn: saveCommunityManagerPreferences,
    onSuccess: (data) => {
      queryClient.setQueryData(['cm-preferences'], data);
      toast.success('Preferencias guardadas');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudieron guardar');
    },
  });

  const togglePlatform = (platform: CmPlatform) => {
    const next = platforms.includes(platform)
      ? platforms.filter((p) => p !== platform)
      : [...platforms, platform];
    if (next.length === 0) {
      toast.error('Selecciona al menos una red');
      return;
    }
    setPlatforms(next);
  };

  const handleSave = () => {
    saveMutation.mutate({ platforms, count });
  };

  return (
    <DashboardShell>
      <PageHeader
        title="Ajustes del copiloto"
        description="Redes donde publicas y cuántos posts generar por semana"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Redes sociales" subtitle="El copiloto generará copy para estas plataformas">
          <div className="flex flex-wrap gap-2">
            {ALL_PLATFORMS.map((platform) => {
              const Icon = PLATFORM_ICONS[platform];
              const active = platforms.includes(platform);
              return (
                <button
                  key={platform}
                  type="button"
                  onClick={() => togglePlatform(platform)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    active
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                      : 'border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--primary)]/40'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {PLATFORM_LABELS[platform]}
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            <label className="text-sm font-medium text-[var(--foreground)]">
              Publicaciones por semana
            </label>
            <input
              type="range"
              min={1}
              max={14}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="mt-2 w-full"
            />
            <p className="mt-1 text-xs text-[var(--foreground-muted)]">{count} post(s)</p>
          </div>

          <Button
            type="button"
            className="mt-4"
            disabled={saveMutation.isPending}
            onClick={handleSave}
          >
            Guardar preferencias
          </Button>
        </Card>

        <OperatingProfileCard />

        {isGrowth && (
          <Card title="Vista Growth" subtitle="Herramientas de agencia activas">
            <p className="text-sm text-[var(--foreground-muted)]">
              Tienes acceso a campañas, estrategia comercial y métricas avanzadas desde el menú
              lateral.
            </p>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
