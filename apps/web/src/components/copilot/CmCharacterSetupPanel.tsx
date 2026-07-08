import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, UserCircle2, Video } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { InputText } from '@/components/atoms/InputText';
import { Textarea } from '@/components/atoms/Textarea';
import { Card } from '@/components/molecules/Card';
import { toast } from '@/components/molecules/Sonner';
import { AuthenticatedAssetImage } from '@/components/assets/AuthenticatedAssetImage';
import { AuthenticatedAssetVideo } from '@/components/assets/AuthenticatedAssetVideo';
import { ApiError } from '@/services/api';
import {
  generateCmPortrait,
  generateCmPreview,
  getCmCharacterStatus,
  updateCmCharacterAppearance,
} from '@/services/cm-character';

const selectClass =
  'h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';

type CmCharacterSetupPanelProps = {
  productId: string;
};

export function CmCharacterSetupPanel({ productId }: CmCharacterSetupPanelProps) {
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: ['cm-character', productId],
    queryFn: () => getCmCharacterStatus(productId),
  });

  const status = statusQuery.data;
  const appearance = status?.appearance ?? {};

  const saveMutation = useMutation({
    mutationFn: () =>
      updateCmCharacterAppearance(productId, {
        gender: appearance.gender ?? 'female',
        ageRange: appearance.ageRange ?? '',
        style: appearance.style ?? '',
        background: appearance.background ?? '',
        notes: appearance.notes ?? '',
        voiceId: status?.voiceId ?? undefined,
        voiceName: status?.voiceName ?? undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cm-character', productId] });
      toast.success('Apariencia guardada');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo guardar');
    },
  });

  const portraitMutation = useMutation({
    mutationFn: () => generateCmPortrait(productId),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['cm-character', productId] });
      void queryClient.invalidateQueries({ queryKey: ['copilot-status'] });
      toast.success(result.message);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Error al generar retrato');
    },
  });

  const previewMutation = useMutation({
    mutationFn: () => generateCmPreview(productId),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['cm-character', productId] });
      void queryClient.invalidateQueries({ queryKey: ['copilot-status'] });
      toast.success(result.message);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Error al generar vista previa');
    },
  });

  if (statusQuery.isLoading) {
    return (
      <Card title="CM virtual" subtitle="Actividad inicial">
        <p className="text-sm text-[var(--foreground-muted)]">Cargando...</p>
      </Card>
    );
  }

  if (status?.ready) {
    return (
      <Card title="CM virtual" subtitle="Lista para reels en TikTok">
        <div className="grid gap-4 sm:grid-cols-2">
          {status.portraitAssetId && (
            <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)]">
              <AuthenticatedAssetImage
                assetId={status.portraitAssetId}
                title="Retrato CM"
                className="aspect-[9/16] w-full object-cover"
              />
            </div>
          )}
          {status.previewVideoAssetId && (
            <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)]">
              <AuthenticatedAssetVideo
                assetId={status.previewVideoAssetId}
                title="Vista previa CM"
                className="aspect-[9/16] w-full object-cover"
              />
            </div>
          )}
        </div>
      </Card>
    );
  }

  const isBusy =
    status?.status === 'generating_portrait' ||
    status?.status === 'generating_preview' ||
    portraitMutation.isPending ||
    previewMutation.isPending;

  return (
    <Card
      title="CM virtual"
      subtitle="Genera el retrato que animaremos con voz en español (lip-sync)"
    >
      <div className="space-y-4">
        <p className="text-sm text-[var(--foreground-muted)]">
          Paso inicial del copiloto: crea la presentadora de tu marca. Los posts TikTok usarán este
          retrato + narración TTS.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-[var(--foreground-muted)]">Género</span>
            <select
              className={selectClass}
              value={appearance.gender ?? 'female'}
              onChange={(e) =>
                void updateCmCharacterAppearance(productId, {
                  ...appearance,
                  gender: e.target.value as 'female' | 'male' | 'neutral',
                }).then(() =>
                  queryClient.invalidateQueries({ queryKey: ['cm-character', productId] }),
                )
              }
            >
              <option value="female">Mujer</option>
              <option value="male">Hombre</option>
              <option value="neutral">Neutral</option>
            </select>
          </label>
          <InputText
            label="Rango de edad"
            value={appearance.ageRange ?? ''}
            placeholder="Ej. 28-35 años"
            onChange={(e) =>
              void updateCmCharacterAppearance(productId, {
                ...appearance,
                ageRange: e.target.value,
              }).then(() =>
                queryClient.invalidateQueries({ queryKey: ['cm-character', productId] }),
              )
            }
          />
          <InputText
            label="Estilo"
            value={appearance.style ?? ''}
            placeholder="Business casual, cercana..."
            onChange={(e) =>
              void updateCmCharacterAppearance(productId, {
                ...appearance,
                style: e.target.value,
              }).then(() =>
                queryClient.invalidateQueries({ queryKey: ['cm-character', productId] }),
              )
            }
          />
          <InputText
            label="Fondo"
            value={appearance.background ?? ''}
            placeholder="Estudio suave, oficina moderna..."
            onChange={(e) =>
              void updateCmCharacterAppearance(productId, {
                ...appearance,
                background: e.target.value,
              }).then(() =>
                queryClient.invalidateQueries({ queryKey: ['cm-character', productId] }),
              )
            }
          />
        </div>

        <label className="block space-y-1 text-sm">
          <span className="text-[var(--foreground-muted)]">Notas adicionales</span>
          <Textarea
            value={appearance.notes ?? ''}
            rows={2}
            placeholder="Opcional: tono visual, accesorios, etc."
            onChange={(e) =>
              void updateCmCharacterAppearance(productId, {
                ...appearance,
                notes: e.target.value,
              }).then(() =>
                queryClient.invalidateQueries({ queryKey: ['cm-character', productId] }),
              )
            }
          />
        </label>

        {status?.errorMessage && (
          <p className="text-sm text-destructive">{status.errorMessage}</p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            Guardar apariencia
          </Button>
          <Button
            type="button"
            disabled={isBusy}
            onClick={() => portraitMutation.mutate()}
          >
            {portraitMutation.isPending || status?.status === 'generating_portrait' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando retrato...
              </>
            ) : (
              <>
                <UserCircle2 className="mr-2 h-4 w-4" />
                Generar retrato
              </>
            )}
          </Button>
          <Button
            type="button"
            disabled={isBusy || !status?.portraitAssetId}
            onClick={() => previewMutation.mutate()}
          >
            {previewMutation.isPending || status?.status === 'generating_preview' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando vista previa...
              </>
            ) : (
              <>
                <Video className="mr-2 h-4 w-4" />
                Probar voz y lip-sync
              </>
            )}
          </Button>
        </div>

        {status?.portraitAssetId && !status.previewVideoAssetId && (
          <div className="max-w-xs overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)]">
            <AuthenticatedAssetImage
              assetId={status.portraitAssetId}
              title="Retrato generado"
              className="aspect-[9/16] w-full object-cover"
            />
          </div>
        )}

        <p className="text-xs text-[var(--foreground-subtle)]">
          Requiere API keys de OpenRouter (retrato), ElevenLabs (voz) y Replicate (p-video-avatar) en
          Superadmin → Proveedores y Ajustes LLM.
        </p>
      </div>
    </Card>
  );
}
