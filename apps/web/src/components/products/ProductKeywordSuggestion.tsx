import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Globe, Sparkles } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { InputText } from '@/components/atoms/InputText';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import { suggestProductKeywords } from '@/services/products';

interface ProductKeywordSuggestionProps {
  productId: string;
  initialWebsiteUrl?: string | null;
  disabled?: boolean;
  onAccept: (keywords: string[]) => void;
  onWebsiteUrlChange?: (url: string) => void;
}

export function ProductKeywordSuggestion({
  productId,
  initialWebsiteUrl,
  disabled,
  onAccept,
  onWebsiteUrlChange,
}: ProductKeywordSuggestionProps) {
  const [websiteUrl, setWebsiteUrl] = useState(initialWebsiteUrl ?? '');

  useEffect(() => {
    if (initialWebsiteUrl) {
      setWebsiteUrl(initialWebsiteUrl);
    }
  }, [initialWebsiteUrl]);

  const suggestMutation = useMutation({
    mutationFn: () => suggestProductKeywords(productId, { url: websiteUrl.trim() }),
    onSuccess: (result) => {
      if (result.keywords.length === 0) {
        toast.message('No se generaron tags. Agrega algunos manualmente.');
        return;
      }
      onAccept(result.keywords);
      const source = result.sourceUrl ? ` desde ${result.sourceUrl}` : '';
      toast.success(`${result.keywords.length} tags generados${source}`);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo analizar la página');
    },
  });

  const handleUrlChange = (value: string) => {
    setWebsiteUrl(value);
    onWebsiteUrlChange?.(value);
  };

  return (
    <div className="mb-6 space-y-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background-secondary)] p-4">
      <div>
        <p className="text-sm font-medium text-[var(--foreground)]">
          Analizar página del producto
        </p>
        <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
          Hacemos scraping de la URL, la IA interpreta el contenido y el concepto del producto (no
          solo meta tags SEO) y propone keywords para encontrar competidores.
        </p>
      </div>

      <InputText
        type="url"
        label="URL de la página del producto"
        value={websiteUrl}
        onChange={(e) => handleUrlChange(e.target.value)}
        placeholder="https://tuempresa.com/producto"
        fullWidth
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        disabled={disabled || suggestMutation.isPending || !websiteUrl.trim()}
        loading={suggestMutation.isPending}
        onClick={() => suggestMutation.mutate()}
      >
        {suggestMutation.isPending ? (
          <>
            <Globe className="h-4 w-4 animate-pulse" />
            Analizando página...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Analizar página y generar tags
          </>
        )}
      </Button>
    </div>
  );
}
