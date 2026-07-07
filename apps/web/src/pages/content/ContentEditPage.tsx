import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/atoms/Button';
import { InputText } from '@/components/atoms/InputText';
import { Textarea } from '@/components/atoms/Textarea';
import { StatusBadge } from '@/components/content/StatusBadge';
import { ApprovalActions } from '@/components/content/ApprovalActions';
import { ContentVisualPanel } from '@/components/content/ContentVisualPanel';
import { ContentPublishPanel } from '@/components/content/ContentPublishPanel';
import { ContentPlatformBadge } from '@/components/content/ContentPlatformBadge';
import { SignatureBadge } from '@/components/content/SignatureBadge';
import { VersionHistory } from '@/components/content/VersionHistory';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import { getContent, listContentVersions, updateContent, deleteContent } from '@/services/content';
import type { ContentVisualFormat } from '@/types/content';
import {
  CONTENT_VISUAL_FORMAT_HINTS,
  CONTENT_VISUAL_FORMAT_LABELS,
  CONTENT_VISUAL_FORMATS,
  normalizeContentVisualFormat,
} from '@/lib/visual-format';
import { getContentPlatformLabel } from '@/lib/content-platform';
import { useAdvancedNav } from '@/store/copilot-ui';
import type { CmPlatform } from '@/services/community-manager';

export default function ContentEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const advancedNav = useAdvancedNav();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [changeSummary, setChangeSummary] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [visualFormat, setVisualFormat] = useState<ContentVisualFormat>('image');
  const [visualPrompt, setVisualPrompt] = useState('');
  const [platform, setPlatform] = useState<CmPlatform | ''>('');

  const contentQuery = useQuery({
    queryKey: ['content', id],
    queryFn: async ({ signal }) => getContent(id!, signal),
    enabled: !!id,
    retry: 1,
    staleTime: 30_000,
  });

  const versionsQuery = useQuery({
    queryKey: ['content-versions', id],
    queryFn: () => listContentVersions(id!),
    enabled: !!id,
  });

  useEffect(() => {
    const version = contentQuery.data?.currentVersion;
    if (version) {
      setTitle(version.title);
      setBody(version.body);
    }
    if (contentQuery.data) {
      setScheduledDate(contentQuery.data.scheduledDate ?? '');
      setVisualFormat(normalizeContentVisualFormat(contentQuery.data.visualFormat));
      setVisualPrompt(contentQuery.data.visualPrompt ?? '');
      setPlatform((contentQuery.data.platform as CmPlatform) ?? '');
    }
  }, [
    contentQuery.data?.currentVersion?.id,
    contentQuery.data?.scheduledDate,
    contentQuery.data?.visualFormat,
    contentQuery.data?.visualPrompt,
    contentQuery.data?.platform,
  ]);

  const scheduleMutation = useMutation({
    mutationFn: () =>
      updateContent(id!, {
        scheduledDate: scheduledDate || null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['content', id] });
      void queryClient.invalidateQueries({ queryKey: ['calendar'] });
      void queryClient.invalidateQueries({ queryKey: ['calendar-day'] });
      toast.success('Fecha programada actualizada');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo actualizar la fecha');
    },
  });

  const visualFormatMutation = useMutation({
    mutationFn: () => updateContent(id!, { visualFormat }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['content', id] });
      toast.success('Formato visual actualizado');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo actualizar el formato');
    },
  });

  const visualPromptMutation = useMutation({
    mutationFn: () => updateContent(id!, { visualPrompt: visualPrompt.trim() || null }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['content', id] });
      toast.success('Prompt visual actualizado');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo actualizar el prompt');
    },
  });

  const platformMutation = useMutation({
    mutationFn: () => updateContent(id!, { platform: platform || null }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['content', id] });
      void queryClient.invalidateQueries({ queryKey: ['contents'] });
      toast.success('Red social actualizada');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo actualizar la red');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteContent(id!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contents'] });
      void queryClient.invalidateQueries({ queryKey: ['calendar'] });
      toast.success('Contenido eliminado');
      const campaignId = contentQuery.data?.campaignId;
      navigate(campaignId ? `/contents?campaignId=${campaignId}` : '/contents');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo eliminar');
    },
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      updateContent(id!, {
        title: title.trim(),
        body,
        changeSummary: changeSummary.trim() || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['content', id] });
      void queryClient.invalidateQueries({ queryKey: ['content-versions', id] });
      void queryClient.invalidateQueries({ queryKey: ['contents'] });
      setChangeSummary('');
      toast.success('Nueva versión guardada');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo guardar');
    },
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    saveMutation.mutate();
  };

  const content = contentQuery.data;
  const currentVersion = content?.currentVersion;
  const isFrozen = !!currentVersion?.signatureHash;

  const backHref = advancedNav
    ? content?.campaignId
      ? `/contents?campaignId=${content.campaignId}`
      : '/contents'
    : '/';

  if (contentQuery.isPending) {
    return (
      <DashboardShell>
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-[var(--foreground-muted)]">Cargando contenido…</p>
          <Link to={backHref}>
            <Button variant="outline" size="sm">
              Volver a la bandeja
            </Button>
          </Link>
        </div>
      </DashboardShell>
    );
  }

  if (contentQuery.isError) {
    return (
      <DashboardShell>
        <Card title="No se pudo cargar el contenido">
          <p className="mb-4 text-sm text-[var(--foreground-muted)]">
            {contentQuery.error instanceof ApiError
              ? contentQuery.error.message
              : 'Revisa tu conexión e intenta de nuevo.'}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void contentQuery.refetch()}>
              Reintentar
            </Button>
            <Link to={backHref}>
              <Button variant="ghost">Volver a la bandeja</Button>
            </Link>
          </div>
        </Card>
      </DashboardShell>
    );
  }

  if (!content || !currentVersion) {
    return (
      <DashboardShell>
        <Card title="Contenido no encontrado">
          <Link to={backHref}>
            <Button variant="outline">Volver a la bandeja</Button>
          </Link>
        </Card>
      </DashboardShell>
    );
  }

  const canDelete = content.status === 'draft' && !isFrozen;

  const handleDelete = () => {
    if (!window.confirm('¿Eliminar este contenido? Esta acción no se puede deshacer.')) {
      return;
    }
    deleteMutation.mutate();
  };

  const platformLabel = getContentPlatformLabel(content.platform);

  return (
    <DashboardShell>
      <PageHeader
        title={content.title}
        description={`Tipo: ${content.type} · Formato: ${CONTENT_VISUAL_FORMAT_LABELS[visualFormat]} · v${currentVersion.versionNumber}${
          platformLabel ? ` · ${platformLabel}` : ''
        }`}
        actions={
          <div className="flex flex-wrap gap-2">
            {canDelete && (
              <Button
                type="button"
                variant="outline"
                className="text-[var(--destructive)]"
                loading={deleteMutation.isPending}
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            )}
            <Link to={backHref}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
            </Link>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <StatusBadge status={content.status} />
        <ContentPlatformBadge platform={content.platform} showUnset />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Editor">
            {isFrozen && (
              <p className="mb-4 text-sm text-[var(--warning)]">
                La versión actual está firmada. Al guardar se creará una nueva versión y el
                contenido pasará a estado in_changes.
              </p>
            )}

            <form className="space-y-4" onSubmit={onSubmit}>
              <InputText
                label="Título"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                fullWidth
              />

              <div className="flex flex-col gap-[var(--spacing-xs)]">
                <label className="text-sm font-medium text-[var(--foreground)]">Cuerpo</label>
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={14} required />
              </div>

              <InputText
                label="Fecha programada"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                fullWidth
              />

              <Button
                type="button"
                variant="outline"
                loading={scheduleMutation.isPending}
                onClick={() => scheduleMutation.mutate()}
              >
                Guardar fecha
              </Button>

              <div className="flex flex-col gap-[var(--spacing-xs)]">
                <label htmlFor="content-visual-format" className="text-sm font-medium">
                  Formato visual (IA)
                </label>
                <select
                  id="content-visual-format"
                  className="h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm"
                  value={visualFormat}
                  onChange={(event) =>
                    setVisualFormat(event.target.value as ContentVisualFormat)
                  }
                >
                  {CONTENT_VISUAL_FORMATS.map((format) => (
                    <option key={format} value={format}>
                      {CONTENT_VISUAL_FORMAT_LABELS[format]}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[var(--foreground-muted)]">
                  {CONTENT_VISUAL_FORMAT_HINTS[visualFormat]}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  loading={visualFormatMutation.isPending}
                  onClick={() => visualFormatMutation.mutate()}
                >
                  Guardar formato visual
                </Button>
              </div>

              <div className="flex flex-col gap-[var(--spacing-xs)]">
                <label htmlFor="content-visual-prompt" className="text-sm font-medium">
                  Prompt visual (IA)
                </label>
                <Textarea
                  id="content-visual-prompt"
                  value={visualPrompt}
                  onChange={(e) => setVisualPrompt(e.target.value)}
                  rows={4}
                  placeholder="Escena, estilo, encuadre… No copies el texto del post ni hashtags."
                />
                <p className="text-xs text-[var(--foreground-muted)]">
                  Brief de arte para Image Generator. Es independiente del copy publicable de arriba.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  loading={visualPromptMutation.isPending}
                  onClick={() => visualPromptMutation.mutate()}
                >
                  Guardar prompt visual
                </Button>
              </div>

              <InputText
                label="Resumen del cambio (opcional)"
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                fullWidth
              />

              <Button type="submit" loading={saveMutation.isPending}>
                Guardar nueva versión
              </Button>
            </form>
          </Card>

          <ContentPublishPanel
            contentId={content.id}
            title={title}
            body={body}
            platform={platform || content.platform}
            versionAssets={currentVersion.assets}
            visualFormat={visualFormat}
            onPlatformChange={setPlatform}
            onSavePlatform={() => platformMutation.mutate()}
            savingPlatform={platformMutation.isPending}
          />

          <ContentVisualPanel
            contentId={content.id}
            versionAssets={currentVersion.assets}
            platform={content.platform}
            visualFormat={visualFormat}
          />

          <SignatureBadge
            signatureHash={currentVersion.signatureHash}
            signedAt={currentVersion.signedAt}
          />
        </div>

        <div className="space-y-6">
          <ApprovalActions contentId={content.id} version={currentVersion} />

          <VersionHistory
            contentId={content.id}
            versions={versionsQuery.data ?? []}
            currentVersionId={content.currentVersionId}
            loading={versionsQuery.isLoading}
          />
        </div>
      </div>
    </DashboardShell>
  );
}
