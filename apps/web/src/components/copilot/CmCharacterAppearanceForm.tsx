import { InputText } from '@/components/atoms/InputText';
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/atoms/Textarea';
import type { CmCharacterStatus } from '@/services/cm-character';

export type AppearanceDraft = {
  name: string;
  appearance: NonNullable<CmCharacterStatus['appearance']>;
  voiceId: string | null;
  voiceName: string | null;
};

export function emptyDraft(): AppearanceDraft {
  return {
    name: '',
    appearance: { gender: 'female' },
    voiceId: null,
    voiceName: null,
  };
}

export function appearanceDraftFromCharacter(character: CmCharacterStatus): AppearanceDraft {
  return {
    name: character.name,
    appearance: { ...(character.appearance ?? { gender: 'female' }) },
    voiceId: character.voiceId,
    voiceName: character.voiceName,
  };
}

export function AppearanceForm({
  draft,
  onChange,
}: {
  draft: AppearanceDraft;
  onChange: (next: AppearanceDraft) => void;
}) {
  const appearance = draft.appearance;

  return (
    <div className="space-y-3">
      <InputText
        label="Nombre"
        value={draft.name}
        placeholder="Ej. Ana — ejecutiva"
        onChange={(e) => onChange({ ...draft, name: e.target.value })}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Género"
          value={appearance.gender ?? 'female'}
          onChange={(e) =>
            onChange({
              ...draft,
              appearance: {
                ...appearance,
                gender: e.target.value as 'female' | 'male' | 'neutral',
              },
            })
          }
          options={[
            { value: 'female', label: 'Mujer' },
            { value: 'male', label: 'Hombre' },
            { value: 'neutral', label: 'Neutral' },
          ]}
        />
        <InputText
          label="Rango de edad"
          value={appearance.ageRange ?? ''}
          placeholder="Ej. 28-35 años"
          onChange={(e) =>
            onChange({
              ...draft,
              appearance: { ...appearance, ageRange: e.target.value },
            })
          }
        />
        <InputText
          label="Estilo"
          value={appearance.style ?? ''}
          placeholder="Business casual, cercana..."
          onChange={(e) =>
            onChange({
              ...draft,
              appearance: { ...appearance, style: e.target.value },
            })
          }
        />
        <InputText
          label="Fondo"
          value={appearance.background ?? ''}
          placeholder="Estudio suave, oficina moderna..."
          onChange={(e) =>
            onChange({
              ...draft,
              appearance: { ...appearance, background: e.target.value },
            })
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
            onChange({
              ...draft,
              appearance: { ...appearance, notes: e.target.value },
            })
          }
        />
      </label>
    </div>
  );
}
