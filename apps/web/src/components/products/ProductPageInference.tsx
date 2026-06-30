import { useMutation } from '@tanstack/react-query';
import { Globe, Sparkles } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import { inferProductFromPage } from '@/services/products';
import type { InferProductFromPageResponse } from '@/types/product';

interface ProductPageInferenceProps {
  productId: string;
  websiteUrl: string;
  disabled?: boolean;
  onInferred: (result: InferProductFromPageResponse) => void;
}

export function ProductPageInference({
  productId,
  websiteUrl,
  disabled,
  onInferred,
}: ProductPageInferenceProps) {
  const inferMutation = useMutation({
    mutationFn: () => inferProductFromPage(productId, { url: websiteUrl.trim() }),
    onSuccess: (result) => {
      onInferred(result);
      toast.success('Campos inferidos desde la página. Revísalos y ajusta lo que necesites.');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo analizar la página');
    },
  });

  return (
    <div className="mb-6 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background-secondary)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--foreground)]">
            ¿No tienes claro cómo describir tu producto?
          </p>
          <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
            Analizamos la URL, interpretamos el contenido y prellenamos descripción, propuesta de
            valor, audiencia, precio y tags SEO.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={disabled || inferMutation.isPending || !websiteUrl.trim()}
          loading={inferMutation.isPending}
          onClick={() => inferMutation.mutate()}
        >
          {inferMutation.isPending ? (
            <>
              <Globe className="h-4 w-4 animate-pulse" />
              Analizando...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Analizar e inferir campos
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
