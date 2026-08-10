import type { SectionFieldConfig } from '@/config/onboarding-sections';
import { InputText } from '@/components/atoms/InputText';
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/atoms/Textarea';

interface SectionStepFormProps {
  fields: SectionFieldConfig[];
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
  error?: string | null;
}

export function SectionStepForm({
  fields,
  values,
  onChange,
  error,
}: SectionStepFormProps) {
  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.name} className="flex flex-col gap-[var(--spacing-xs)]">
          {field.type !== 'select' && (
            <label className="text-sm font-medium text-[var(--foreground)]">
              {field.label}
              {field.required && <span className="text-[var(--destructive)]"> *</span>}
            </label>
          )}

          {field.type === 'textarea' ? (
            <Textarea
              value={values[field.name] ?? ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              rows={field.rows ?? 4}
            />
          ) : field.type === 'select' ? (
            <Select
              label={field.label + (field.required ? ' *' : '')}
              value={values[field.name] ?? ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              placeholder="Selecciona..."
              options={(field.options ?? []).map((option) => ({
                value: option.value,
                label: option.label,
              }))}
            />
          ) : (
            <InputText
              type={field.type === 'url' ? 'url' : 'text'}
              value={values[field.name] ?? ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              fullWidth
            />
          )}
        </div>
      ))}

      {error && (
        <p className="text-sm text-[var(--destructive)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
