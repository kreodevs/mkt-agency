import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/atoms/Button';
import { InputText } from '@/components/atoms/InputText';
import { Card } from '@/components/molecules/Card';
import { toast } from '@/components/molecules/Sonner';
import { ProductKeywordSuggestion } from '@/components/products/ProductKeywordSuggestion';
import { ProductKeywordTagsInput } from '@/components/products/ProductKeywordTagsInput';
import { ProductPageInference } from '@/components/products/ProductPageInference';
import { getApiErrorMessage } from '@/services/api';
import {
  getProduct,
  getProductOnboardingStatus,
  updateProduct,
} from '@/services/products';
import type { InferProductFromPageResponse, ProductCategory } from '@/types/product';

type BrandProductOnboardingPanelProps = {
  productId: string;
  onGenerateBrief: () => void;
  generatingBrief?: boolean;
};

function buildPayloadFromInference(
  result: InferProductFromPageResponse,
  keywords: string[],
  fallbackName: string,
): Record<string, unknown> {
  const mergedKeywords =
    keywords.length >= 3
      ? keywords
      : (result.keywords ?? []).map((k) => k.trim()).filter(Boolean);

  return {
    name: result.name?.trim() || fallbackName,
    ...(result.category?.trim() ? { category: result.category.trim() as ProductCategory } : {}),
    ...(result.description?.trim() ? { description: result.description.trim() } : {}),
    ...(result.valueProposition?.trim()
      ? { valueProposition: result.valueProposition.trim() }
      : {}),
    ...(result.targetAudience?.trim() ? { targetAudience: result.targetAudience.trim() } : {}),
    ...(result.priceRange?.trim() ? { priceRange: result.priceRange.trim() } : {}),
    websiteUrl: result.sourceUrl,
    ...(mergedKeywords.length > 0 ? { keywords: mergedKeywords } : {}),
  };
}

export function BrandProductOnboardingPanel({
  productId,
  onGenerateBrief,
  generatingBrief = false,
}: BrandProductOnboardingPanelProps) {
  const queryClient = useQueryClient();
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [inferredPreview, setInferredPreview] = useState<InferProductFromPageResponse | null>(
    null,
  );

  const productQuery = useQuery({
    queryKey: ['product', productId],
    queryFn: () => getProduct(productId),
  });

  const statusQuery = useQuery({
    queryKey: ['product-onboarding', productId],
    queryFn: () => getProductOnboardingStatus(productId),
  });

  const product = productQuery.data;
  const isReady = Boolean(product?.onboardingReady || statusQuery.data?.ready);
  const missingFields = statusQuery.data?.missingFields ?? [];

  useEffect(() => {
    if (!product) return;
    setWebsiteUrl(product.websiteUrl ?? '');
    setKeywords(product.keywords ?? []);
  }, [product?.id, product?.websiteUrl, product?.keywords]);

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateProduct(productId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['product', productId] });
      void queryClient.invalidateQueries({ queryKey: ['product-onboarding', productId] });
      void queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const handleInferred = async (result: InferProductFromPageResponse) => {
    setInferredPreview(result);
    setWebsiteUrl(result.sourceUrl);

    const mergedKeywords = [...keywords];
    for (const tag of result.keywords ?? []) {
      if (!mergedKeywords.some((k) => k.toLowerCase() === tag.toLowerCase())) {
        mergedKeywords.push(tag);
      }
    }
    setKeywords(mergedKeywords);

    try {
      await saveMutation.mutateAsync(
        buildPayloadFromInference(result, mergedKeywords, product?.name ?? 'Producto'),
      );
      toast.success('Perfil del producto inferido desde la web');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudieron guardar los datos inferidos'));
    }
  };

  const saveKeywordsMutation = useMutation({
    mutationFn: () =>
      updateProduct(productId, {
        keywords: keywords.map((k) => k.trim()).filter(Boolean),
        ...(websiteUrl.trim() ? { websiteUrl: websiteUrl.trim() } : {}),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['product', productId] });
      void queryClient.invalidateQueries({ queryKey: ['product-onboarding', productId] });
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Tags guardados');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudieron guardar los tags'));
    },
  });

  const previewLines = useMemo(() => {
    const source = inferredPreview ?? product;
    if (!source) return [];

    return [
      { label: 'Nombre', value: inferredPreview?.name ?? product?.name },
      { label: 'Descripción', value: inferredPreview?.description ?? product?.description },
      {
        label: 'Propuesta de valor',
        value: inferredPreview?.valueProposition ?? product?.valueProposition,
      },
      { label: 'Audiencia', value: inferredPreview?.targetAudience ?? product?.targetAudience },
    ].filter((line) => line.value?.trim());
  }, [inferredPreview, product]);

  const keywordCount = keywords.filter((k) => k.trim()).length;
  const canGenerate = isReady && keywordCount >= 3;
  const busy = saveMutation.isPending || saveKeywordsMutation.isPending || generatingBrief;

  const handleGenerate = async () => {
    if (keywordCount < 3) {
      toast.error('Agrega al menos 3 tags SEO antes de generar el Brand Brief');
      return;
    }

    const productKeywords = (product?.keywords ?? []).map((k) => k.trim()).filter(Boolean);
    const keywordsChanged =
      keywords.map((k) => k.trim()).filter(Boolean).join('|') !== productKeywords.join('|');

    if (keywordsChanged || (websiteUrl.trim() && websiteUrl.trim() !== product?.websiteUrl)) {
      try {
        await saveKeywordsMutation.mutateAsync();
      } catch {
        return;
      }
    }

    const freshStatus = await getProductOnboardingStatus(productId);
    if (!freshStatus.ready) {
      toast.error(
        freshStatus.missingFields.length > 0
          ? `Faltan campos: ${freshStatus.missingFields.join(', ')}`
          : 'Completa el perfil del producto antes de generar el Brand Brief',
      );
      return;
    }

    onGenerateBrief();
  };

  if (productQuery.isLoading) {
    return (
      <Card title="Onboarding del producto">
        <p className="text-sm text-[var(--foreground-muted)]">Cargando producto…</p>
      </Card>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <Card
      title={`Onboarding: ${product.name}`}
      subtitle="Analiza la página web del producto; inferimos el perfil comercial y generamos el Brand Brief sin entrevista manual."
    >
      <div className="space-y-4 text-left">
        <InputText
          type="url"
          label="URL de la página del producto"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://tuempresa.com/producto"
          fullWidth
        />

        <ProductPageInference
          productId={productId}
          websiteUrl={websiteUrl}
          disabled={busy}
          onInferred={(result) => {
            void handleInferred(result);
          }}
        />

        {previewLines.length > 0 ? (
          <div className="space-y-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background-secondary)] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
              Datos inferidos
            </p>
            {previewLines.map((line) => (
              <div key={line.label}>
                <p className="text-[11px] font-medium text-[var(--foreground-muted)]">{line.label}</p>
                <p className="text-sm text-[var(--foreground)]">{line.value}</p>
              </div>
            ))}
          </div>
        ) : null}

        {keywordCount < 3 || !isReady ? (
          <>
            <ProductKeywordSuggestion
              productId={productId}
              initialWebsiteUrl={websiteUrl}
              disabled={busy}
              onWebsiteUrlChange={setWebsiteUrl}
              onAccept={(suggested) => {
                setKeywords((prev) => {
                  const merged = [...prev];
                  for (const tag of suggested) {
                    if (!merged.some((k) => k.toLowerCase() === tag.toLowerCase())) {
                      merged.push(tag);
                    }
                  }
                  return merged;
                });
              }}
            />
            <ProductKeywordTagsInput
              keywords={keywords}
              onChange={setKeywords}
              error={
                keywordCount > 0 && keywordCount < 3
                  ? 'Agrega al menos 3 tags SEO'
                  : null
              }
            />
          </>
        ) : (
          <div className="flex items-start gap-2 rounded-[var(--radius)] border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <p className="text-[var(--foreground-muted)]">
              Perfil listo ({keywordCount} tags). Puedes generar el Brand Brief o{' '}
              <Link
                to={`/products/${productId}/onboarding`}
                className="font-medium text-[var(--primary)] underline"
              >
                abrir el wizard completo
              </Link>{' '}
              para ajustar detalles.
            </p>
          </div>
        )}

        {missingFields.length > 0 && !isReady ? (
          <p className="text-xs text-[var(--foreground-muted)]">
            Pendiente: {missingFields.join(', ')}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2 pt-1">
          {keywordCount >= 3 && keywords.join('|') !== (product.keywords ?? []).join('|') ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={saveKeywordsMutation.isPending}
              disabled={busy}
              onClick={() => saveKeywordsMutation.mutate()}
            >
              Guardar tags
            </Button>
          ) : null}
          <Button
            type="button"
            size="lg"
            className="gap-2"
            loading={generatingBrief}
            disabled={busy || !canGenerate}
            onClick={() => void handleGenerate()}
          >
            <Sparkles className="h-4 w-4" />
            Generar Brand Brief
          </Button>
        </div>
      </div>
    </Card>
  );
}
