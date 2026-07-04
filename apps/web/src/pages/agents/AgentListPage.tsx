import { Link } from 'react-router-dom';
import { Bot, ChevronRight, ImageIcon, Target } from 'lucide-react';
import { DashboardShell, tenantNavigation } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { Button } from '@/components/atoms/Button';
import { StatusPill } from '@/components/atoms/StatusPill';
import { AGENTS_CATALOG } from '@/types/agents';
import { getAgentCardActions, useAgentHubStats } from '@/hooks/useAgentHubStats';
import { ProductContextBanner } from '@/components/products/ProductContextBanner';
import { useResolvedProductId } from '@/hooks/useResolvedProductId';
import { withActiveProductQuery } from '@/store/active-product';

const ICONS = {
  Bot,
  Target,
  Image: ImageIcon,
} as const;

export default function AgentListPage() {
  const hubStats = useAgentHubStats();
  const resolvedProductId = useResolvedProductId();

  const withProduct = (href: string) => withActiveProductQuery(href);

  return (
    <DashboardShell navigationOverride={tenantNavigation}>
      <PageHeader
        title="🤖 Agentes IA"
        description="Lanza agentes de inteligencia artificial para analizar, investigar y generar contenido para tu producto activo."
      />

      {resolvedProductId && <ProductContextBanner productId={resolvedProductId} />}

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {AGENTS_CATALOG.map((agent) => {
          const stats = hubStats[agent.id];
          const actions = getAgentCardActions(agent, stats);
          const Icon = ICONS[agent.icon as keyof typeof ICONS] ?? Bot;

          return (
            <Card
              key={agent.id}
              className="relative overflow-hidden border border-[var(--border)] transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="h-2 bg-[var(--accent)]/30" />
              <div className="p-[var(--spacing-md)]">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] border border-[var(--accent)]/20 bg-[var(--accent)]/10">
                  <Icon className="h-6 w-6 text-[var(--accent)]" />
                </div>
                <h3 className="text-lg font-black tracking-tight text-[var(--foreground)]">
                  {agent.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
                  {agent.description}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
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

                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <Link to={withProduct(actions.primary.href)}>
                    <Button size="sm">{actions.primary.label}</Button>
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
              </div>
            </Card>
          );
        })}
      </div>
    </DashboardShell>
  );
}
