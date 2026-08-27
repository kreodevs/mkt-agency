import { InputText } from '@/components/atoms/InputText';
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/atoms/Textarea';
import {
  DEFAULT_CM_VOICE_ID,
  DEFAULT_CM_VOICE_NAME,
  type CmCharacterStatus,
} from '@/services/cm-character';
import { CmCharacterVoiceSelect } from './CmCharacterVoiceSelect';

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
    voiceId: DEFAULT_CM_VOICE_ID,
    voiceName: DEFAULT_CM_VOICE_NAME,
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
  productId,
}: {
  draft: AppearanceDraft;
  onChange: (next: AppearanceDraft) => void;
  productId: string;
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

      <CmCharacterVoiceSelect
        productId={productId}
        voiceId={draft.voiceId}
        voiceName={draft.voiceName}
        onChange={(voiceId, voiceName) => onChange({ ...draft, voiceId, voiceName })}
      />

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
