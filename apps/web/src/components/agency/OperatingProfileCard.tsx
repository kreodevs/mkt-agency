import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/molecules/Card';
import { Button } from '@/components/atoms/Button';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import { useOperatingProfile } from '@/hooks/useOperatingProfile';
import type { AdBudgetConfig, TenantProfile } from '@/types/operating-profile';
import { AGENT_ROLE_LABELS, SUBPROFILE_LABELS } from '@/types/operating-profile';

const PLATFORMS: AdBudgetConfig['platforms'] = ['meta', 'google', 'tiktok'];

export function OperatingProfileCard() {
  const { data, updateProfile, isUpdating } = useOperatingProfile();
  const queryClient = useQueryClient();

  const [profile, setProfile] = useState<TenantProfile>('soho');
  const [adEnabled, setAdEnabled] = useState(false);
  const [monthlyCap, setMonthlyCap] = useState('');
  const [platforms, setPlatforms] = useState<AdBudgetConfig['platforms']>([]);

  useEffect(() => {
    if (!data) return;
    setProfile(data.profile.profile);
    setAdEnabled(data.profile.adBudget.enabled);
    setMonthlyCap(
      data.profile.adBudget.monthlyCap != null ? String(data.profile.adBudget.monthlyCap) : '',
    );
    setPlatforms(data.profile.adBudget.platforms);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await updateProfile({
        profile,
        adBudget: {
          enabled: profile === 'growth' && adEnabled,
          monthlyCap: adEnabled && monthlyCap ? Number(monthlyCap) : null,
          currency: 'MXN',
          platforms: adEnabled ? platforms : [],
        },
        campaignExecutionMode:
          profile === 'growth' && adEnabled && Number(monthlyCap) > 0 ? 'paid' : 'organic',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operating-profile'] });
      toast.success('Perfil actualizado');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo guardar');
    },
  });

  if (!data) return null;

  return (
    <Card
      title="Perfil de operación"
      subtitle={
        SUBPROFILE_LABELS[data.subProfile] +
        ' — define si usas copiloto SOHO o agencia Growth con pauta opcional'
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--border)] p-3">
            <input
              type="radio"
              name="operating-profile"
              checked={profile === 'soho'}
              onChange={() => setProfile('soho')}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium">Copiloto SOHO</span>
              <span className="text-xs text-[var(--foreground-muted)]">
                Preparo contenido, tú publicas manualmente. Sin campañas ni pauta.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--border)] p-3">
            <input
              type="radio"
              name="operating-profile"
              checked={profile === 'growth'}
              onChange={() => setProfile('growth')}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium">Growth / Agencia</span>
              <span className="text-xs text-[var(--foreground-muted)]">
                Campañas, estrategia, métricas. Opcional: presupuesto de publicidad pagada.
              </span>
            </span>
          </label>
        </div>

        {profile === 'growth' && (
          <div className="rounded-lg border border-dashed border-[var(--border)] p-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={adEnabled}
                onChange={(e) => setAdEnabled(e.target.checked)}
              />
              <span className="text-sm font-medium">Invierto en publicidad pagada</span>
            </label>
            {adEnabled && (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="text-xs font-medium text-[var(--foreground-muted)]">
                    Presupuesto mensual (MXN)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={monthlyCap}
                    onChange={(e) => setMonthlyCap(e.target.value)}
                    className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
                    placeholder="Ej. 15000"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((platform) => {
                    const active = platforms.includes(platform);
                    return (
                      <button
                        key={platform}
                        type="button"
                        onClick={() =>
                          setPlatforms(
                            active
                              ? platforms.filter((p) => p !== platform)
                              : [...platforms, platform],
                          )
                        }
                        className={`rounded-md border px-2 py-1 text-xs capitalize ${
                          active
                            ? 'border-[var(--primary)] text-[var(--primary)]'
                            : 'border-[var(--border)]'
                        }`}
                      >
                        {platform}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="rounded-lg bg-[var(--muted)]/30 p-3">
          <p className="text-xs font-medium text-[var(--foreground-muted)]">Agentes activos</p>
          <ul className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
            {Object.entries(data.capabilities).map(([role, cap]) => (
              <li key={role} className={cap.active ? 'text-[var(--foreground)]' : 'opacity-40'}>
                {AGENT_ROLE_LABELS[role as keyof typeof AGENT_ROLE_LABELS]} — {cap.level}
              </li>
            ))}
          </ul>
        </div>

        <Button
          type="button"
          disabled={saveMutation.isPending || isUpdating}
          onClick={() => saveMutation.mutate()}
        >
          Guardar perfil
        </Button>
      </div>
    </Card>
  );
}
