import { Link } from 'react-router-dom';
import { Bot, ChevronRight, ImageIcon, Sparkles, Target } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { StatsCard } from '@/components/molecules/StatsCard';
import { Button } from '@/components/atoms/Button';
import { StatusPill } from '@/components/atoms/StatusPill';
import { AGENTS_CATALOG } from '@/types/agents';
import { getAgentCardActions, useAgentHubStats } from '@/hooks/useAgentHubStats';
import { ProductContextBanner } from '@/components/products/ProductContextBanner';
import { useResolvedProductId } from '@/hooks/useResolvedProductId';
import { withActiveProductQuery } from '@/store/active-product';
import { useOperatingProfile } from '@/hooks/useOperatingProfile';

const ICONS = {
  Bot,
  Target,
  Image: ImageIcon,
} as const;

export default function AgentListPage() {
  const hubStats = useAgentHubStats();
  const resolvedProductId = useResolvedProductId();
  const { isSoho } = useOperatingProfile();

  const withProduct = (href: string) => withActiveProductQuery(href);

  const activeAgents = AGENTS_CATALOG.filter(
    (agent) => hubStats[agent.id].statusTone !== 'neutral',
  ).length;

  return (
    <DashboardShell>
      <PageHeader
        eyebrow="Inteligencia artificial"
        title="Agentes IA"
        description={
          isSoho
            ? 'Brand Analyst, inteligencia competitiva e imágenes — complemento manual del copiloto semanal.'
            : 'Lanza agentes de inteligencia artificial para analizar, investigar y generar contenido para tu producto activo.'
        }
      />

      {resolvedProductId && <ProductContextBanner productId={resolvedProductId} />}

      <div className="mb-[var(--spacing-lg)] grid gap-[var(--spacing-md)] sm:grid-cols-3">
        <StatsCard
          title="Agentes disponibles"
          value={AGENTS_CATALOG.length}
          icon={<Bot className="h-5 w-5" />}
          iconTone="accent"
        />
        <StatsCard
          title="Con actividad reciente"
          value={activeAgents}
          icon={<Sparkles className="h-5 w-5" />}
          iconTone="primary"
        />
        <StatsCard
          title="Modo"
          value={isSoho ? 'Copiloto' : 'Growth'}
          description={isSoho ? 'Complemento manual semanal' : 'Orquestación completa'}
          icon={<Target className="h-5 w-5" />}
          iconTone="warning"
        />
      </div>

      <div className="grid gap-[var(--spacing-lg)] sm:grid-cols-2 lg:grid-cols-3">
        {AGENTS_CATALOG.map((agent) => {
          const stats = hubStats[agent.id];
          const actions = getAgentCardActions(agent, stats);
          const Icon = ICONS[agent.icon as keyof typeof ICONS] ?? Bot;

          return (
            <Card
              key={agent.id}
              variant="elevated"
              className="group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]"
            >
              <div className="mb-[var(--spacing-md)] flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] border border-[var(--brand)]/25 bg-[var(--brand-muted)] text-[var(--brand)]">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold tracking-tight text-[var(--foreground)]">
                {agent.name}
              </h3>
              <p className="mt-[var(--spacing-sm)] text-sm leading-relaxed text-[var(--foreground-muted)]">
                {agent.description}
              </p>

              <div className="mt-[var(--spacing-md)] flex flex-wrap items-center gap-[var(--spacing-sm)]">
                <StatusPill status={stats.statusTone}>{stats.statusLabel}</StatusPill>
                {stats.lastActivityAt && (
                  <span className="text-xs text-[var(--foreground-subtle)]">
                    {new Date(stats.lastActivityAt).toLocaleDateString('es-MX', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                )}
              </div>

              <div className="mt-[var(--spacing-lg)] flex flex-wrap items-center gap-[var(--spacing-sm)]">
                <Link to={withProduct(actions.primary.href)}>
                  <Button size="sm" variant="brand">
                    {actions.primary.label}
                  </Button>
                </Link>
                {actions.secondary && (
                  <Link to={withProduct(actions.secondary.href)}>
                    <Button variant="outline" size="sm" className="gap-1">
                      {actions.secondary.label}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </DashboardShell>
  );
}
