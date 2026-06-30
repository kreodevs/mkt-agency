import { KeyboardEvent, useState } from 'react';
import { X } from 'lucide-react';
import { InputText } from '@/components/atoms/InputText';

interface ProductKeywordTagsInputProps {
  keywords: string[];
  onChange: (keywords: string[]) => void;
  error?: string | null;
}

function normalizeTag(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function ProductKeywordTagsInput({
  keywords,
  onChange,
  error,
}: ProductKeywordTagsInputProps) {
  const [draft, setDraft] = useState('');

  const addTag = (raw: string) => {
    const tag = normalizeTag(raw);
    if (!tag) return;
    const exists = keywords.some((k) => k.toLowerCase() === tag.toLowerCase());
    if (exists) {
      setDraft('');
      return;
    }
    onChange([...keywords, tag]);
    setDraft('');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTag(draft);
    }
    if (event.key === 'Backspace' && !draft && keywords.length > 0) {
      onChange(keywords.slice(0, -1));
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[var(--foreground)]">
        Tags SEO
        <span className="text-[var(--destructive)]"> *</span>
      </label>
      <p className="text-xs text-[var(--foreground-muted)]">
        Mínimo 3 tags. Pulsa Enter o coma para agregar cada uno.
      </p>

      <div className="flex min-h-10 flex-wrap gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-2 py-2">
        {keywords.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)]/10 px-2.5 py-1 text-xs font-medium text-[var(--primary)]"
          >
            {tag}
            <button
              type="button"
              className="rounded-full p-0.5 hover:bg-[var(--primary)]/20"
              aria-label={`Quitar ${tag}`}
              onClick={() => onChange(keywords.filter((k) => k !== tag))}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <InputText
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => addTag(draft)}
          placeholder={keywords.length === 0 ? 'Ej. software dental, CRM clínicas...' : 'Agregar tag...'}
          fullWidth
          className="min-w-[140px] flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
      </div>

      {error && (
        <p className="text-sm text-[var(--destructive)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
