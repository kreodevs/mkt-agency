import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocation, useParams } from 'react-router-dom';
import { Button } from '@/components/atoms/Button';
import { InputText } from '@/components/atoms/InputText';
import { Textarea } from '@/components/atoms/Textarea';
import { Card } from '@/components/molecules/Card';
import { AuthShell } from '@/components/layout/AuthShell';
import { parseCaptureAttributionFromSearch } from '@/lib/capture-attribution';
import { getPublicForm, submitPublicForm } from '@/services/forms';
import type { FormFieldDefinition } from '@/types/forms';

function CaptureField({
  field,
  primaryColor,
}: {
  field: FormFieldDefinition;
  primaryColor?: string;
}) {
  if (field.type === 'textarea') {
    return (
      <div className="flex flex-col gap-[var(--spacing-xs)]">
        <label htmlFor={field.name} className="text-sm font-medium text-[var(--foreground)]">
          {field.label}
          {field.required ? ' *' : ''}
        </label>
        <Textarea id={field.name} name={field.name} required={field.required} rows={4} />
      </div>
    );
  }

  const type = field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'text';

  return (
    <InputText
      id={field.name}
      name={field.name}
      type={type}
      required={field.required}
      label={`${field.label}${field.required ? ' *' : ''}`}
      fullWidth
      style={primaryColor ? ({ '--ring': primaryColor } as React.CSSProperties) : undefined}
    />
  );
}

export default function PublicCapturePage() {
  const { formId } = useParams<{ formId: string }>();
  const location = useLocation();
  const [submitted, setSubmitted] = useState(false);

  const attribution = useMemo(
    () => parseCaptureAttributionFromSearch(location.search),
    [location.search],
  );

  const formQuery = useQuery({
    queryKey: ['public-form', formId],
    queryFn: () => getPublicForm(formId!),
    enabled: Boolean(formId),
  });

  const submitMutation = useMutation({
    mutationFn: (payload: Record<string, string>) =>
      submitPublicForm(formId!, { ...payload, ...attribution }),
    onSuccess: () => setSubmitted(true),
  });

  const form = formQuery.data;
  const useBrandStyle =
    typeof form?.style?.primaryColor !== 'string' || form.style.primaryColor === '#2563eb';

  if (formQuery.isLoading) {
    return (
      <AuthShell headline="Cargando formulario" tagline="Un momento, por favor.">
        <Card variant="elevated">
          <p className="text-sm text-[var(--foreground-muted)]">Preparando tu experiencia…</p>
        </Card>
      </AuthShell>
    );
  }

  if (formQuery.isError || !form) {
    return (
      <AuthShell headline="Formulario no disponible" tagline="El enlace puede haber expirado.">
        <Card variant="elevated">
          <p className="text-sm text-[var(--foreground-muted)]">
            Este formulario no está disponible en este momento.
          </p>
        </Card>
      </AuthShell>
    );
  }

  if (submitted) {
    return (
      <AuthShell headline="¡Gracias!" tagline="Recibimos tu mensaje. Te contactaremos pronto.">
        <Card variant="accent" title="Envío confirmado">
          <p className="text-sm text-[var(--foreground-muted)]">
            Tu información llegó correctamente al equipo.
          </p>
        </Card>
      </AuthShell>
    );
  }

  return (
    <AuthShell headline={form.name} tagline="Déjanos tus datos y te respondemos.">
      <Card variant="elevated" title="Completa el formulario">
        <form
          className="flex flex-col gap-[var(--spacing-md)]"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const payload: Record<string, string> = {};
            for (const field of form.fields) {
              payload[field.name] = String(data.get(field.name) ?? '');
            }
            submitMutation.mutate(payload);
          }}
        >
          {form.fields.map((field) => (
            <CaptureField
              key={field.name}
              field={field}
              primaryColor={
                useBrandStyle ? undefined : (form.style?.primaryColor as string | undefined)
              }
            />
          ))}

          <Button
            type="submit"
            variant={useBrandStyle ? 'brand' : 'default'}
            className="w-full"
            disabled={submitMutation.isPending}
            style={
              useBrandStyle
                ? undefined
                : { backgroundColor: form.style?.primaryColor as string | undefined }
            }
          >
            {submitMutation.isPending ? 'Enviando...' : 'Enviar'}
          </Button>

          {submitMutation.isError && (
            <p className="text-sm text-[var(--destructive)]">
              No se pudo enviar. Intenta de nuevo.
            </p>
          )}
        </form>
      </Card>
    </AuthShell>
  );
}
