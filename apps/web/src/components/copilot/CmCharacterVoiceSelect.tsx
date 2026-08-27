import { useQuery } from '@tanstack/react-query';
import { Loader2, Volume2 } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@/components/atoms/Button';
import { Select } from '@/components/atoms/Select';
import {
  DEFAULT_CM_VOICE_ID,
  DEFAULT_CM_VOICE_NAME,
  listElevenLabsVoices,
  type ElevenLabsVoiceOption,
} from '@/services/cm-character';

function formatVoiceLabel(voice: ElevenLabsVoiceOption): string {
  const traits = [voice.gender, voice.accent].filter(Boolean).join(', ');
  return traits ? `${voice.name} (${traits})` : voice.name;
}

type CmCharacterVoiceSelectProps = {
  productId: string;
  voiceId: string | null;
  voiceName: string | null;
  onChange: (voiceId: string, voiceName: string) => void;
};

export function CmCharacterVoiceSelect({
  productId,
  voiceId,
  voiceName,
  onChange,
}: CmCharacterVoiceSelectProps) {
  const previewRef = useRef<HTMLAudioElement | null>(null);

  const voicesQuery = useQuery({
    queryKey: ['elevenlabs-voices', productId],
    queryFn: () => listElevenLabsVoices(productId),
    staleTime: 10 * 60 * 1000,
  });

  const voices = voicesQuery.data?.voices ?? [];
  const selectedId = voiceId ?? DEFAULT_CM_VOICE_ID;
  const selectedVoice =
    voices.find((voice) => voice.id === selectedId) ??
  ({
    id: selectedId,
    name: voiceName ?? DEFAULT_CM_VOICE_NAME,
  } satisfies ElevenLabsVoiceOption);

  const options = voices.length
    ? voices.map((voice) => ({
        value: voice.id,
        label: formatVoiceLabel(voice),
      }))
    : [
        {
          value: selectedId,
          label: selectedVoice.name,
        },
      ];

  const playPreview = () => {
    if (!selectedVoice.previewUrl) {
      return;
    }
    if (!previewRef.current) {
      previewRef.current = new Audio(selectedVoice.previewUrl);
    } else {
      previewRef.current.src = selectedVoice.previewUrl;
    }
    void previewRef.current.play();
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[220px] flex-1">
          <Select
            label="Voz ElevenLabs"
            value={selectedId}
            disabled={voicesQuery.isLoading}
            options={options}
            onChange={(event) => {
              const nextId = event.target.value;
              const nextVoice = voices.find((voice) => voice.id === nextId);
              onChange(nextId, nextVoice?.name ?? voiceName ?? DEFAULT_CM_VOICE_NAME);
            }}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!selectedVoice.previewUrl}
          onClick={playPreview}
          title={
            selectedVoice.previewUrl
              ? 'Escuchar muestra de la voz'
              : 'Esta voz no tiene muestra disponible'
          }
        >
          <Volume2 className="mr-1.5 h-4 w-4" />
          Escuchar
        </Button>
      </div>

      {voicesQuery.isLoading ? (
        <p className="inline-flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Cargando voces de ElevenLabs…
        </p>
      ) : voicesQuery.isError ? (
        <p className="text-xs text-[var(--destructive)]">
          No se pudieron cargar las voces. Verifica la API key de ElevenLabs en Superadmin.
        </p>
      ) : (
        <p className="text-xs text-[var(--foreground-muted)]">
          La CM usará esta voz en reels y en «Probar voz y lip-sync». Si cambias la voz, vuelve a
          generar la vista previa.
        </p>
      )}
    </div>
  );
}
