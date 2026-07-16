import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Loader2,
  Sparkles,
  Target,
  UserCircle2,
  Users,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';
import { toast } from '@/components/molecules/Sonner';
import { ApiError } from '@/services/api';
import { getCopilotStatus, prepareWeek } from '@/services/publication-inbox';
import { CmCharacterSetupPanel } from '@/components/copilot/CmCharacterSetupPanel';

interface CopilotStatusPanelProps {
  productId?: string;
}

export function CopilotStatusPanel({ productId }: CopilotStatusPanelProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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
    mutationFn: () => prepareWeek(productId),
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
          : 'No se pudo preparar la semana';
      toast.error(message);
    },
  });

  const status = statusQuery.data;
  const isPreparing = prepareMutation.isPending;
  const analysisInFlight =
    status?.analysisStatus === 'pending' || status?.analysisStatus === 'processing';

  if (statusQuery.isLoading) {
    return (
      <Card title="Tu copiloto" subtitle="Estado del pipeline">
        <p className="text-sm text-[var(--foreground-muted)]">Cargando estado...</p>
      </Card>
    );
  }

  if (!status) return null;

  return (
    <div className="space-y-[var(--spacing-md)]">
    <Card
      title="Tu copiloto"
      subtitle={`Producto: ${status.productName}`}
    >
      <div className="space-y-[var(--spacing-md)]">
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--secondary)]/30 p-[var(--spacing-md)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
            Siguiente paso
          </p>
          <p className="mt-[var(--spacing-xs)] text-sm font-medium text-[var(--foreground)]">{status.nextStep}</p>
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
          />
          <PipelineRow
            icon={Target}
            label="Análisis de competencia"
            done={status.analysisStatus === 'completed'}
            detail={
              analysisInFlight
                ? 'En progreso...'
                : status.analysisUpdatedAt
                  ? `Actualizado ${new Date(status.analysisUpdatedAt).toLocaleDateString('es-MX')}`
                  : 'Pendiente'
            }
          />
        </ul>

        {status.prepareBlockedReason && (
          <p className="text-xs text-[var(--warning)]">{status.prepareBlockedReason}</p>
        )}

        <Button
          type="button"
          className="w-full"
          disabled={!status.canPrepareWeek || isPreparing || analysisInFlight}
          onClick={() => prepareMutation.mutate()}
        >
          {isPreparing || analysisInFlight ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Preparando tu semana...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Preparar mi semana
            </>
          )}
        </Button>

        <p className="text-xs text-[var(--foreground-subtle)]">
          El copiloto descubre competidores, analiza el mercado y genera publicaciones para que tú
          solo copies y pegues.
        </p>
      </div>
    </Card>

    {status.onboardingCompleted && (
      <CmCharacterSetupPanel productId={productId ?? status.productId} />
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

  if (href && !done) {
    return (
      <li>
        <Link to={href} className="hover:text-[var(--primary)]">
          {content}
        </Link>
      </li>
    );
  }

  return <li>{content}</li>;
}

export default CopilotStatusPanel;
