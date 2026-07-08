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
import { InputText } from '@/components/atoms/InputText';
import { Textarea } from '@/components/atoms/Textarea';
import { Card } from '@/components/molecules/Card';
import { Dialog } from '@/components/molecules/Dialog';
import { toast } from '@/components/molecules/Sonner';
import { AuthenticatedAssetImage } from '@/components/assets/AuthenticatedAssetImage';
import { AuthenticatedAssetVideo } from '@/components/assets/AuthenticatedAssetVideo';
import { ApiError } from '@/services/api';
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

function appearanceDraftFromCharacter(character: CmCharacterStatus): AppearanceDraft {
  return {
    name: character.name,
    appearance: { ...(character.appearance ?? {}) },
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

export function CmCharacterSetupPanel({ productId }: CmCharacterSetupPanelProps) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [portraitPickerOpen, setPortraitPickerOpen] = useState(false);
  const [draft, setDraft] = useState<AppearanceDraft | null>(null);

  const libraryQuery = useQuery({
    queryKey: ['cm-characters', productId],
    queryFn: () => listCmCharacters(productId),
  });

  const library = libraryQuery.data;
  const characters = library?.characters ?? [];

  useEffect(() => {
    if (!characters.length) {
      setSelectedId(null);
      return;
    }
    if (selectedId && characters.some((c) => c.characterId === selectedId)) {
      return;
    }
    const fallback =
      library?.defaultCharacterId ??
      characters.find((c) => c.ready)?.characterId ??
      characters[0]?.characterId ??
      null;
    setSelectedId(fallback);
  }, [characters, library?.defaultCharacterId, selectedId]);

  const selected = characters.find((c) => c.characterId === selectedId) ?? null;

  useEffect(() => {
    if (selected) {
      setDraft(appearanceDraftFromCharacter(selected));
    } else {
      setDraft(null);
    }
  }, [selected?.characterId]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['cm-characters', productId] });
    void queryClient.invalidateQueries({ queryKey: ['copilot-status'] });
  };

  const createMutation = useMutation({
    mutationFn: (name: string) => createCmCharacter(productId, name),
    onSuccess: (created) => {
      invalidate();
      setSelectedId(created.characterId);
      setNewName('');
      toast.success(`CM "${created.name}" creada`);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo crear la CM');
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!selected) throw new Error('Sin CM seleccionada');
      if (!draft) throw new Error('Sin borrador de apariencia');
      const appearance = draft.appearance;
      return updateCmCharacterAppearance(productId, selected.characterId, {
        name: draft.name.trim() || selected.name,
        gender: appearance.gender ?? 'female',
        ageRange: appearance.ageRange ?? '',
        style: appearance.style ?? '',
        background: appearance.background ?? '',
        notes: appearance.notes ?? '',
        voiceId: draft.voiceId ?? undefined,
        voiceName: draft.voiceName ?? undefined,
      });
    },
    onSuccess: (updated) => {
      invalidate();
      setDraft(appearanceDraftFromCharacter(updated));
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

  const appearance = draft?.appearance ?? {};
  const isBusy =
    portraitMutation.isPending ||
    previewMutation.isPending ||
    selectPortraitMutation.isPending ||
    selected?.status === 'generating_portrait' ||
    selected?.status === 'generating_preview';

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
            Crea varias presentadoras y el copiloto elegirá la más adecuada por post. Cada CM
            necesita retrato + vista previa con lip-sync.
          </p>

          <div className="flex flex-wrap gap-2">
            <InputText
              label="Nueva CM"
              value={newName}
              placeholder="Ej. Ana — ejecutiva"
              className="min-w-[200px] flex-1"
              onChange={(e) => setNewName(e.target.value)}
            />
            <Button
              type="button"
              className="self-end"
              disabled={!newName.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate(newName.trim())}
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Añadir CM
                </>
              )}
            </Button>
          </div>

          {characters.length === 0 ? (
            <p className="text-sm text-[var(--foreground-muted)]">
              Aún no hay CMs. Crea la primera para activar reels con talking-head.
            </p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
              <ul className="space-y-1 rounded-[var(--radius-md)] border border-[var(--border)] p-2">
                {characters.map((cm) => {
                  const active = cm.characterId === selectedId;
                  return (
                    <li key={cm.characterId}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(cm.characterId)}
                        className={`flex w-full items-center justify-between gap-2 rounded-[var(--radius)] px-2 py-2 text-left text-sm transition-colors ${
                          active
                            ? 'bg-[var(--primary)]/10 text-[var(--foreground)]'
                            : 'hover:bg-[var(--secondary)]/60 text-[var(--foreground-muted)]'
                        }`}
                      >
                        <span className="truncate font-medium">{cm.name}</span>
                        <span className="flex shrink-0 items-center gap-1">
                          {cm.isDefault && (
                            <Star className="h-3 w-3 fill-[var(--warning)] text-[var(--warning)]" />
                          )}
                          {cm.ready && (
                            <Check className="h-3 w-3 text-[var(--success)]" />
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {selected && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{selected.name}</p>
                      <p className="text-xs text-[var(--foreground-subtle)]">
                        {statusLabel(selected)}
                        {selected.isDefault ? ' · Por defecto' : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!selected.isDefault && (
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={defaultMutation.isPending}
                          onClick={() => defaultMutation.mutate(selected.characterId)}
                        >
                          <Star className="mr-1 h-3 w-3" />
                          Por defecto
                        </Button>
                      )}
                      {characters.length > 1 && (
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (window.confirm(`¿Eliminar "${selected.name}"?`)) {
                              deleteMutation.mutate(selected.characterId);
                            }
                          }}
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Eliminar
                        </Button>
                      )}
                    </div>
                  </div>

                  {selected.ready && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {selected.portraitAssetId && (
                        <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)]">
                          <AuthenticatedAssetImage
                            assetId={selected.portraitAssetId}
                            title="Retrato"
                            className="aspect-[9/16] w-full object-cover"
                          />
                        </div>
                      )}
                      {selected.previewVideoAssetId && (
                        <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)]">
                          <AuthenticatedAssetVideo
                            assetId={selected.previewVideoAssetId}
                            title="Vista previa"
                            className="aspect-[9/16] w-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {draft && (
                    <div className="space-y-3 rounded-[var(--radius-md)] border border-[var(--border)] p-4">
                      <p className="text-sm font-medium text-[var(--foreground)]">Apariencia</p>

                      <InputText
                        label="Nombre"
                        value={draft.name}
                        onChange={(e) => setDraft((d) => (d ? { ...d, name: e.target.value } : d))}
                      />

                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="space-y-1 text-sm">
                          <span className="text-[var(--foreground-muted)]">Género</span>
                          <select
                            className={selectClass}
                            value={appearance.gender ?? 'female'}
                            onChange={(e) =>
                              setDraft((d) =>
                                d
                                  ? {
                                      ...d,
                                      appearance: {
                                        ...d.appearance,
                                        gender: e.target.value as 'female' | 'male' | 'neutral',
                                      },
                                    }
                                  : d,
                              )
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
                            setDraft((d) =>
                              d
                                ? {
                                    ...d,
                                    appearance: { ...d.appearance, ageRange: e.target.value },
                                  }
                                : d,
                            )
                          }
                        />
                        <InputText
                          label="Estilo"
                          value={appearance.style ?? ''}
                          placeholder="Business casual, cercana..."
                          onChange={(e) =>
                            setDraft((d) =>
                              d
                                ? {
                                    ...d,
                                    appearance: { ...d.appearance, style: e.target.value },
                                  }
                                : d,
                            )
                          }
                        />
                        <InputText
                          label="Fondo"
                          value={appearance.background ?? ''}
                          placeholder="Estudio suave, oficina moderna..."
                          onChange={(e) =>
                            setDraft((d) =>
                              d
                                ? {
                                    ...d,
                                    appearance: { ...d.appearance, background: e.target.value },
                                  }
                                : d,
                            )
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
                            setDraft((d) =>
                              d
                                ? {
                                    ...d,
                                    appearance: { ...d.appearance, notes: e.target.value },
                                  }
                                : d,
                            )
                          }
                        />
                      </label>
                    </div>
                  )}

                  {selected.errorMessage && (
                    <p className="text-sm text-destructive">{selected.errorMessage}</p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {draft && (
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={saveMutation.isPending}
                        onClick={() => saveMutation.mutate()}
                      >
                        Guardar apariencia
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={isBusy}
                      onClick={() => setPortraitPickerOpen(true)}
                    >
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Elegir de biblioteca
                    </Button>
                    <Button
                      type="button"
                      disabled={isBusy}
                      onClick={() => portraitMutation.mutate(selected.characterId)}
                    >
                      {portraitMutation.isPending || selected.status === 'generating_portrait' ? (
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
                      disabled={isBusy || !selected.portraitAssetId}
                      onClick={() => previewMutation.mutate(selected.characterId)}
                    >
                      {previewMutation.isPending || selected.status === 'generating_preview' ? (
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

                  {selected.portraitAssetId && !selected.previewVideoAssetId && !selected.ready && (
                    <div className="max-w-xs overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)]">
                      <AuthenticatedAssetImage
                        assetId={selected.portraitAssetId}
                        title="Retrato"
                        className="aspect-[9/16] w-full object-cover"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

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
                  disabled={selectPortraitMutation.isPending || !selected}
                  onClick={() =>
                    selected &&
                    selectPortraitMutation.mutate({
                      characterId: selected.characterId,
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
          <p className="text-sm text-[var(--foreground-muted)]">
            No hay imágenes en la biblioteca. Sube assets o genera un retrato con IA.
          </p>
        )}
      </Dialog>
    </>
  );
}
