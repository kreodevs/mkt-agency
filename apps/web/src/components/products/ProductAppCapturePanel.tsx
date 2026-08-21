import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, ExternalLink, RefreshCw } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/atoms/Button';
import { InputText } from '@/components/atoms/InputText';
import { Card } from '@/components/molecules/Card';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import {
  getProductAppCapture,
  runProductAppCapture,
  updateProductAppCapture,
} from '@/services/products';
import type { UpdateProductAppCapturePayload } from '@/types/product';

interface ProductAppCapturePanelProps {
  productId: string;
  compact?: boolean;
}

export function ProductAppCapturePanel({ productId, compact = false }: ProductAppCapturePanelProps) {
  const queryClient = useQueryClient();
  const captureQuery = useQuery({
    queryKey: ['product-app-capture', productId],
    queryFn: () => getProductAppCapture(productId),
    enabled: Boolean(productId),
  });

  const [enabled, setEnabled] = useState(false);
  const [loginUrl, setLoginUrl] = useState('');
  const [appUrl, setAppUrl] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailSelector, setEmailSelector] = useState('');
  const [passwordSelector, setPasswordSelector] = useState('');
  const [submitSelector, setSubmitSelector] = useState('');
  const [manifestUrl, setManifestUrl] = useState('');
  const [autoCaptureBeforeGenerate, setAutoCaptureBeforeGenerate] = useState(false);

  useEffect(() => {
    const data = captureQuery.data;
    if (!data) return;
    setEnabled(data.enabled);
    setLoginUrl(data.loginUrl ?? '');
    setAppUrl(data.appUrl ?? '');
    setEmail(data.email ?? '');
    setPassword(data.hasPassword ? '••••••••' : '');
    setEmailSelector(data.emailSelector ?? '');
    setPasswordSelector(data.passwordSelector ?? '');
    setSubmitSelector(data.submitSelector ?? '');
    setManifestUrl(data.manifestUrl ?? '');
    setAutoCaptureBeforeGenerate(data.autoCaptureBeforeGenerate);
  }, [captureQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (payload: UpdateProductAppCapturePayload) =>
      updateProductAppCapture(productId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['product-app-capture', productId] });
      toast.success('Credenciales de la app guardadas');
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo guardar');
    },
  });

  const captureMutation = useMutation({
    mutationFn: () => runProductAppCapture(productId),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['product-app-capture', productId] });
      void queryClient.invalidateQueries({ queryKey: ['product-media-kit', productId] });
      if (result.status === 'success') {
        toast.success(
          result.capturedCount === 1
            ? '1 captura añadida al kit de medios'
            : `${result.capturedCount} capturas añadidas al kit de medios`,
        );
      } else {
        toast.error(result.error ?? 'No se pudieron capturar pantallas');
      }
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Error al capturar');
    },
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    saveMutation.mutate({
      enabled,
      loginUrl: loginUrl.trim() || undefined,
      appUrl: appUrl.trim() || undefined,
      email: email.trim() || undefined,
      password: password.trim() || undefined,
      emailSelector: emailSelector.trim() || undefined,
      passwordSelector: passwordSelector.trim() || undefined,
      submitSelector: submitSelector.trim() || undefined,
      manifestUrl: manifestUrl.trim() || undefined,
      autoCaptureBeforeGenerate,
    });
  };

  if (captureQuery.isLoading) {
    return (
      <Card title="Capturas reales de la app">
        <p className="text-sm text-[var(--foreground-muted)]">Cargando configuración…</p>
      </Card>
    );
  }

  const data = captureQuery.data;
  const screenshotCount = data?.screenshotCountInKit ?? 0;

  return (
    <Card
      title="Capturas reales de la app"
      subtitle={
        compact
          ? 'Login de prueba → screenshots al kit → arte social con la app real.'
          : 'Guarda credenciales de acceso de prueba, captura pantallas reales y úsalas en plantillas visuales y posts.'
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="flex items-center gap-2 text-sm text-[var(--foreground)]">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
            className="rounded border-[var(--border)]"
          />
          Activar captura automática de screenshots
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <InputText
            label="URL de login"
            type="url"
            value={loginUrl}
            onChange={(event) => setLoginUrl(event.target.value)}
            placeholder="https://app.ejemplo.com/login"
          />
          <InputText
            label="URL principal (post-login)"
            type="url"
            value={appUrl}
            onChange={(event) => setAppUrl(event.target.value)}
            placeholder="https://app.ejemplo.com/dashboard"
          />
          <InputText
            label="Email / usuario de prueba"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="off"
          />
          <InputText
            label="Contraseña de prueba"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            placeholder={data?.hasPassword ? '••••••••' : ''}
          />
        </div>

        <InputText
          label="URL del manifest de captura (opcional)"
          type="url"
          value={manifestUrl}
          onChange={(event) => setManifestUrl(event.target.value)}
          placeholder={
            data?.resolvedManifestUrl ??
            'https://app.ejemplo.com/tutorial-manifest.json'
          }
          fullWidth
        />
        <p className="text-xs text-[var(--foreground-muted)]">
          JSON con login, rutas y selectores. Vacío = prueba{' '}
          {data?.resolvedManifestUrl ?? '{origen}/tutorial-manifest.json'}. Soporta{' '}
          <code className="text-[var(--foreground)]">modules</code>,{' '}
          <code className="text-[var(--foreground)]">pages</code>,{' '}
          <code className="text-[var(--foreground)]">screens</code> o{' '}
          <code className="text-[var(--foreground)]">routes</code>.
        </p>

        {!compact && (
          <details className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
            <summary className="cursor-pointer font-medium text-[var(--foreground)]">
              Selectores CSS avanzados (opcional)
            </summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <InputText
                label="Campo email"
                value={emailSelector}
                onChange={(event) => setEmailSelector(event.target.value)}
                placeholder='input[name="email"]'
              />
              <InputText
                label="Campo contraseña"
                value={passwordSelector}
                onChange={(event) => setPasswordSelector(event.target.value)}
                placeholder='input[type="password"]'
              />
              <InputText
                label="Botón submit"
                value={submitSelector}
                onChange={(event) => setSubmitSelector(event.target.value)}
                placeholder='button[type="submit"]'
              />
            </div>
          </details>
        )}

        <label className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
          <input
            type="checkbox"
            checked={autoCaptureBeforeGenerate}
            onChange={(event) => setAutoCaptureBeforeGenerate(event.target.checked)}
            className="rounded border-[var(--border)]"
          />
          Capturar automáticamente antes de generar posts si hay menos de 10 screenshots en el kit
          (5 pantallas distintas en escritorio y móvil)
        </label>

        {data?.resolvedManifestUrl && (
          <p className="text-xs text-[var(--foreground-muted)]">
            {data.usesTutorialManifest
              ? `Última captura usó manifest (${data.resolvedManifestUrl}).`
              : data.manifestUrlConfigured
                ? `Manifest configurado: ${data.resolvedManifestUrl}`
                : `Sin URL propia: se intentará ${data.resolvedManifestUrl} al capturar.`}
          </p>
        )}

        {data?.lastCaptureAt && (
          <p className="text-xs text-[var(--foreground-muted)]">
            Última captura: {new Date(data.lastCaptureAt).toLocaleString('es-ES')}
            {data.lastCaptureStatus === 'failed' && data.lastCaptureError
              ? ` — error: ${data.lastCaptureError}`
              : data.lastCaptureStatus === 'success'
                ? ` — ${data.lastCaptureCount} imagen(es)`
                : ''}
          </p>
        )}

        <p className="text-sm text-[var(--foreground-muted)]">
          {screenshotCount} captura(s) en el kit de medios. Cada ejecución intenta{' '}
          <strong className="text-[var(--foreground)]">5 pantallas distintas</strong> en{' '}
          <strong className="text-[var(--foreground)]">escritorio y móvil</strong> (hasta 10
          imágenes). El compositor visual prioriza el rol{' '}
          <strong className="text-[var(--foreground)]">product-screenshot</strong>.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="outline" disabled={saveMutation.isPending}>
            Guardar credenciales
          </Button>
          <Button
            type="button"
            className="gap-2"
            disabled={!data?.configured || captureMutation.isPending}
            onClick={() => captureMutation.mutate()}
          >
            {captureMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            Capturar ahora
          </Button>
          <Link to={`/products/${productId}/media-kit`}>
            <Button type="button" variant="secondary" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Ver kit de medios
            </Button>
          </Link>
        </div>
      </form>
    </Card>
  );
}

export default ProductAppCapturePanel;
