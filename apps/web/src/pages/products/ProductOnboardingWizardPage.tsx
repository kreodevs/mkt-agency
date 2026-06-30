import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ExternalLink, PartyPopper } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  PRODUCT_ONBOARDING_SECTIONS,
  productToFormValues,
  stepToUpdatePayload,
  validateProductStep,
  type ProductOnboardingStepKey,
} from '@/config/product-onboarding-sections';
import { DashboardShell, tenantNavigation } from '@/components/layout/DashboardShell';
import { Button } from '@/components/atoms/Button';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Progress } from '@/components/molecules/Progress';
import { Stepper } from '@/components/molecules/Stepper';
import { Card } from '@/components/molecules/Card';
import { toast } from '@/components/molecules/Sonner';
import { ProductKeywordSuggestion } from '@/components/products/ProductKeywordSuggestion';
import { ProductKeywordTagsInput } from '@/components/products/ProductKeywordTagsInput';
import { SectionStepForm } from '@/pages/onboarding/SectionStepForm';
import { ApiError } from '@/services/api';
import {
  completeProductOnboarding,
  getProduct,
  getProductOnboardingStatus,
  updateProduct,
} from '@/services/products';
import type { CompleteProductOnboardingResponse } from '@/types/product';

export default function ProductOnboardingWizardPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [formValues, setFormValues] = useState<
    Record<ProductOnboardingStepKey, Record<string, string>>
  >({} as Record<ProductOnboardingStepKey, Record<string, string>>);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [completionResult, setCompletionResult] = useState<CompleteProductOnboardingResponse | null>(
    null,
  );
  const initializedRef = useRef(false);

  const productQuery = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id),
    enabled: Boolean(id),
  });

  const statusQuery = useQuery({
    queryKey: ['product-onboarding', id],
    queryFn: () => getProductOnboardingStatus(id),
    enabled: Boolean(id),
  });

  useEffect(() => {
    const product = productQuery.data;
    if (!product || initializedRef.current) return;

    setFormValues(productToFormValues(product));
    setKeywords(product.keywords ?? []);
    setWebsiteUrl(product.websiteUrl ?? '');

    const fields = statusQuery.data?.fields ?? [];
    const firstIncomplete = PRODUCT_ONBOARDING_SECTIONS.findIndex((section) => {
      if (section.key === 'keywords') {
        const kw = fields.find((f) => f.key === 'keywords');
        return section.mandatory && !kw?.complete;
      }
      const field = fields.find((f) => f.key === section.key);
      return section.mandatory && !field?.complete;
    });
    if (firstIncomplete >= 0) setCurrentStep(firstIncomplete);
    initializedRef.current = true;
  }, [productQuery.data, statusQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateProduct(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['product', id] });
      void queryClient.invalidateQueries({ queryKey: ['product-onboarding', id] });
      void queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => completeProductOnboarding(id),
    onSuccess: (result) => {
      setCompletionResult(result);
      void queryClient.invalidateQueries({ queryKey: ['product', id] });
      void queryClient.invalidateQueries({ queryKey: ['product-onboarding', id] });
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Onboarding completado — agentes iniciados');
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo completar el onboarding';
      toast.error(message);
    },
  });

  const currentSection = PRODUCT_ONBOARDING_SECTIONS[currentStep];
  const isLastStep = currentStep === PRODUCT_ONBOARDING_SECTIONS.length - 1;
  const isFirstStep = currentStep === 0;
  const isLoading = productQuery.isLoading || statusQuery.isLoading;
  const completionPercentage = statusQuery.data?.completionPercentage ?? 0;
  const isCompleted = statusQuery.data?.completed ?? false;

  const stepperModel = useMemo(
    () =>
      PRODUCT_ONBOARDING_SECTIONS.map((section) => ({
        label: section.label,
        description: section.mandatory ? 'Req.' : 'Opt.',
      })),
    [],
  );

  const handleFieldChange = (name: string, value: string) => {
    if (!currentSection) return;
    setFieldError(null);
    setFormValues((prev) => ({
      ...prev,
      [currentSection.key]: {
        ...prev[currentSection.key],
        [name]: value,
      },
    }));
  };

  const saveCurrentStep = async (): Promise<boolean> => {
    if (!currentSection) return false;

    const values = formValues[currentSection.key] ?? {};
    const validationError = validateProductStep(currentSection, values, keywords);
    if (validationError) {
      setFieldError(validationError);
      return false;
    }

    try {
      await saveMutation.mutateAsync(
        stepToUpdatePayload(currentSection.key, values, keywords, websiteUrl),
      );
      toast.success('Paso guardado');
      return true;
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'No se pudo guardar';
      toast.error(message);
      return false;
    }
  };

  const handleNext = async () => {
    const saved = await saveCurrentStep();
    if (!saved) return;

    if (isLastStep) {
      const freshStatus = await getProductOnboardingStatus(id);
      if (!freshStatus.ready) {
        setFieldError(`Faltan campos: ${freshStatus.missingFields.join(', ')}`);
        toast.error('Completa todos los campos obligatorios antes de activar agentes');
        return;
      }
      try {
        await completeMutation.mutateAsync();
      } catch {
        // toast handled in mutation
      }
      return;
    }

    setCurrentStep((step) => step + 1);
  };

  const handleBack = () => {
    setFieldError(null);
    setCurrentStep((step) => Math.max(0, step - 1));
  };

  if (isLoading) {
    return (
      <DashboardShell navigationOverride={tenantNavigation}>
        <div className="py-20 text-center text-[var(--foreground-muted)]">
          Cargando onboarding de producto...
        </div>
      </DashboardShell>
    );
  }

  if (productQuery.isError || !productQuery.data) {
    return (
      <DashboardShell navigationOverride={tenantNavigation}>
        <Card title="Producto no encontrado">
          <Link to="/products">
            <Button variant="outline">Volver al catálogo</Button>
          </Link>
        </Card>
      </DashboardShell>
    );
  }

  if (completionResult) {
    const { agents } = completionResult;
    return (
      <DashboardShell navigationOverride={tenantNavigation}>
        <PageHeader
          title="Onboarding de producto completado"
          description={`${completionResult.product.name} está listo para activar tus agentes.`}
        />

        <Card className="mx-auto max-w-2xl space-y-6">
          <div className="flex items-start gap-3">
            <PartyPopper className="mt-0.5 h-6 w-6 text-[var(--success)]" />
            <div>
              <p className="font-semibold text-[var(--foreground)]">Agentes detonados</p>
              <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                Brand Analyst, Competitor Intel y Community Manager trabajan sobre este producto.
              </p>
            </div>
          </div>

          <ul className="space-y-2 text-sm">
            {agents.brandInterviewId && (
              <li>
                <Link
                  to={`/agents/brand-interview/${agents.brandInterviewId}`}
                  className="inline-flex items-center gap-1 text-[var(--primary)] underline hover:no-underline"
                >
                  Brand Analyst
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </li>
            )}
            {agents.competitorAnalysisId && (
              <li>
                <Link
                  to={`/agents/competitor-intel?analysis=${agents.competitorAnalysisId}&productId=${id}`}
                  className="inline-flex items-center gap-1 text-[var(--primary)] underline hover:no-underline"
                >
                  Competitor Intel
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </li>
            )}
            {agents.communityManagerBatchId && (
              <li>
                <Link
                  to={`/community?productId=${id}`}
                  className="inline-flex items-center gap-1 text-[var(--primary)] underline hover:no-underline"
                >
                  Community Manager
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </li>
            )}
            {(agents.competitorsDiscovered ?? 0) > 0 && (
              <li className="text-[var(--foreground-muted)]">
                {agents.competitorsDiscovered} competidor(es) descubiertos con tus tags SEO.
              </li>
            )}
          </ul>

          {agents.warnings && agents.warnings.length > 0 && (
            <div className="rounded-[var(--radius)] border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-800 dark:text-amber-200">
              {agents.warnings.map((w) => (
                <p key={w}>{w}</p>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={() => navigate(`/products/${id}`)}>Ver producto</Button>
            <Button variant="outline" onClick={() => navigate('/products')}>
              Catálogo
            </Button>
          </div>
        </Card>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell navigationOverride={tenantNavigation}>
      <PageHeader
        title="Onboarding de producto"
        description={
          isCompleted
            ? `${productQuery.data.name} — perfil completo. Puedes editar o relanzar agentes.`
            : `Configura ${productQuery.data.name} para que los agentes trabajen sobre tu oferta.`
        }
      />

      {isCompleted && (
        <div className="mb-6 flex items-center gap-3 rounded-[var(--radius)] border border-[var(--success)]/30 bg-[var(--success)]/5 px-[var(--spacing-lg)] py-[var(--spacing-md)]">
          <PartyPopper className="h-5 w-5 shrink-0 text-[var(--success)]" />
          <div className="text-sm">
            <span className="font-semibold text-[var(--success)]">Onboarding completado</span>
            <span className="text-[var(--foreground-muted)]">
              {' '}
              — {completionPercentage}% de campos obligatorios.{' '}
              <Link to={`/products/${id}`} className="underline hover:no-underline">
                Ver ficha
              </Link>
            </span>
          </div>
        </div>
      )}

      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--foreground-muted)]">Progreso del producto</span>
          <span className="font-semibold text-[var(--primary)]">{completionPercentage}%</span>
        </div>
        <Progress value={completionPercentage} />
      </div>

      <Card className="overflow-hidden p-0">
        <header className="border-b border-[var(--border)] bg-[var(--background-secondary)] px-[var(--spacing-lg)]">
          <Stepper model={stepperModel} activeIndex={currentStep} readOnly />
        </header>

        <main className="p-[var(--spacing-xl)] lg:p-10">
          <div className="mx-auto max-w-2xl">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-black tracking-tight text-[var(--foreground)] md:text-3xl">
                {currentSection.label}
              </h2>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                {currentSection.key === 'keywords'
                  ? 'Indica la URL del producto, analiza la página y genera tags semánticos para competidores'
                  : currentSection.mandatory
                    ? 'Campo obligatorio para activar agentes sobre este producto'
                    : 'Opcional — enriquece el contexto de la IA'}
              </p>
            </div>

            {currentSection.key === 'keywords' ? (
              <>
                <ProductKeywordSuggestion
                  productId={id}
                  initialWebsiteUrl={websiteUrl}
                  disabled={saveMutation.isPending}
                  onWebsiteUrlChange={setWebsiteUrl}
                  onAccept={(suggested) => {
                    setFieldError(null);
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
                  onChange={(next) => {
                    setFieldError(null);
                    setKeywords(next);
                  }}
                  error={fieldError}
                />
              </>
            ) : (
              <SectionStepForm
                fields={currentSection.fields}
                values={formValues[currentSection.key] ?? {}}
                onChange={handleFieldChange}
                error={fieldError}
              />
            )}
          </div>
        </main>

        <footer className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--secondary)]/10 px-[var(--spacing-xl)] py-[var(--spacing-lg)]">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={isFirstStep || saveMutation.isPending || completeMutation.isPending}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>

          <Button
            onClick={() => void handleNext()}
            loading={saveMutation.isPending || completeMutation.isPending}
            className="min-w-[140px] gap-2"
          >
            {isLastStep ? 'Completar y activar agentes' : 'Guardar y continuar'}
            {!isLastStep && <ChevronRight className="h-4 w-4" />}
          </Button>
        </footer>
      </Card>
    </DashboardShell>
  );
}
