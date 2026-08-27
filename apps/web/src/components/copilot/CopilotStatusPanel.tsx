import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Package,
  Sparkles,
  Target,
  UserCircle2,
  Users,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';
import { Stepper } from '@/components/molecules/Stepper';
import { Progress } from '@/components/molecules/Progress';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import { getCopilotStatus, prepareWeek } from '@/services/publication-inbox';
import type { CopilotPrepareHorizon } from '@/types/publication-inbox';
import { CmCharacterSetupPanel } from '@/components/copilot/CmCharacterSetupPanel';
import { withActiveProductQuery } from '@/store/active-product';

const COPILOT_COMPETITORS_PATH = '/copilot/competitors';

const HORIZON_OPTIONS: Array<{
  value: CopilotPrepareHorizon;
  label: string;
  hint: string;
}> = [
  { value: 'day', label: 'Día', hint: '2 posts/red · validar' },
  { value: 'week', label: 'Semana', hint: '5 posts · producción' },
];

function horizonLabel(horizon: CopilotPrepareHorizon): string {
  return horizon === 'day' ? 'día' : 'semana';
}

interface CopilotStatusPanelProps {
  productId?: string;
}

function pipelineActiveIndex(status: {
  onboardingCompleted: boolean;
  cmCharacterReady: boolean;
  competitorsCount: number;
  analysisStatus: string;
}): number {
  if (!status.onboardingCompleted) return 0;
  if (!status.cmCharacterReady) return 1;
  if (status.competitorsCount < 2) return 2;
  if (status.analysisStatus !== 'completed') return 3;
  return 4;
}

function pipelineProgressPercent(activeIndex: number): number {
  return Math.round((activeIndex / 4) * 100);
}

export function CopilotStatusPanel({ productId }: CopilotStatusPanelProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [horizon, setHorizon] = useState<CopilotPrepareHorizon>('day');

  const statusQuery = useQuery({
    queryKey: ['copilot-status', productId],
    queryFn: () => getCopilotStatus(productId),
    refetchInterval: (query) => {
      const status = query.state.data?.analysisStatus;
      if (status === 'pending' || status === 'processing') return 5000;
      return false;
    },
  });

  const prepareMutation = useMutation({
    mutationFn: () => prepareWeek(productId, horizon),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['copilot-status'] });
      void queryClient.invalidateQueries({ queryKey: ['publication-inbox'] });
      void queryClient.invalidateQueries({ queryKey: ['soho-summary'] });
      if (result.status === 'completed') {
        toast.success(
          `${result.postsGenerated} publicación(es) en «Por aprobar». Revísalas arriba en la bandeja.`,
        );
        navigate('/?welcome=1', { replace: true });
      } else if (result.status === 'blocked') {
        toast.error(result.message);
      } else {
        toast.message(result.message);
      }
      if (result.warnings.length > 0) {
        result.warnings.forEach((warning) => toast.message(warning));
      }
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : `No se pudo preparar tu ${horizonLabel(horizon)}`;
      toast.error(message);
    },
  });

  const status = statusQuery.data;
  const isPreparing = prepareMutation.isPending;
  const analysisInFlight =
    status?.analysisStatus === 'pending' || status?.analysisStatus === 'processing';

  if (statusQuery.isLoading) {
    return (
      <Card variant="accent" title="Tu copiloto" subtitle="Estado del pipeline">
        <p className="text-sm text-[var(--foreground-muted)]">Cargando estado...</p>
      </Card>
    );
  }

  if (!status) return null;

  const activeIndex = pipelineActiveIndex(status);
  const progress = pipelineProgressPercent(activeIndex);

  return (
    <div className="space-y-[var(--spacing-md)]">
      <Card
        variant="accent"
        title="Tu copiloto"
        subtitle={`Producto: ${status.productName}`}
      >
        <div className="space-y-[var(--spacing-md)]">
          <div className="space-y-[var(--spacing-sm)]">
            <div className="flex items-center justify-between gap-[var(--spacing-sm)]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
                Progreso del pipeline
              </p>
              <span className="text-xs font-semibold text-[var(--brand)]">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <Stepper
            readOnly
            activeIndex={activeIndex}
            className="py-[var(--spacing-sm)]"
            model={[
              { label: 'Producto', description: 'Onboarding', icon: <Package className="h-4 w-4" /> },
              { label: 'CMs', description: 'Retrato + preview', icon: <UserCircle2 className="h-4 w-4" /> },
              { label: 'Rival', description: 'Competidores', icon: <Users className="h-4 w-4" /> },
              { label: 'Intel', description: 'Análisis', icon: <Target className="h-4 w-4" /> },
            ]}
          />

          <div className="rounded-[var(--radius-md)] border border-[var(--brand)]/20 bg-[var(--brand-muted)]/60 p-[var(--spacing-md)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand)]">
              Siguiente paso
            </p>
            <p className="mt-[var(--spacing-xs)] text-sm font-medium text-[var(--foreground)]">
              {status.nextStep}
            </p>
          </div>

          <ul className="space-y-[var(--spacing-sm)] text-sm">
            <PipelineRow
              icon={CheckCircle2}
              label="Producto listo"
              done={status.onboardingCompleted}
              href="/products"
            />
            <PipelineRow
              icon={UserCircle2}
              label="CMs virtuales"
              done={status.cmCharacterReady}
              href={status.cmCharacterReady ? undefined : '/#cm-characters'}
              detail={
                status.cmCharactersTotalCount > 0
                  ? `${status.cmCharactersReadyCount}/${status.cmCharactersTotalCount} listas`
                  : status.cmCharacterStatus
              }
            />
            <PipelineRow
              icon={Users}
              label={`Competidores (${status.competitorsCount})`}
              done={status.competitorsCount >= 2}
              href={withActiveProductQuery(COPILOT_COMPETITORS_PATH)}
            />
            <PipelineRow
              icon={Target}
              label="Análisis de competencia"
              done={status.analysisStatus === 'completed'}
              href={withActiveProductQuery(COPILOT_COMPETITORS_PATH)}
              detail={
                analysisInFlight
                  ? 'En progreso...'
                  : status.analysisUpdatedAt
                    ? `Actualizado ${new Date(status.analysisUpdatedAt).toLocaleDateString('es-MX')}`
                    : 'Pendiente'
              }
            />
          </ul>

          {status.mediaKitLowWarning && (
            <p className="text-xs text-[var(--warning)]">{status.mediaKitLowWarning}</p>
          )}

          {status.prepareBlockedReason && (
            <p className="text-xs text-[var(--warning)]">{status.prepareBlockedReason}</p>
          )}

          <Link to={withActiveProductQuery(COPILOT_COMPETITORS_PATH)} className="block">
            <Button type="button" variant="outline" className="w-full gap-2">
              <Target className="h-4 w-4" />
              Análisis de competidores
            </Button>
          </Link>

          <div className="space-y-[var(--spacing-xs)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
              Alcance
            </p>
            <div className="grid grid-cols-2 gap-[var(--spacing-xs)]">
              {HORIZON_OPTIONS.map((option) => {
                const selected = horizon === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={isPreparing || analysisInFlight}
                    onClick={() => setHorizon(option.value)}
                    className={`rounded-[var(--radius-md)] border px-[var(--spacing-sm)] py-[var(--spacing-sm)] text-left transition-[var(--transition-base)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-60 ${
                      selected
                        ? 'border-[var(--brand)] bg-[var(--brand-muted)]/70'
                        : 'border-[var(--border)] bg-[var(--background)] hover:border-[var(--brand)]/40'
                    }`}
                  >
                    <span
                      className={`block text-sm font-semibold ${
                        selected ? 'text-[var(--brand)]' : 'text-[var(--foreground)]'
                      }`}
                    >
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-[var(--foreground-muted)]">
                      {option.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            type="button"
            variant="brand"
            className="w-full"
            disabled={!status.canPrepareWeek || isPreparing || analysisInFlight}
            onClick={() => prepareMutation.mutate()}
          >
            {isPreparing || analysisInFlight ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparando tu {horizonLabel(horizon)}...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Preparar mi {horizonLabel(horizon)}
              </>
            )}
          </Button>

          <p className="text-xs text-[var(--foreground-subtle)]">
            El copiloto descubre competidores, analiza el mercado y genera publicaciones para que tú
            solo copies y pegues. Día = 2 publicaciones por red seleccionada; Semana = tanda completa para producción.
          </p>

          {status.campaignTemplateSuggestions?.length > 0 && (
            <div className="rounded-[var(--radius-sm)] border border-[var(--border)] p-[var(--spacing-sm)]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
                Plantillas sugeridas para tu industria
              </p>
              <ul className="mt-2 space-y-2 text-sm">
                {status.campaignTemplateSuggestions.map((template) => (
                  <li key={template.templateId}>
                    <Link
                      to={`/campaigns/new?templateId=${template.templateId}`}
                      className="font-medium text-[var(--brand)] hover:underline"
                    >
                      {template.name}
                    </Link>
                    <p className="text-xs text-[var(--foreground-muted)]">{template.copilotHint}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>

      {status.onboardingCompleted && (
        <div id="cm-characters">
          <CmCharacterSetupPanel productId={productId ?? status.productId} />
        </div>
      )}
    </div>
  );
}

function PipelineRow({
  icon: Icon,
  label,
  done,
  href,
  detail,
}: {
  icon?: React.FC<{ className?: string }>;
  label: string;
  done: boolean;
  href?: string;
  detail?: string;
}) {
  const content = (
    <span className="flex items-center gap-2">
      {Icon ? (
        <Icon
          className={`h-4 w-4 ${done ? 'text-[var(--success)]' : 'text-[var(--foreground-muted)]'}`}
        />
      ) : null}
      <span className={done ? 'text-[var(--foreground)]' : 'text-[var(--foreground-muted)]'}>
        {label}
      </span>
      {detail && (
        <span className="text-xs text-[var(--foreground-subtle)]">· {detail}</span>
      )}
    </span>
  );

  if (href) {
    return (
      <li>
        <Link
          to={href}
          className="block rounded-[var(--radius-sm)] px-[var(--spacing-xs)] py-[var(--spacing-xxs)] transition-colors hover:bg-[var(--brand-muted)] hover:text-[var(--brand)]"
        >
          {content}
        </Link>
      </li>
    );
  }

  return <li>{content}</li>;
}

export default CopilotStatusPanel;
