import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Globe,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import type { SectionKey } from '@/types/company-profile';
import { updateCompanyProfileSection } from '@/services/company-profile';
import { analyzeWebsite, type WebsiteAnalysisResult } from '@/services/website-analyzer';
import { toast } from '@/components/molecules/Sonner';

type Step = 'input' | 'analyzing' | 'results';

export default function WebsiteAnalyzerFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('input');
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<WebsiteAnalysisResult | null>(null);

  const analyzeMutation = useMutation({
    mutationFn: () => analyzeWebsite(url),
    onSuccess: (data) => {
      setResult(data);
      setStep('results');
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!result) return;
      const sections: Array<{ key: SectionKey; data: Record<string, string> }> = [
        { key: 'company_name', data: { companyName: result.companyName } },
        { key: 'industry', data: { industry: result.industry } },
        { key: 'website', data: { website: result.website || result.extractedFrom } },
        { key: 'brand_voice', data: { brandVoice: result.brandVoice } },
        { key: 'target_audience_desc', data: { targetAudienceDesc: result.targetAudience } },
        { key: 'competitors', data: { competitors: result.competitors } },
        { key: 'objectives', data: { objectives: result.marketingObjectives } },
      ];

      for (const section of sections) {
        await updateCompanyProfileSection(section.key, section.data);
      }
    },
    onSuccess: () => {
      toast.success('Datos guardados en tu perfil');
      navigate('/onboarding');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error al guardar los datos');
      navigate('/onboarding');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setStep('analyzing');
    analyzeMutation.mutate();
  };

  const handleContinue = () => {
    saveMutation.mutate();
  };

  // Step 1: URL input
  if (step === 'input') {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
          <Sparkles className="h-10 w-10 text-white" />
        </div>
        <h1 className="mb-2 text-2xl font-black text-[var(--foreground)]">
          Tu agencia de marketing IA
        </h1>
        <p className="mb-8 text-sm text-[var(--foreground-muted)]">
          SOHO, autoempleados, pequeños negocios — esto es tu agencia de marketing
          con inteligencia artificial. Estrategia, contenido, imágenes y análisis
          sin pagar una agencia tradicional.
        </p>

        <div className="mb-8 grid gap-3 text-left">
          {[
            { icon: Globe, text: 'Analiza tu sitio web y configura todo automáticamente' },
            { icon: Sparkles, text: 'Genera copy para redes sociales con IA' },
            { icon: ArrowRight, text: 'Estrategia automática que se ajusta sola' },
            { icon: CheckCircle2, text: 'Dashboard con métricas y diagnóstico' },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--secondary)]">
                <item.icon className="h-4 w-4 text-[var(--primary)]" />
              </div>
              <span className="text-sm text-[var(--foreground)]">{item.text}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://tuempresa.com"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] py-3 pl-10 pr-4 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
              required
            />
          </div>
          <Button type="submit" className="w-full gap-2" size="lg">
            <Globe className="h-4 w-4" />
            Analizar sitio web
          </Button>
          <p className="text-xs text-[var(--foreground-subtle)]">
            Extraeremos datos de tu web para preconfigurar tu agencia. También puedes{' '}
            <a
              href="/onboarding"
              className="text-[var(--primary)] hover:underline"
              onClick={(e) => {
                e.preventDefault();
                navigate('/onboarding');
              }}
            >
              configurar manualmente
            </a>
          </p>
        </form>
      </div>
    );
  }

  // Step 2: Analyzing
  if (step === 'analyzing') {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
          </div>
          <h2 className="mb-2 text-xl font-black text-[var(--foreground)]">
            Analizando {url}
          </h2>
          <p className="text-sm text-[var(--foreground-muted)]">
            Estamos extrayendo información de tu sitio web para preconfigurar tu agencia...
          </p>
          <div className="mt-8 space-y-3">
            {[
              'Extrayendo contenido de la página',
              'Analizando datos de la empresa',
              'Identificando industria y audiencia',
              'Detectando competidores y canales',
            ].map((msg, i) => (
              <div
                key={i}
                className="flex animate-pulse items-center gap-3 rounded-xl border border-[var(--border)] p-3"
                style={{ animationDelay: `${i * 200}ms`, opacity: 0.6 + i * 0.1 }}
              >
                <div className="h-2 w-2 rounded-full bg-[var(--primary)]" />
                <span className="text-sm text-[var(--foreground-muted)]">{msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Results
  if (!result) return null;

  const sections = [
    { label: 'Nombre', value: result.companyName },
    { label: 'Industria', value: result.industry },
    { label: 'Descripción', value: result.description },
    { label: 'Público objetivo', value: result.targetAudience },
    { label: 'Propuesta de valor', value: result.valueProposition },
    { label: 'Voz de marca', value: result.brandVoice },
    { label: 'Productos / Servicios', value: result.productsServices },
    { label: 'Competidores', value: result.competitors },
    { label: 'Objetivos de marketing', value: result.marketingObjectives },
    { label: 'Redes sociales', value: result.socialMediaChannels?.join(', ') || 'No detectadas' },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-black text-[var(--foreground)]">
          Sitio analizado con éxito
        </h2>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">
          Hemos extraído la siguiente información de{' '}
          <span className="font-medium text-[var(--foreground)]">{result.extractedFrom}</span>.
          Revisa los datos antes de continuar.
        </p>
      </div>

      <div className="mb-8 space-y-3">
        {sections.map((section) => (
          <div
            key={section.label}
            className="rounded-xl border border-[var(--border)] p-4"
          >
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
              {section.label}
            </p>
            <p className="text-sm text-[var(--foreground)]">
              {section.value || '—'}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          onClick={handleContinue}
          loading={saveMutation.isPending}
          className="min-w-[200px] gap-2"
          size="lg"
        >
          <Sparkles className="h-4 w-4" />
          {saveMutation.isPending ? 'Guardando...' : 'Ir al onboarding'}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setStep('input');
            setResult(null);
            setUrl('');
          }}
          className="gap-2"
          size="lg"
        >
          Analizar otro sitio
        </Button>
      </div>
    </div>
  );
}