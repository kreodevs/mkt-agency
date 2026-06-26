import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, PartyPopper } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getDefaultSectionValues,
  ONBOARDING_SECTIONS,
  toSectionPayload,
  validateSectionValues,
} from '@/config/onboarding-sections';
import { DashboardShell, tenantNavigation } from '@/components/layout/DashboardShell';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Progress } from '@/components/molecules/Progress';
import { Stepper } from '@/components/molecules/Stepper';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import {
  getCompanyProfile,
  listCompanyProfileSections,
  updateCompanyProfileSection,
} from '@/services/company-profile';
import type { SectionKey } from '@/types/company-profile';
import { SectionStepForm } from './SectionStepForm';
import { AISuggestion } from '@/components/onboarding/AISuggestion';

export default function OnboardingWizardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [formValues, setFormValues] = useState<Record<SectionKey, Record<string, string>>>(
    {} as Record<SectionKey, Record<string, string>>,
  );
  const [fieldError, setFieldError] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ['company-profile'],
    queryFn: getCompanyProfile,
  });

  const sectionsQuery = useQuery({
    queryKey: ['company-profile-sections'],
    queryFn: listCompanyProfileSections,
  });

  const saveMutation = useMutation({
    mutationFn: ({
      key,
      data,
    }: {
      key: SectionKey;
      data: Record<string, unknown>;
    }) => updateCompanyProfileSection(key, data),
    onSuccess: (result) => {
      queryClient.setQueryData(['company-profile'], (prev: typeof profileQuery.data) =>
        prev
          ? {
              ...prev,
              completionPercentage: result.completionPercentage,
              status: result.status,
            }
          : prev,
      );
      void queryClient.invalidateQueries({ queryKey: ['company-profile-sections'] });
    },
  });

  useEffect(() => {
    if (!sectionsQuery.data) return;

    const nextValues = {} as Record<SectionKey, Record<string, string>>;
    for (const section of ONBOARDING_SECTIONS) {
      const existing = sectionsQuery.data.find((s) => s.sectionKey === section.key)?.data;
      nextValues[section.key] = getDefaultSectionValues(section, existing);
    }
    setFormValues(nextValues);

    const firstIncomplete = ONBOARDING_SECTIONS.findIndex((section) => {
      const remote = sectionsQuery.data?.find((s) => s.sectionKey === section.key);
      return section.mandatory && !remote?.isCompleted;
    });
    if (firstIncomplete >= 0) setCurrentStep(firstIncomplete);
  }, [sectionsQuery.data]);

  const currentSection = ONBOARDING_SECTIONS[currentStep];
  const isLastStep = currentStep === ONBOARDING_SECTIONS.length - 1;
  const isFirstStep = currentStep === 0;
  const isLoading = profileQuery.isLoading || sectionsQuery.isLoading;
  const isCompleted = profileQuery.data?.status === 'completed';

  const stepperModel = useMemo(
    () =>
      ONBOARDING_SECTIONS.map((section) => ({
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
    const validationError = validateSectionValues(currentSection, values);
    if (validationError) {
      setFieldError(validationError);
      return false;
    }

    try {
      const result = await saveMutation.mutateAsync({
        key: currentSection.key,
        data: toSectionPayload(values),
      });

      if (result.status === 'completed') {
        toast.success('Perfil completado al 80%. ¡Onboarding finalizado!');
      } else {
        toast.success('Sección guardada');
      }
      return true;
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo guardar la sección';
      toast.error(message);
      return false;
    }
  };

  const handleNext = async () => {
    const saved = await saveCurrentStep();
    if (!saved) return;

    if (isLastStep) {
      navigate('/');
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
          Cargando cuestionario...
        </div>
      </DashboardShell>
    );
  }

  if (isCompleted) {
    return (
      <DashboardShell navigationOverride={tenantNavigation}>
        <Card title="Onboarding completado" subtitle="Tu perfil de empresa está activo">
          <div className="flex flex-col items-start gap-4">
            <div className="flex items-center gap-2 text-[var(--success)]">
              <PartyPopper className="h-5 w-5" />
              <span className="font-medium">
                {profileQuery.data?.completionPercentage}% completado
              </span>
            </div>
            <p className="text-sm text-[var(--foreground-muted)]">
              Ya puedes usar la plataforma con el contexto de tu marca configurado.
            </p>
            <Link to="/">
              <Button>Volver al inicio</Button>
            </Link>
          </div>
        </Card>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell navigationOverride={tenantNavigation}>
      <PageHeader
        title="Onboarding de empresa"
        description="Completa las secciones obligatorias para activar tu perfil (80%)"
      />

      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--foreground-muted)]">Progreso global</span>
          <span className="font-semibold text-[var(--primary)]">
            {profileQuery.data?.completionPercentage ?? 0}%
          </span>
        </div>
        <Progress value={profileQuery.data?.completionPercentage ?? 0} />
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
                {currentSection.mandatory
                  ? 'Sección obligatoria para activar el perfil'
                  : 'Sección opcional — enriquece el contexto de la IA'}
              </p>
            </div>

            <AISuggestion
              sectionKey={currentSection.key}
              disabled={saveMutation.isPending}
              onAccept={(suggestion) => {
                setFormValues((prev) => ({
                  ...prev,
                  [currentSection.key]: {
                    ...prev[currentSection.key],
                    ...suggestion,
                  },
                }));
              }}
            />

            <SectionStepForm
              fields={currentSection.fields}
              values={formValues[currentSection.key] ?? {}}
              onChange={handleFieldChange}
              error={fieldError}
            />
          </div>
        </main>

        <footer className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--secondary)]/10 px-[var(--spacing-xl)] py-[var(--spacing-lg)]">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={isFirstStep || saveMutation.isPending}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>

          <Button
            onClick={() => void handleNext()}
            loading={saveMutation.isPending}
            className="min-w-[140px] gap-2"
          >
            {isLastStep ? 'Finalizar' : 'Guardar y continuar'}
            {!isLastStep && <ChevronRight className="h-4 w-4" />}
          </Button>
        </footer>
      </Card>
    </DashboardShell>
  );
}
