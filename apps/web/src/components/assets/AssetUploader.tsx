import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Progress } from '@/components/molecules/Progress';
import { toast } from '@/components/molecules/Sonner';
import { uploadAsset } from '@/services/assets';
import type { Asset } from '@/types/assets';

interface AssetUploaderProps {
  folderId?: string;
  tagIds?: string[];
  onUploaded?: (asset: Asset) => void;
}

export function AssetUploader({ folderId, tagIds, onUploaded }: AssetUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;

    setUploading(true);
    setProgress(0);

    try {
      for (const file of Array.from(files)) {
        const asset = await uploadAsset(file, {
          folderId,
          tagIds,
          onProgress: setProgress,
        });
        onUploaded?.(asset);
      }
      toast.success('Archivo subido');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al subir');
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple
        onChange={(event) => void handleFiles(event.target.files)}
      />

      <Button
        type="button"
        variant="outline"
        loading={uploading}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mr-2 h-4 w-4" />
        Subir activos
      </Button>

      {uploading && (
        <div className="space-y-1">
          <Progress value={Math.round(progress * 100)} />
          <p className="text-xs text-[var(--foreground-muted)]">
            {Math.round(progress * 100)}% completado
          </p>
        </div>
      )}
    </div>
  );
}

export default AssetUploader;
