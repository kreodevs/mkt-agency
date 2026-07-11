import { useMutation } from '@tanstack/react-query';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import {
  createAssetFolder,
  deleteAsset,
  deleteAssetFolder,
  duplicateAsset,
  updateAsset,
  updateAssetFolder,
} from '@/services/assets';

export function useAssetLibraryMutations({
  onInvalidateAssets,
  onInvalidateFolders,
  onSetFolderFilter,
  onClearSelection,
}: {
  onInvalidateAssets: () => void;
  onInvalidateFolders: () => void;
  onSetFolderFilter: (id: string) => void;
  onClearSelection: () => void;
}) {
  const createFolderMutation = useMutation({
    mutationFn: ({ name, parentId }: { name: string; parentId?: string }) =>
      createAssetFolder(name, parentId),
    onSuccess: (folder) => {
      onInvalidateFolders();
      onSetFolderFilter(folder.id);
      toast.success('Carpeta creada');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo crear la carpeta');
    },
  });

  const renameFolderMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateAssetFolder(id, { name }),
    onSuccess: () => {
      onInvalidateFolders();
      toast.message('Carpeta renombrada');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo renombrar');
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: deleteAssetFolder,
    onSuccess: () => {
      onInvalidateFolders();
      onSetFolderFilter('');
      toast.message('Carpeta eliminada');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'La carpeta debe estar vacía');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => {
      onInvalidateAssets();
      toast.message('Activo eliminado');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo eliminar');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(ids.map((id) => deleteAsset(id)));
      const failed = results.filter((result) => result.status === 'rejected').length;
      if (failed > 0) {
        throw new Error(`No se pudieron eliminar ${failed} archivo(s)`);
      }
    },
    onSuccess: (_data, ids) => {
      onInvalidateAssets();
      onClearSelection();
      toast.message(ids.length === 1 ? 'Activo eliminado' : `${ids.length} activos eliminados`);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'No se pudo eliminar la selección';
      toast.error(message);
      onInvalidateAssets();
    },
  });

  const moveMutation = useMutation({
    mutationFn: async ({ ids, folderId }: { ids: string[]; folderId: string | null }) => {
      await Promise.all(ids.map((id) => updateAsset(id, { folderId })));
    },
    onSuccess: (_data, { ids }) => {
      onInvalidateAssets();
      onClearSelection();
      toast.success(ids.length === 1 ? 'Activo movido' : `${ids.length} activos movidos`);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo mover');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: duplicateAsset,
    onSuccess: () => {
      onInvalidateAssets();
      toast.success('Activo duplicado');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo duplicar');
    },
  });

  const folderMutationsBusy =
    createFolderMutation.isPending ||
    renameFolderMutation.isPending ||
    deleteFolderMutation.isPending;

  return {
    createFolderMutation,
    renameFolderMutation,
    deleteFolderMutation,
    deleteMutation,
    bulkDeleteMutation,
    moveMutation,
    duplicateMutation,
    folderMutationsBusy,
  };
}
