import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/atoms/Button';
import { InputText } from '@/components/atoms/InputText';
import { Textarea } from '@/components/atoms/Textarea';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import { createContent } from '@/services/content';
import type { ContentType, CreateContentPayload } from '@/types/content';

const selectClass =
  'h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';

export default function ContentCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('campaignId') ?? '';

  const [title, setTitle] = useState('');
  const [type, setType] = useState<ContentType>('social');
  const [body, setBody] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');

  const createMutation = useMutation({
    mutationFn: (payload: CreateContentPayload) => createContent(payload),
    onSuccess: (content) => {
      toast.success('Contenido creado');
      navigate(`/contents/${content.id}`);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo crear');
    },
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    createMutation.mutate({
      title: title.trim(),
      type,
      body,
      campaignId: campaignId || undefined,
      scheduledDate: scheduledDate || undefined,
    });
  };

  return (
    <DashboardShell>
      <PageHeader title="Nuevo contenido" description="Crea la versión 1 en borrador" />

      <Card>
        <form className="mx-auto max-w-2xl space-y-4" onSubmit={onSubmit}>
          <InputText
            label="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            fullWidth
          />

          <div className="flex flex-col gap-[var(--spacing-xs)]">
            <label className="text-sm font-medium text-[var(--foreground)]">Tipo</label>
            <select
              className={selectClass}
              value={type}
              onChange={(e) => setType(e.target.value as ContentType)}
            >
              <option value="ad">Anuncio</option>
              <option value="social">Social</option>
              <option value="email">Email</option>
              <option value="blog">Blog</option>
              <option value="landing">Landing</option>
            </select>
          </div>

          <InputText
            label="Fecha programada (opcional)"
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            fullWidth
          />

          <div className="flex flex-col gap-[var(--spacing-xs)]">
            <label className="text-sm font-medium text-[var(--foreground)]">Cuerpo</label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12} required />
          </div>

          {campaignId && (
            <p className="text-xs text-[var(--foreground-muted)]">
              Campaña asociada: {campaignId}
            </p>
          )}

          <div className="flex gap-2">
            <Link to={campaignId ? `/contents?campaignId=${campaignId}` : '/contents'}>
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" loading={createMutation.isPending}>
              Crear contenido
            </Button>
          </div>
        </form>
      </Card>
    </DashboardShell>
  );
}
