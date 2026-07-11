import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  ImageIcon,
  Loader2,
  Plus,
  Star,
  Trash2,
  UserCircle2,
  Video,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';
import { toast } from '@/components/molecules/Sonner';
import { AuthenticatedAssetImage } from '@/components/assets/AuthenticatedAssetImage';
import { AuthenticatedAssetVideo } from '@/components/assets/AuthenticatedAssetVideo';
import { ApiError } from '@/services/api';
import {
  createCmCharacter,
  deleteCmCharacter,
  generateCmPortrait,
  generateCmPreview,
  listCmCharacters,
  selectCmPortrait,
  setDefaultCmCharacter,
  updateCmCharacterAppearance,
  type CmCharacterStatus,
} from '@/services/cm-character';
import {
  AppearanceForm,
  appearanceDraftFromCharacter,
  emptyDraft,
  type AppearanceDraft,
} from './CmCharacterAppearanceForm';
import { PortraitPickerDialog } from './PortraitPickerDialog';

type CmCharacterSetupPanelProps = {
  productId: string;
};

function characterIdOf(cm: CmCharacterStatus): string {
  return cm.characterId;
}

function statusLabel(status: CmCharacterStatus): string {
  if (status.ready) return 'Lista';
  if (status.status === 'generating_portrait') return 'Generando retrato…';
  if (status.status === 'generating_preview') return 'Generando preview…';
  if (status.status === 'failed') return 'Error';
  if (status.portraitAssetId) return 'Retrato OK';
  return 'Pendiente';
}

export function CmCharacterSetupPanel({ productId }: CmCharacterSetupPanelProps) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createDraft, setCreateDraft] = useState<AppearanceDraft>(emptyDraft);
  const [editDraft, setEditDraft] = useState<AppearanceDraft | null>(null);
  const [portraitPickerOpen, setPortraitPickerOpen] = useState(false);

  const libraryQuery = useQuery({
    queryKey: ['cm-characters', productId],
    queryFn: () => listCmCharacters(productId),
  });

  const library = libraryQuery.data;
  const characters = library?.characters ?? [];

  const selected =
    !isCreating && selectedId
      ? characters.find((c) => characterIdOf(c) === selectedId) ?? null
      : null;

  useEffect(() => {
    if (characters.length === 0) {
      setIsCreating(true);
      setSelectedId(null);
      return;
    }
    if (isCreating) return;
    const stillValid = selectedId && characters.some((c) => characterIdOf(c) === selectedId);
    if (!stillValid) {
      const fallback =
        library?.defaultCharacterId ??
        characters.find((c) => c.ready)?.characterId ??
        characterIdOf(characters[0]);
      setSelectedId(fallback);
    }
  }, [characters, library?.defaultCharacterId, selectedId, isCreating]);

  useEffect(() => {
    if (selected) {
      setEditDraft(appearanceDraftFromCharacter(selected));
    } else if (!isCreating) {
      setEditDraft(null);
    }
  }, [selected?.characterId, isCreating]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['cm-characters', productId] });
    void queryClient.invalidateQueries({ queryKey: ['copilot-status'] });
  };

  const createMutation = useMutation({
    mutationFn: async (draft: AppearanceDraft) => {
      const name = draft.name.trim() || 'Nueva CM';
      const created = await createCmCharacter(productId, name);
      const appearance = draft.appearance;
      return updateCmCharacterAppearance(productId, created.characterId, {
        name,
        gender: appearance.gender ?? 'female',
        ageRange: appearance.ageRange ?? '',
        style: appearance.style ?? '',
        background: appearance.background ?? '',
        notes: appearance.notes ?? '',
        voiceId: draft.voiceId ?? undefined,
        voiceName: draft.voiceName ?? undefined,
      });
    },
    onSuccess: (created) => {
      invalidate();
      setIsCreating(false);
      setSelectedId(created.characterId);
      setEditDraft(appearanceDraftFromCharacter(created));
      setCreateDraft(emptyDraft());
      toast.success(`CM "${created.name}" creada`);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo crear la CM');
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!selected || !editDraft) throw new Error('Sin CM seleccionada');
      const appearance = editDraft.appearance;
      return updateCmCharacterAppearance(productId, selected.characterId, {
        name: editDraft.name.trim() || selected.name,
        gender: appearance.gender ?? 'female',
        ageRange: appearance.ageRange ?? '',
        style: appearance.style ?? '',
        background: appearance.background ?? '',
        notes: appearance.notes ?? '',
        voiceId: editDraft.voiceId ?? undefined,
        voiceName: editDraft.voiceName ?? undefined,
      });
    },
    onSuccess: (updated) => {
      invalidate();
      setEditDraft(appearanceDraftFromCharacter(updated));
      toast.success('Apariencia guardada');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo guardar');
    },
  });

  const defaultMutation = useMutation({
    mutationFn: (characterId: string) => setDefaultCmCharacter(productId, characterId),
    onSuccess: () => {
      invalidate();
      toast.success('CM por defecto actualizada');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo fijar por defecto');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (characterId: string) => deleteCmCharacter(productId, characterId),
    onSuccess: () => {
      invalidate();
      setSelectedId(null);
      toast.success('CM eliminada');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo eliminar');
    },
  });

  const portraitMutation = useMutation({
    mutationFn: (characterId: string) => generateCmPortrait(productId, characterId),
    onSuccess: (result) => {
      invalidate();
      toast.success(result.message);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Error al generar retrato');
    },
  });

  const selectPortraitMutation = useMutation({
    mutationFn: ({ characterId, assetId }: { characterId: string; assetId: string }) =>
      selectCmPortrait(productId, characterId, assetId),
    onSuccess: (result) => {
      invalidate();
      setPortraitPickerOpen(false);
      toast.success(result.message);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo asignar retrato');
    },
  });

  const previewMutation = useMutation({
    mutationFn: (characterId: string) => generateCmPreview(productId, characterId),
    onSuccess: (result) => {
      invalidate();
      toast.success(result.message);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Error al generar vista previa');
    },
  });

  if (libraryQuery.isLoading) {
    return (
      <Card title="Biblioteca de CMs" subtitle="Presentadoras virtuales">
        <p className="text-sm text-[var(--foreground-muted)]">Cargando...</p>
      </Card>
    );
  }

  const activeCharacter = isCreating ? null : selected;
  const isBusy =
    portraitMutation.isPending ||
    previewMutation.isPending ||
    selectPortraitMutation.isPending ||
    activeCharacter?.status === 'generating_portrait' ||
    activeCharacter?.status === 'generating_preview';

  return (
    <>
      <Card
        title="Biblioteca de CMs virtuales"
        subtitle={
          library
            ? `${library.readyCount} lista(s) · ${characters.length} en total`
            : 'Presentadoras para reels TikTok'
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--foreground-muted)]">
            Configura el aspecto de cada presentadora antes de generar retrato y vista previa. El
            copiloto elegirá la CM más adecuada por post.
          </p>

          <CharacterTabs
            characters={characters}
            isCreating={isCreating}
            selectedId={selectedId}
            onSelect={(id) => { setIsCreating(false); setSelectedId(id); }}
            onNew={() => { setIsCreating(true); setCreateDraft(emptyDraft()); }}
          />

          <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-4">
            {isCreating ? (
              <CreateForm
                draft={createDraft}
                onChange={setCreateDraft}
                onSubmit={() => createMutation.mutate(createDraft)}
                isPending={createMutation.isPending}
              />
            ) : activeCharacter && editDraft ? (
              <EditPanel
                character={activeCharacter}
                draft={editDraft}
                onChange={setEditDraft}
                isBusy={isBusy}
                onSave={() => saveMutation.mutate()}
                isSaving={saveMutation.isPending}
                onSetDefault={() => defaultMutation.mutate(activeCharacter.characterId)}
                isSettingDefault={defaultMutation.isPending}
                onDelete={() => {
                  if (window.confirm(`¿Eliminar "${activeCharacter.name}"?`)) {
                    deleteMutation.mutate(activeCharacter.characterId);
                  }
                }}
                isDeleting={deleteMutation.isPending}
                onGeneratePortrait={() => portraitMutation.mutate(activeCharacter.characterId)}
                isGeneratingPortrait={portraitMutation.isPending || activeCharacter.status === 'generating_portrait'}
                onOpenPicker={() => setPortraitPickerOpen(true)}
                onGeneratePreview={() => previewMutation.mutate(activeCharacter.characterId)}
                isGeneratingPreview={previewMutation.isPending || activeCharacter.status === 'generating_preview'}
                showDeleteButton={characters.length > 1}
                showDefaultButton={!activeCharacter.isDefault}
              />
            ) : (
              <p className="text-sm text-[var(--foreground-muted)]">
                Selecciona una CM arriba o crea una nueva.
              </p>
            )}
          </div>

          <p className="text-xs text-[var(--foreground-subtle)]">
            Requiere API keys de OpenRouter (retrato), ElevenLabs (voz) y Replicate (lip-sync) en
            Superadmin → Proveedores.
          </p>
        </div>
      </Card>

      <PortraitPickerDialog
        open={portraitPickerOpen}
        onClose={() => setPortraitPickerOpen(false)}
        onSelect={(assetId) => {
          if (activeCharacter) {
            selectPortraitMutation.mutate({ characterId: activeCharacter.characterId, assetId });
          }
        }}
        isPending={selectPortraitMutation.isPending}
      />
    </>
  );
}

function CharacterTabs({
  characters,
  isCreating,
  selectedId,
  onSelect,
  onNew,
}: {
  characters: CmCharacterStatus[];
  isCreating: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onNew}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
          isCreating
            ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--foreground)]'
            : 'border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--primary)]/50'
        }`}
      >
        <Plus className="h-3.5 w-3.5" />
        Nueva CM
      </button>

      {characters.map((cm) => {
        const id = characterIdOf(cm);
        const active = !isCreating && selectedId === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--foreground)]'
                : 'border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--primary)]/50'
            }`}
          >
            {cm.name}
            {cm.isDefault && (
              <Star className="h-3 w-3 fill-[var(--warning)] text-[var(--warning)]" />
            )}
            {cm.ready && <Check className="h-3 w-3 text-[var(--success)]" />}
          </button>
        );
      })}
    </div>
  );
}

function CreateForm({
  draft,
  onChange,
  onSubmit,
  isPending,
}: {
  draft: AppearanceDraft;
  onChange: (draft: AppearanceDraft) => void;
  onSubmit: () => void;
  isPending: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-[var(--foreground)]">Nueva CM</p>
        <p className="text-xs text-[var(--foreground-muted)]">
          Define nombre y apariencia antes de crearla.
        </p>
      </div>
      <AppearanceForm draft={draft} onChange={onChange} />
      <Button
        type="button"
        disabled={!draft.name.trim() || isPending}
        onClick={onSubmit}
      >
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Plus className="mr-2 h-4 w-4" />
        )}
        Añadir CM
      </Button>
    </div>
  );
}

function EditPanel({
  character,
  draft,
  onChange,
  isBusy,
  onSave,
  isSaving,
  onSetDefault,
  isSettingDefault,
  onDelete,
  isDeleting,
  onGeneratePortrait,
  isGeneratingPortrait,
  onOpenPicker,
  onGeneratePreview,
  isGeneratingPreview,
  showDeleteButton,
  showDefaultButton,
}: {
  character: CmCharacterStatus;
  draft: AppearanceDraft;
  onChange: (draft: AppearanceDraft) => void;
  isBusy: boolean;
  onSave: () => void;
  isSaving: boolean;
  onSetDefault: () => void;
  isSettingDefault: boolean;
  onDelete: () => void;
  isDeleting: boolean;
  onGeneratePortrait: () => void;
  isGeneratingPortrait: boolean;
  onOpenPicker: () => void;
  onGeneratePreview: () => void;
  isGeneratingPreview: boolean;
  showDeleteButton: boolean;
  showDefaultButton: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-[var(--foreground)]">
            Editando: {character.name}
          </p>
          <p className="text-xs text-[var(--foreground-subtle)]">
            {statusLabel(character)}
            {character.isDefault ? ' · Por defecto' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {showDefaultButton && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isSettingDefault}
              onClick={onSetDefault}
            >
              <Star className="mr-1 h-3 w-3" />
              Por defecto
            </Button>
          )}
          {showDeleteButton && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isDeleting}
              onClick={onDelete}
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Eliminar
            </Button>
          )}
        </div>
      </div>

      {character.ready && (
        <div className="grid gap-4 sm:grid-cols-2">
          {character.portraitAssetId && (
            <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)]">
              <AuthenticatedAssetImage
                assetId={character.portraitAssetId}
                variant="full"
                title="Retrato"
                className="aspect-[9/16] w-full object-cover"
              />
            </div>
          )}
          {character.previewVideoAssetId && (
            <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)]">
              <AuthenticatedAssetVideo
                assetId={character.previewVideoAssetId}
                title="Vista previa"
                className="aspect-[9/16] w-full object-cover"
              />
            </div>
          )}
        </div>
      )}

      <div className="space-y-3 border-t border-[var(--border)] pt-4">
        <p className="text-sm font-medium text-[var(--foreground)]">Apariencia</p>
        <AppearanceForm draft={draft} onChange={onChange} />
      </div>

      {character.status === 'failed' && character.errorMessage && (
        <p className="text-sm text-destructive">
          Error al generar vista previa: {character.errorMessage}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" disabled={isSaving} onClick={onSave}>
          Guardar apariencia
        </Button>
        <Button type="button" variant="secondary" size="sm" disabled={isBusy} onClick={onOpenPicker}>
          <ImageIcon className="mr-2 h-4 w-4" />
          Elegir de biblioteca
        </Button>
        <Button type="button" size="sm" disabled={isBusy} onClick={onGeneratePortrait}>
          {isGeneratingPortrait ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generando retrato...</>
          ) : (
            <><UserCircle2 className="mr-2 h-4 w-4" />Generar retrato IA</>
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={isBusy || !character.portraitAssetId}
          onClick={onGeneratePreview}
        >
          {isGeneratingPreview ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generando vista previa...</>
          ) : (
            <><Video className="mr-2 h-4 w-4" />Probar voz y lip-sync</>
          )}
        </Button>
      </div>

      {character.portraitAssetId && !character.previewVideoAssetId && !character.ready && (
        <div className="max-w-xs overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)]">
          <AuthenticatedAssetImage
            assetId={character.portraitAssetId}
            variant="full"
            title="Retrato"
            className="aspect-[9/16] w-full object-cover"
          />
        </div>
      )}
    </div>
  );
}
