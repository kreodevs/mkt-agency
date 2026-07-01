import { Link } from 'react-router-dom';
import { CalendarDays, ClipboardCopy } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';
import { CampaignGeneratePosts } from '@/components/campaigns/CampaignGeneratePosts';

interface OrganicPublishingGuideProps {
  strategy: Record<string, unknown>;
  campaignId: string;
  productId: string | null;
  platforms: string[];
}

export function OrganicPublishingGuide({
  strategy,
  campaignId,
  productId,
  platforms,
}: OrganicPublishingGuideProps) {
  const publishingGuide =
    typeof strategy.publishingGuide === 'string'
      ? strategy.publishingGuide
      : 'Revisa cada post en el calendario, aprueba el contenido y publícalo manualmente en tus redes.';

  const linkedContentCount =
    typeof strategy.linkedContentCount === 'number' ? strategy.linkedContentCount : 0;

  return (
    <Card title="Publicación manual (Copiar y Llevar)">
      <div className="mb-4">
        <CampaignGeneratePosts
          campaignId={campaignId}
          productId={productId}
          platforms={platforms}
          linkedContentCount={linkedContentCount}
        />
      </div>
      <p className="mb-4 text-sm text-[var(--foreground-muted)]">
        Esta campaña es editorial: tú publicas en Instagram, Facebook, LinkedIn, etc. No hace falta
        Ads Manager ni configurar anuncios pagados.
      </p>

      <ol className="mb-4 list-inside list-decimal space-y-2 text-sm text-[var(--foreground-muted)]">
        <li>Abre el calendario y revisa los posts vinculados a esta campaña.</li>
        <li>Aprueba el contenido del día cuando esté listo.</li>
        <li>Usa Copiar y Llevar: copia texto e imagen y pégalo en la red correspondiente.</li>
      </ol>

      <div className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--secondary)]/30 px-3 py-2.5 text-sm text-[var(--foreground)]">
        <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
          <ClipboardCopy className="h-3.5 w-3.5" />
          Guía de publicación
        </p>
        <p className="whitespace-pre-wrap">{publishingGuide}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link to="/calendar">
          <Button type="button" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Ir al calendario
          </Button>
        </Link>
        <Link to={`/contents?campaignId=${campaignId}`}>
          <Button type="button" variant="outline">
            Ver contenidos
          </Button>
        </Link>
      </div>
    </Card>
  );
}
