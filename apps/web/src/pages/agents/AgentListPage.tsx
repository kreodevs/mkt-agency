import { Bot, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardShell, tenantNavigation } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { Button } from '@/components/atoms/Button';
import { AGENTS_CATALOG } from '@/types/agents';

export default function AgentListPage() {
  return (
    <DashboardShell navigationOverride={tenantNavigation}>
      <PageHeader
        title="🤖 Agentes IA"
        description="Lanza agentes de inteligencia artificial para analizar, investigar y generar contenido para tu marca."
      />

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {AGENTS_CATALOG.map((agent) => (
          <Card
            key={agent.id}
            className="relative overflow-hidden border border-[var(--border)] transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            <div
              className={`h-2 bg-gradient-to-r ${agent.color}`}
            />
            <div className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20">
                <Bot className="h-6 w-6 text-violet-600" />
              </div>
              <h3 className="text-lg font-black tracking-tight text-[var(--foreground)]">
                {agent.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
                {agent.description}
              </p>
              <div className="mt-6 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                  <Sparkles className="h-3 w-3" />
                  Listo
                </span>
                <Link to={agent.href}>
                  <Button size="sm">Iniciar</Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {AGENTS_CATALOG.length === 0 && (
        <Card className="mt-6 text-center">
          <p className="py-12 text-[var(--foreground-muted)]">
            Próximamente más agentes disponibles.
          </p>
        </Card>
      )}
    </DashboardShell>
  );
}