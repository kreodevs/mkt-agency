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
import { Link } from 'react-router-dom';
import { Button } from '@/components/atoms/Button';
import { InputText } from '@/components/atoms/InputText';
import { Textarea } from '@/components/atoms/Textarea';
import { Card } from '@/components/molecules/Card';
import { Dialog } from '@/components/molecules/Dialog';
import { toast } from '@/components/molecules/Sonner';
import { AuthenticatedAssetImage } from '@/components/assets/AuthenticatedAssetImage';
import { AuthenticatedAssetVideo } from '@/components/assets/AuthenticatedAssetVideo';
import { ApiError } from '@/services/api';
import { LIBRARY_ROUTE } from '@/lib/tenant-navigation';
import { listAssets, resolveAssetPreviewUrl } from '@/services/assets';
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

const selectClass =
  'h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';

type CmCharacterSetupPanelProps = {
  productId: string;
};

type AppearanceDraft = {
  name: string;
  appearance: NonNullable<CmCharacterStatus['appearance']>;
  voiceId: string | null;
  voiceName: string | null;
};

function emptyDraft(): AppearanceDraft {
  return {
    name: '',
    appearance: { gender: 'female' },
    voiceId: null,
    voiceName: null,
  };
}

function characterIdOf(cm: CmCharacterStatus): string {
  return cm.characterId;
}

function appearanceDraftFromCharacter(character: CmCharacterStatus): AppearanceDraft {
  return {
    name: character.name,
    appearance: { ...(character.appearance ?? { gender: 'female' }) },
    voiceId: character.voiceId,
    voiceName: character.voiceName,
  };
}

function statusLabel(status: CmCharacterStatus): string {
  if (status.ready) return 'Lista';
  if (status.status === 'generating_portrait') return 'Generando retrato…';
  if (status.status === 'generating_preview') return 'Generando preview…';
  if (status.status === 'failed') return 'Error';
  if (status.portraitAssetId) return 'Retrato OK';
  return 'Pendiente';
}

function AppearanceForm({
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
        <label className="space-y-1 text-sm">
          <span className="text-[var(--foreground-muted)]">Género</span>
          <select
            className={selectClass}
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
          >
            <option value="female">Mujer</option>
            <option value="male">Hombre</option>
            <option value="neutral">Neutral</option>
          </select>
        </label>
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

    if (isCreating) {
      return;
    }

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

  const imageAssetsQuery = useQuery({
    queryKey: ['assets', 'image', 'cm-portrait-picker'],
    queryFn: () => listAssets({ type: 'image', limit: 48, page: 1 }),
    enabled: portraitPickerOpen,
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

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setIsCreating(true);
                setCreateDraft(emptyDraft());
              }}
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
                  onClick={() => {
                    setIsCreating(false);
                    setSelectedId(id);
                  }}
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

          <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-4">
            {isCreating ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">Nueva CM</p>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    Define nombre y apariencia antes de crearla.
                  </p>
                </div>

                <AppearanceForm draft={createDraft} onChange={setCreateDraft} />

                <Button
                  type="button"
                  disabled={!createDraft.name.trim() || createMutation.isPending}
                  onClick={() => createMutation.mutate(createDraft)}
                >
                  {createMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Añadir CM
                </Button>
              </div>
            ) : activeCharacter && editDraft ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      Editando: {activeCharacter.name}
                    </p>
                    <p className="text-xs text-[var(--foreground-subtle)]">
                      {statusLabel(activeCharacter)}
                      {activeCharacter.isDefault ? ' · Por defecto' : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!activeCharacter.isDefault && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={defaultMutation.isPending}
                        onClick={() => defaultMutation.mutate(activeCharacter.characterId)}
                      >
                        <Star className="mr-1 h-3 w-3" />
                        Por defecto
                      </Button>
                    )}
                    {characters.length > 1 && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (window.confirm(`¿Eliminar "${activeCharacter.name}"?`)) {
                            deleteMutation.mutate(activeCharacter.characterId);
                          }
                        }}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Eliminar
                      </Button>
                    )}
                  </div>
                </div>

                {activeCharacter.ready && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {activeCharacter.portraitAssetId && (
                      <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)]">
                        <AuthenticatedAssetImage
                          assetId={activeCharacter.portraitAssetId}
                          title="Retrato"
                          className="aspect-[9/16] w-full object-cover"
                        />
                      </div>
                    )}
                    {activeCharacter.previewVideoAssetId && (
                      <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)]">
                        <AuthenticatedAssetVideo
                          assetId={activeCharacter.previewVideoAssetId}
                          title="Vista previa"
                          className="aspect-[9/16] w-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3 border-t border-[var(--border)] pt-4">
                  <p className="text-sm font-medium text-[var(--foreground)]">Apariencia</p>
                  <AppearanceForm draft={editDraft} onChange={setEditDraft} />
                </div>

                {activeCharacter.errorMessage && (
                  <p className="text-sm text-destructive">{activeCharacter.errorMessage}</p>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={saveMutation.isPending}
                    onClick={() => saveMutation.mutate()}
                  >
                    Guardar apariencia
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => setPortraitPickerOpen(true)}
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Elegir de biblioteca
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => portraitMutation.mutate(activeCharacter.characterId)}
                  >
                    {portraitMutation.isPending ||
                    activeCharacter.status === 'generating_portrait' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generando retrato...
                      </>
                    ) : (
                      <>
                        <UserCircle2 className="mr-2 h-4 w-4" />
                        Generar retrato IA
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isBusy || !activeCharacter.portraitAssetId}
                    onClick={() => previewMutation.mutate(activeCharacter.characterId)}
                  >
                    {previewMutation.isPending ||
                    activeCharacter.status === 'generating_preview' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generando vista previa...
                      </>
                    ) : (
                      <>
                        <Video className="mr-2 h-4 w-4" />
                        Probar voz y lip-sync
                      </>
                    )}
                  </Button>
                </div>

                {activeCharacter.portraitAssetId &&
                  !activeCharacter.previewVideoAssetId &&
                  !activeCharacter.ready && (
                    <div className="max-w-xs overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)]">
                      <AuthenticatedAssetImage
                        assetId={activeCharacter.portraitAssetId}
                        title="Retrato"
                        className="aspect-[9/16] w-full object-cover"
                      />
                    </div>
                  )}
              </div>
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

      <Dialog
        visible={portraitPickerOpen}
        onHide={() => setPortraitPickerOpen(false)}
        title="Elegir retrato desde biblioteca"
        description="Selecciona una imagen vertical 9:16 de tus assets."
        size="xl"
        footer={
          <Link
            to={LIBRARY_ROUTE}
            className="text-sm font-medium text-[var(--primary)] hover:underline"
            onClick={() => setPortraitPickerOpen(false)}
          >
            Abrir librería completa →
          </Link>
        }
      >
        {imageAssetsQuery.isLoading ? (
          <p className="text-sm text-[var(--foreground-muted)]">Cargando imágenes...</p>
        ) : imageAssetsQuery.data?.items.length ? (
          <div className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
            {imageAssetsQuery.data.items.map((asset) => {
              const preview = resolveAssetPreviewUrl(asset);
              return (
                <button
                  key={asset.id}
                  type="button"
                  disabled={selectPortraitMutation.isPending || !activeCharacter}
                  onClick={() =>
                    activeCharacter &&
                    selectPortraitMutation.mutate({
                      characterId: activeCharacter.characterId,
                      assetId: asset.id,
                    })
                  }
                  className="group overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] text-left transition hover:border-[var(--primary)]"
                >
                  {preview ? (
                    <img
                      src={preview}
                      alt={asset.name}
                      className="aspect-[9/16] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[9/16] items-center justify-center bg-[var(--secondary)]">
                      <ImageIcon className="h-8 w-8 text-[var(--foreground-muted)]" />
                    </div>
                  )}
                  <p className="truncate px-2 py-1 text-xs text-[var(--foreground-muted)] group-hover:text-[var(--foreground)]">
                    {asset.name}
                  </p>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[var(--foreground-muted)]">
              No hay imágenes en la biblioteca. Sube material en la librería o genera un retrato con
              IA.
            </p>
            <Link to={LIBRARY_ROUTE} onClick={() => setPortraitPickerOpen(false)}>
              <Button type="button" variant="secondary" size="sm">
                <ImageIcon className="mr-2 h-4 w-4" />
                Ir a librería multimedia
              </Button>
            </Link>
          </div>
        )}
      </Dialog>
    </>
  );
}
