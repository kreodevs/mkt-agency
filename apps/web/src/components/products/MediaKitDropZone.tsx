import { Upload } from 'lucide-react';
import { useRef } from 'react';

interface MediaKitDropZoneProps {
  isDragOver: boolean;
  isBusy: boolean;
  productName: string;
  isUploading: boolean;
  onFiles: (files: File[]) => void;
  onDragOver: (event: React.DragEvent) => void;
  onDragEnter: (event: React.DragEvent) => void;
  onDragLeave: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
}

export function MediaKitDropZone({
  isDragOver,
  isBusy,
  productName,
  isUploading,
  onFiles,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onKeyDown,
}: MediaKitDropZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!isBusy) fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (fileList?.length) {
      onFiles(Array.from(fileList));
    }
    event.target.value = '';
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <div
        role="button"
        tabIndex={0}
        aria-label="Zona para arrastrar archivos al kit de medios"
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onKeyDown={onKeyDown}
        onClick={handleClick}
        className={[
          'rounded-[var(--radius)] border-2 border-dashed px-6 py-10 text-center transition-colors',
          isDragOver
            ? 'border-[var(--primary)] bg-[var(--primary)]/5'
            : 'border-[var(--border)] bg-[var(--background-secondary)]',
          isBusy ? 'pointer-events-none opacity-60' : 'cursor-pointer',
        ].join(' ')}
      >
        <Upload
          className={[
            'mx-auto mb-3 h-8 w-8',
            isDragOver ? 'text-[var(--primary)]' : 'text-[var(--foreground-muted)]',
          ].join(' ')}
        />
        <p className="text-sm font-medium text-[var(--foreground)]">
          {isDragOver ? 'Suelta los archivos aquí' : 'Arrastra imágenes o videos aquí'}
        </p>
        <p className="mt-1 text-xs text-[var(--foreground-muted)]">
          O haz clic para elegir archivos — {productName}
        </p>
        {isUploading && <p className="mt-2 text-xs text-[var(--primary)]">Subiendo...</p>}
      </div>
    </>
  );
}
