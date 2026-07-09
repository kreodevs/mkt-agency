import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Copy, Check } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { SocialInboxGuide } from '@/components/social/SocialInboxGuide';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { Button } from '@/components/atoms/Button';
import { StatusPill } from '@/components/atoms/StatusPill';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import {
  ingestSocialInteraction,
  listSocialInteractions,
  markSocialInteractionReplied,
} from '@/services/social-inbox';
import { getTenantWebhookInfo } from '@/services/operating-profile';
import { useResolvedProductId } from '@/hooks/useResolvedProductId';
import { useOperatingProfile } from '@/hooks/useOperatingProfile';

function resolveWebhookPublicUrl(relativePath: string): string {
  if (typeof window === 'undefined') return relativePath;
  return `${window.location.origin}${relativePath}`;
}

async function copyToClipboard(text: string, label: string) {
  await navigator.clipboard.writeText(text);
  toast.success(`${label} copiado`);
}

const INTENT_LABELS: Record<string, string> = {
  prospect: 'Prospecto',
  support: 'Soporte',
  brand: 'Marca',
  spam: 'Spam',
  pending: 'Pendiente',
};

export default function SocialInboxPage() {
  const productId = useResolvedProductId();
  const { isSoho } = useOperatingProfile();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [authorHandle, setAuthorHandle] = useState('');
  const [copiedField, setCopiedField] = useState<'url' | 'secret' | null>(null);

  const inboxQuery = useQuery({
    queryKey: ['social-inbox'],
    queryFn: () => listSocialInteractions(),
  });

  const webhookQuery = useQuery({
    queryKey: ['tenant-webhook-info'],
    queryFn: getTenantWebhookInfo,
  });

  const ingestMutation = useMutation({
    mutationFn: () =>
      ingestSocialInteraction({
        message,
        authorHandle: authorHandle || undefined,
        productId: productId ?? undefined,
        platform: 'manual',
        channel: 'comment',
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['social-inbox'] });
      queryClient.invalidateQueries({ queryKey: ['agency-events'] });
      setMessage('');
      setAuthorHandle('');
      if (data.leadId) {
        toast.success('Prospecto enviado al CRM');
      } else {
        toast.success('Interacción clasificada');
      }
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Error al registrar');
    },
  });

  const replyMutation = useMutation({
    mutationFn: (id: string) => markSocialInteractionReplied(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-inbox'] });
      toast.success('Marcado como respondido');
    },
  });

  return (
    <DashboardShell>
      <PageHeader
        title="Inbox social"
        description={
          isSoho
            ? 'Clasifica comentarios y DMs; los prospectos van al CRM automáticamente.'
            : 'Clasifica comentarios y DMs. Los prospectos van al CRM automáticamente.'
        }
      />

      <SocialInboxGuide variant={isSoho ? 'soho' : 'growth'} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Registrar interacción"
          subtitle="Pega un comentario o DM que recibiste (modo manual hasta conectar OAuth)"
        >
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
            placeholder="Ej. ¿Cuánto cuesta? Me interesa contratar"
          />
          <input
            value={authorHandle}
            onChange={(e) => setAuthorHandle(e.target.value)}
            className="mt-3 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
            placeholder="@usuario (opcional)"
          />
          <Button
            type="button"
            className="mt-4"
            disabled={!message.trim() || ingestMutation.isPending}
            onClick={() => ingestMutation.mutate()}
          >
            Clasificar
          </Button>
        </Card>

        <Card
          title="Webhook genérico"
          subtitle="Automatiza con Make, Zapier o n8n — POST + header X-Webhook-Secret"
        >
          {webhookQuery.isLoading && (
            <p className="text-sm text-[var(--foreground-muted)]">Cargando…</p>
          )}
          {webhookQuery.data && (
            <div className="space-y-3 text-sm">
              <p className="text-[var(--foreground-muted)]">
                Configura tu automatización para enviar cada mensaje entrante a esta URL. Ejemplo de
                cuerpo:{' '}
                <code className="text-xs">
                  {`{ "message": "…", "platform": "instagram", "authorHandle": "@cliente" }`}
                </code>
              </p>
              <div className="space-y-2 rounded-md border border-[var(--border)] bg-[var(--background-muted)]/30 p-3 font-mono text-xs">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 break-all">
                    <span className="text-[var(--foreground-muted)]">URL: </span>
                    {resolveWebhookPublicUrl(webhookQuery.data.webhookUrl)}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="shrink-0 gap-1"
                    onClick={() => {
                      void copyToClipboard(
                        resolveWebhookPublicUrl(webhookQuery.data!.webhookUrl),
                        'URL',
                      ).then(() => {
                        setCopiedField('url');
                        window.setTimeout(() => setCopiedField(null), 2000);
                      });
                    }}
                  >
                    {copiedField === 'url' ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 break-all">
                    <span className="text-[var(--foreground-muted)]">Secret: </span>
                    {webhookQuery.data.secret}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="shrink-0 gap-1"
                    onClick={() => {
                      void copyToClipboard(webhookQuery.data!.secret, 'Secret').then(() => {
                        setCopiedField('secret');
                        window.setTimeout(() => setCopiedField(null), 2000);
                      });
                    }}
                  >
                    {copiedField === 'secret' ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
                <p className="text-[var(--foreground-muted)]">
                  Header: {webhookQuery.data.header}
                </p>
              </div>
              {isSoho && (
                <p className="text-xs text-[var(--foreground-muted)]">
                  ¿Solo publicas manualmente? Puedes ignorar el webhook y usar{' '}
                  <strong>Registrar interacción</strong> arriba.{' '}
                  <Link to="/settings/copilot" className="text-[var(--primary)] underline">
                    Ajustes del copiloto
                  </Link>{' '}
                  es donde eliges tus redes para generar posts.
                </p>
              )}
            </div>
          )}
        </Card>

        <Card
          className="lg:col-span-2"
          title="Bandeja"
          subtitle="Interacciones clasificadas — marca respondido cuando contestes"
        >
          {inboxQuery.isLoading && (
            <p className="text-sm text-[var(--foreground-muted)]">Cargando…</p>
          )}
          <ul className="max-h-[480px] space-y-3 overflow-y-auto">
            {(inboxQuery.data?.items ?? []).map((item) => (
              <li key={item.id} className="rounded-lg border border-[var(--border)] p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill
                    status={
                      item.intent === 'prospect'
                        ? 'success'
                        : item.intent === 'spam'
                          ? 'neutral'
                          : 'info'
                    }
                  >
                    {INTENT_LABELS[item.intent] ?? item.intent}
                  </StatusPill>
                  {item.authorHandle && (
                    <span className="text-xs text-[var(--foreground-muted)]">{item.authorHandle}</span>
                  )}
                </div>
                <p className="mt-2">{item.message}</p>
                {item.suggestedReply && (
                  <p className="mt-2 rounded bg-[var(--muted)]/40 p-2 text-xs">
                    Sugerencia: {item.suggestedReply}
                  </p>
                )}
                {item.leadId && (
                  <p className="mt-1 text-xs text-[var(--success)]">Lead CRM: {item.leadId.slice(0, 8)}…</p>
                )}
                {item.status === 'open' && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="mt-2"
                    onClick={() => replyMutation.mutate(item.id)}
                  >
                    Marcar respondido
                  </Button>
                )}
              </li>
            ))}
            {(inboxQuery.data?.items ?? []).length === 0 && !inboxQuery.isLoading && (
              <p className="text-sm text-[var(--foreground-muted)]">
                {isSoho
                  ? 'Aún no hay mensajes. Pega un comentario o DM arriba para clasificarlo.'
                  : 'Sin interacciones registradas.'}
              </p>
            )}
          </ul>
        </Card>
      </div>
    </DashboardShell>
  );
}
