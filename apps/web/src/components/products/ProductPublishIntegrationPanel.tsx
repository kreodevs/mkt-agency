import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, RefreshCw, Webhook } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { InputText } from '@/components/atoms/InputText';
import { Card } from '@/components/molecules/Card';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import {
  getProductPublishIntegration,
  updateProductPublishIntegration,
} from '@/services/products';
import type { UpdateProductPublishIntegrationPayload } from '@/types/product';

interface ProductPublishIntegrationPanelProps {
  productId: string;
}

const PLATFORM_PRESETS = ['instagram', 'facebook', 'linkedin', 'tiktok'] as const;

export function ProductPublishIntegrationPanel({ productId }: ProductPublishIntegrationPanelProps) {
  const queryClient = useQueryClient();
  const integrationQuery = useQuery({
    queryKey: ['product-publish-integration', productId],
    queryFn: () => getProductPublishIntegration(productId),
    enabled: Boolean(productId),
  });

  const [enabled, setEnabled] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [autoDispatchOnReady, setAutoDispatchOnReady] = useState(false);
  const [linkedinAccountId, setLinkedinAccountId] = useState('');
  const [metaPageId, setMetaPageId] = useState('');

  useEffect(() => {
    const data = integrationQuery.data;
    if (!data) return;
    setEnabled(data.enabled);
    setWebhookUrl(data.webhookUrl ?? '');
    setAutoDispatchOnReady(data.autoDispatchOnReady);
    setLinkedinAccountId(data.credentialsByPlatform.linkedin?.accountId ?? '');
    setMetaPageId(data.credentialsByPlatform.facebook?.pageId ?? data.credentialsByPlatform.instagram?.pageId ?? '');
  }, [integrationQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (payload: UpdateProductPublishIntegrationPayload) =>
      updateProductPublishIntegration(productId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['product-publish-integration', productId] });
      void queryClient.invalidateQueries({ queryKey: ['publication-inbox'] });
      toast.success('Integración de publicación guardada');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo guardar');
    },
  });

  const regenerateSecretMutation = useMutation({
    mutationFn: () => updateProductPublishIntegration(productId, { regenerateSecret: true }),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['product-publish-integration', productId] });
      if (data.webhookSecret) {
        void navigator.clipboard.writeText(data.webhookSecret);
        toast.success('Nuevo secret generado y copiado al portapapeles');
      }
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo regenerar el secret');
    },
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const credentialsByPlatform: UpdateProductPublishIntegrationPayload['credentialsByPlatform'] = {};

    if (linkedinAccountId.trim()) {
      credentialsByPlatform.linkedin = { accountId: linkedinAccountId.trim() };
    }
    if (metaPageId.trim()) {
      credentialsByPlatform.facebook = { pageId: metaPageId.trim() };
      credentialsByPlatform.instagram = { pageId: metaPageId.trim() };
    }

    saveMutation.mutate({
      enabled,
      webhookUrl: webhookUrl.trim() || undefined,
      autoDispatchOnReady,
      credentialsByPlatform,
    });
  };

  const copyCallbackPath = async () => {
    const path = integrationQuery.data?.callbackPath;
    if (!path) return;
    const origin = window.location.origin.replace(/:\d+$/, ':3000');
    await navigator.clipboard.writeText(`${origin}${path}`);
    toast.success('URL de callback copiada');
  };

  const copySecret = async () => {
    if (integrationQuery.data?.hasWebhookSecret) {
      regenerateSecretMutation.mutate();
      return;
    }
    regenerateSecretMutation.mutate();
  };

  if (integrationQuery.isLoading) {
    return (
      <Card title="Publicación automática (n8n)">
        <p className="text-sm text-[var(--foreground-muted)]">Cargando integración…</p>
      </Card>
    );
  }

  return (
    <Card
      title="Publicación automática (n8n)"
      subtitle="Opcional. Aquí configuras el webhook; el botón Publicar vive en cada arte de la bandeja."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--border)]"
          />
          Activar webhook de salida para este producto
        </label>

        <InputText
          label="URL webhook n8n (por defecto)"
          type="url"
          placeholder="https://n8n.example.com/webhook/..."
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          disabled={!enabled}
        />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={autoDispatchOnReady}
            onChange={(e) => setAutoDispatchOnReady(e.target.checked)}
            disabled={!enabled}
            className="h-4 w-4 rounded border-[var(--border)]"
          />
          Enviar automáticamente al aprobar si ya está listo para publicar hoy
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <InputText
            label="Meta / Instagram — Page ID"
            value={metaPageId}
            onChange={(e) => setMetaPageId(e.target.value)}
            disabled={!enabled}
            placeholder="Opcional — n8n puede usar sus credenciales"
          />
          <InputText
            label="LinkedIn — Account / Org ID"
            value={linkedinAccountId}
            onChange={(e) => setLinkedinAccountId(e.target.value)}
            disabled={!enabled}
            placeholder="Opcional"
          />
        </div>

        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--muted)]/30 p-3 text-xs text-[var(--foreground-muted)]">
          <p className="mb-2 font-medium text-[var(--foreground)]">Payload de salida</p>
          <p>
            Incluye <code>copy</code>, URLs firmadas de assets (1 h), <code>platform</code>,{' '}
            <code>contentId</code> y credenciales de plataforma si las guardaste. n8n puede enrutar
            por <code>platform</code> en un solo flujo o usar webhooks distintos por red en metadata
            avanzada ({PLATFORM_PRESETS.join(', ')}).
          </p>
          <p className="mt-2">
            Callback: <code>{integrationQuery.data?.callbackPath ?? '…'}</code> con header{' '}
            <code>X-Webhook-Secret</code> y body{' '}
            <code>{'{ productId, contentId, externalPostId? }'}</code>.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" loading={saveMutation.isPending} className="gap-2">
            <Webhook className="h-4 w-4" />
            Guardar integración
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void copySecret()}
            loading={regenerateSecretMutation.isPending}
            disabled={!enabled}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            {integrationQuery.data?.hasWebhookSecret ? 'Rotar y copiar secret' : 'Generar secret'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => regenerateSecretMutation.mutate()}
            disabled={!enabled}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Rotar secret
          </Button>
          <Button type="button" variant="ghost" onClick={() => void copyCallbackPath()}>
            Copiar callback URL
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default ProductPublishIntegrationPanel;
