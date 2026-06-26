import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/atoms/Button';
import { InputText } from '@/components/atoms/InputText';
import { Textarea } from '@/components/atoms/Textarea';
import { StatusBadge } from '@/components/content/StatusBadge';
import { ApprovalActions } from '@/components/content/ApprovalActions';
import { SignatureBadge } from '@/components/content/SignatureBadge';
import { VersionHistory } from '@/components/content/VersionHistory';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import { getContent, listContentVersions, updateContent } from '@/services/content';

export default function ContentEditPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [changeSummary, setChangeSummary] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');

  const contentQuery = useQuery({
    queryKey: ['content', id],
    queryFn: () => getContent(id!),
    enabled: !!id,
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
    }
  }, [contentQuery.data?.currentVersion?.id, contentQuery.data?.scheduledDate]);

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

  if (contentQuery.isLoading) {
    return (
      <DashboardShell>
        <p className="text-sm text-[var(--foreground-muted)]">Cargando...</p>
      </DashboardShell>
    );
  }

  if (!content || !currentVersion) {
    return (
      <DashboardShell>
        <Card title="Contenido no encontrado">
          <Link to="/contents">
            <Button variant="outline">Volver</Button>
          </Link>
        </Card>
      </DashboardShell>
    );
  }

  const backHref = content.campaignId
    ? `/contents?campaignId=${content.campaignId}`
    : '/contents';

  return (
    <DashboardShell>
      <PageHeader
        title={content.title}
        description={`Tipo: ${content.type} · v${currentVersion.versionNumber}`}
        actions={
          <Link to={backHref}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
        }
      />

      <div className="mb-4">
        <StatusBadge status={content.status} />
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
