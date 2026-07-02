import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Globe, Zap } from 'lucide-react';
import { DashboardShell, superadminNavigation } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { Button } from '@/components/atoms/Button';
import { Password } from '@/components/atoms/Password';
import { StatusPill } from '@/components/atoms/StatusPill';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import {
  getTavilyIntegration,
  testTavilyIntegration,
  updateTavilyIntegration,
} from '@/services/superadmin';

export default function IntegrationsPage() {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState('');
  const [isActive, setIsActive] = useState(true);

  const tavilyQuery = useQuery({
    queryKey: ['integration-tavily'],
    queryFn: getTavilyIntegration,
  });

  const integration = tavilyQuery.data;

  useEffect(() => {
    if (integration) {
      setIsActive(integration.isActive);
    }
  }, [integration]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateTavilyIntegration({
        isActive,
        ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integration-tavily'] });
      setApiKey('');
      toast.success('Integración Tavily actualizada');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo guardar Tavily');
    },
  });

  const testMutation = useMutation({
    mutationFn: testTavilyIntegration,
    onSuccess: (result) => {
      toast.success(`Conexión OK — ${result.resultCount} resultado(s) en prueba`);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'La prueba de Tavily falló');
    },
  });

  const configured = integration?.apiKeyConfigured ?? false;

  return (
    <DashboardShell navigationOverride={superadminNavigation}>
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          title="Integraciones"
          description="Servicios externos usados por agentes de la plataforma."
        />

        <Card className="space-y-5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-[var(--primary)]" />
                <h2 className="text-lg font-semibold">Tavily Search</h2>
              </div>
              <p className="text-sm text-[var(--foreground-muted)]">
                Búsqueda web en tiempo real para descubrir competidores con evidencia verificable.
                Se usa en el descubrimiento de competidores junto al LLM.
              </p>
            </div>
            <StatusPill
              status={configured && integration?.isActive ? 'success' : 'warning'}
            >
              {configured && integration?.isActive
                ? 'Activa'
                : configured
                  ? 'Inactiva'
                  : 'Sin API key'}
            </StatusPill>
          </div>

          <div className="grid gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">API key</label>
              <Password
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder={
                  configured
                    ? `Configurada (${integration?.apiKeyHint ?? '••••'}) — deja vacío para mantener`
                    : 'tvly-...'
                }
              />
              <p className="text-xs text-[var(--foreground-muted)]">
                Obtén tu clave en{' '}
                <a
                  href="https://tavily.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--primary)] underline"
                >
                  tavily.com
                </a>
                . La clave nunca se muestra completa tras guardarla.
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
              />
              Integración activa
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || (!configured && !apiKey.trim())}
            >
              Guardar
            </Button>
            <Button
              variant="outline"
              onClick={() => testMutation.mutate()}
              disabled={!configured || testMutation.isPending}
            >
              <Zap className="mr-2 h-4 w-4" />
              Probar conexión
            </Button>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
