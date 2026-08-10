import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/atoms/Button';
import { InputText } from '@/components/atoms/InputText';
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/atoms/Textarea';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import { createContent } from '@/services/content';
import type { ContentType, CreateContentPayload } from '@/types/content';

const CONTENT_TYPE_OPTIONS = [
  { value: 'ad', label: 'Anuncio' },
  { value: 'social', label: 'Social' },
  { value: 'email', label: 'Email' },
  { value: 'blog', label: 'Blog' },
  { value: 'landing', label: 'Landing' },
] as const;

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

          <Select
            label="Tipo"
            value={type}
            onChange={(e) => setType(e.target.value as ContentType)}
            options={CONTENT_TYPE_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />

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
