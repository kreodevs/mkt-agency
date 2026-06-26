import type { SectionFieldConfig } from '@/config/onboarding-sections';
import { InputText } from '@/components/atoms/InputText';
import { Textarea } from '@/components/atoms/Textarea';

const selectClass =
  'h-10 w-full rounded-[var(--radius)] border border-[var(--input-border)] bg-[var(--input)] px-[var(--spacing-md)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';

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
          <label className="text-sm font-medium text-[var(--foreground)]">
            {field.label}
            {field.required && <span className="text-[var(--destructive)]"> *</span>}
          </label>

          {field.type === 'textarea' ? (
            <Textarea
              value={values[field.name] ?? ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              rows={field.rows ?? 4}
            />
          ) : field.type === 'select' ? (
            <select
              className={selectClass}
              value={values[field.name] ?? ''}
              onChange={(e) => onChange(field.name, e.target.value)}
            >
              <option value="">Selecciona...</option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
