import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocation, useParams } from 'react-router-dom';
import { Button } from '@/components/atoms/Button';
import { parseCaptureAttributionFromSearch } from '@/lib/capture-attribution';
import { getPublicForm, submitPublicForm } from '@/services/forms';
import type { FormFieldDefinition } from '@/types/forms';

function FieldInput({ field }: { field: FormFieldDefinition }) {
  const common = {
    id: field.name,
    name: field.name,
    required: field.required,
    className:
      'mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]',
  };

  if (field.type === 'textarea') {
    return <textarea {...common} rows={4} />;
  }

  const type = field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'text';
  return <input {...common} type={type} />;
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
  const primaryColor =
    typeof form?.style?.primaryColor === 'string' ? form.style.primaryColor : '#2563eb';

  if (formQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[var(--foreground-muted)]">
        Cargando formulario...
      </div>
    );
  }

  if (formQuery.isError || !form) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-[var(--foreground-muted)]">
        Este formulario no está disponible.
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] p-[var(--spacing-xl)] text-center shadow-sm">
          <p className="text-lg font-bold text-[var(--foreground)]">¡Gracias!</p>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            Recibimos tu mensaje. Te contactaremos pronto.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background-muted)] px-4 py-10">
      <div className="w-full max-w-md rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] p-[var(--spacing-lg)] shadow-sm">
        <h1 className="text-xl font-black text-[var(--foreground)]">{form.name}</h1>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          Déjanos tus datos y te respondemos.
        </p>

        <form
          className="mt-6 space-y-4"
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
            <label key={field.name} className="block text-sm font-medium text-[var(--foreground)]">
              {field.label}
              {field.required ? ' *' : ''}
              <FieldInput field={field} />
            </label>
          ))}

          <Button
            type="submit"
            className="w-full"
            disabled={submitMutation.isPending}
            style={{ backgroundColor: primaryColor }}
          >
            {submitMutation.isPending ? 'Enviando...' : 'Enviar'}
          </Button>

          {submitMutation.isError && (
            <p className="text-sm text-red-600">No se pudo enviar. Intenta de nuevo.</p>
          )}
        </form>
      </div>
    </div>
  );
}
