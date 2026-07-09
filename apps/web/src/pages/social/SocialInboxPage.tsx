import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/DashboardShell';
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
import { useResolvedProductId } from '@/hooks/useResolvedProductId';

const INTENT_LABELS: Record<string, string> = {
  prospect: 'Prospecto',
  support: 'Soporte',
  brand: 'Marca',
  spam: 'Spam',
  pending: 'Pendiente',
};

export default function SocialInboxPage() {
  const productId = useResolvedProductId();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [authorHandle, setAuthorHandle] = useState('');

  const inboxQuery = useQuery({
    queryKey: ['social-inbox'],
    queryFn: () => listSocialInteractions(),
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
        description="Clasifica comentarios y DMs. Los prospectos van al CRM automáticamente."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Registrar interacción" subtitle="Simula un comentario o DM hasta conectar redes">
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

        <Card title="Bandeja">
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
          </ul>
        </Card>
      </div>
    </DashboardShell>
  );
}
