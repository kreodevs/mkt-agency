import { useState } from 'react';
import { Copy, Download, Check } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Select } from '@/components/atoms/Select';
import { Card } from '@/components/molecules/Card';
import { toast } from '@/components/molecules/Sonner';
import {
  buildPostCopyText,
  CONTENT_PLATFORM_HINTS,
  CONTENT_PLATFORM_LABELS,
  CONTENT_PLATFORMS,
  getContentPlatformLabel,
  isContentPlatform,
  slugifyForFilename,
} from '@/lib/content-platform';
import { sanitizePublishableCopy } from '@/lib/sanitize-publishable-copy';
import { useContentAssetDownload } from '@/hooks/useContentAssetDownload';
import type { CmPlatform } from '@/services/community-manager';
import { ContentPlatformBadge } from './ContentPlatformBadge';

type ContentPublishPanelProps = {
  contentId: string;
  title: string;
  body: string;
  platform: string | null | undefined;
  versionAssets?: unknown[];
  onPlatformChange?: (platform: CmPlatform | '') => void;
  onSavePlatform?: () => void;
  savingPlatform?: boolean;
};

export function ContentPublishPanel({
  contentId,
  title,
  body,
  platform,
  versionAssets,
  onPlatformChange,
  onSavePlatform,
  savingPlatform = false,
}: ContentPublishPanelProps) {
  const [copied, setCopied] = useState(false);

  const {
    assetIds,
    isVideo,
    downloadingAssetId,
    downloadAsset,
    downloadAllVisuals,
  } = useContentAssetDownload({ contentId, title, versionAssets });

  const copyText = buildPostCopyText(title, sanitizePublishableCopy(body));
  const platformLabel = getContentPlatformLabel(platform);
  const platformValue = isContentPlatform(platform) ? platform : '';

  const copyPost = async () => {
    if (!copyText.trim()) {
      toast.error('No hay texto para copiar');
      return;
    }

    await navigator.clipboard.writeText(copyText);
    setCopied(true);
    toast.success('Copy copiado al portapapeles');
    window.setTimeout(() => setCopied(false), 2000);
  };

  const downloadCopy = () => {
    if (!copyText.trim()) {
      toast.error('No hay texto para descargar');
      return;
    }

    const slug = slugifyForFilename(title);
    const blob = new Blob([copyText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${slug}-copy.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Copy descargado');
  };

  return (
    <Card
      title="Copiar y publicar"
      subtitle={
        platformLabel
          ? `Material listo para pegar en ${platformLabel}`
          : 'Asigna una red social para orientar el formato del post'
      }
    >
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
            Red destino
          </span>
          <ContentPlatformBadge platform={platform} showUnset />
        </div>

        {onPlatformChange ? (
          <div className="flex flex-col gap-[var(--spacing-xs)]">
            <Select
              label="Cambiar red social"
              id="content-platform"
              value={platformValue}
              onChange={(event) => onPlatformChange(event.target.value as CmPlatform | '')}
              placeholder="Sin asignar"
              options={CONTENT_PLATFORMS.map((value) => ({
                value,
                label: CONTENT_PLATFORM_LABELS[value],
              }))}
            />
            {platformValue ? (
              <p className="text-xs text-[var(--foreground-muted)]">
                {CONTENT_PLATFORM_HINTS[platformValue]}
              </p>
            ) : null}
            {onSavePlatform ? (
              <Button
                type="button"
                variant="outline"
                loading={savingPlatform}
                onClick={onSavePlatform}
              >
                Guardar red social
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <p className="mb-4 text-sm text-[var(--foreground-muted)]">
        Copia el texto tal cual en la red indicada. Si generaste visual con IA, descárgalo y súbelo
        manualmente a la plataforma.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button type="button" className="gap-2" onClick={copyPost}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          Copiar copy
        </Button>
        <Button type="button" variant="outline" className="gap-2" onClick={downloadCopy}>
          <Download className="h-4 w-4" />
          Descargar copy (.txt)
        </Button>
        {assetIds.length === 1 ? (
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            loading={downloadingAssetId === assetIds[0]}
            onClick={() => downloadAsset(assetIds[0], 0)}
          >
            <Download className="h-4 w-4" />
            Descargar {isVideo ? 'video' : 'imagen'}
          </Button>
        ) : null}
        {assetIds.length > 1 ? (
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            loading={downloadingAssetId !== null}
            onClick={downloadAllVisuals}
          >
            <Download className="h-4 w-4" />
            Descargar {assetIds.length} archivos
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
