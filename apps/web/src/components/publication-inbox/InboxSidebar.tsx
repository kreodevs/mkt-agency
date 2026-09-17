import { Bot, Crosshair, FolderOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CopilotStatusPanel } from '@/components/copilot/CopilotStatusPanel';
import { InboxKitPanel } from '@/components/publication-inbox/InboxKitPanel';
import { Card } from '@/components/molecules/Card';
import { withActiveProductQuery } from '@/store/active-product';
import { LIBRARY_ROUTE } from '@/lib/tenant-navigation';

const COPILOT_COMPETITORS_PATH = '/copilot/competitors';

import type { PublicationInboxItem } from '@/types/publication-inbox';

interface InboxSidebarProps {
  productId: string | null | undefined;
  showCopilotAgents: boolean;
  advancedNav: boolean;
  readyItems: PublicationInboxItem[];
}

export function InboxSidebar({ productId, showCopilotAgents, advancedNav, readyItems }: InboxSidebarProps) {
  return (
    <div className="space-y-[var(--spacing-lg)] lg:order-2">
      <CopilotStatusPanel productId={productId ?? undefined} />

      {showCopilotAgents && (
        <Card title="Copiloto IA" subtitle="Complemento manual de tu semana">
          <div className="space-y-[var(--spacing-sm)] text-sm">
            <Link to={withActiveProductQuery(COPILOT_COMPETITORS_PATH)}
              className="flex items-center gap-[var(--spacing-sm)] rounded-[var(--radius-md)] border border-[var(--brand)]/30 bg-[var(--brand-muted)]/50 p-[var(--spacing-md)] transition-colors hover:border-[var(--brand)]">
              <Crosshair className="h-4 w-4 shrink-0 text-[var(--brand)]" />
              <span>
                <span className="block font-medium text-[var(--foreground)]">Análisis de competidores</span>
                <span className="text-xs text-[var(--foreground-muted)]">Descubre rivales y genera el reporte</span>
              </span>
            </Link>
            {[
              { to: '/agents', label: 'Catálogo de agentes', icon: Bot },
              { to: '/agents/brand-interview', label: 'Brand Analyst', icon: Bot },
              { to: '/agents/image-generator', label: 'Generador de imágenes', icon: Bot },
            ].map((item) => (
              <Link key={item.to} to={withActiveProductQuery(item.to)}
                className="flex items-center gap-[var(--spacing-sm)] rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--spacing-md)] transition-colors hover:border-[var(--primary)]">
                <item.icon className="h-4 w-4 shrink-0 text-[var(--primary)]" />
                {item.label}
              </Link>
            ))}
          </div>
        </Card>
      )}

      <InboxKitPanel items={readyItems} />

      <Card title="Librería multimedia" subtitle="Sube logos, fotos y material">
        <Link to={LIBRARY_ROUTE}
          className="flex items-center gap-[var(--spacing-sm)] rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--spacing-md)] text-sm transition-colors hover:border-[var(--primary)]">
          <FolderOpen className="h-4 w-4 shrink-0 text-[var(--primary)]" />
          Abrir librería de assets
        </Link>
      </Card>

      {advancedNav && (
        <Card title="Más herramientas" subtitle="Cuando necesites ir más allá del flujo diario">
          <div className="space-y-[var(--spacing-sm)] text-sm">
            <Link to="/agency-overview"
              className="flex items-center gap-[var(--spacing-sm)] rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--spacing-md)] transition-colors hover:border-[var(--primary)]">
              Resumen y KPIs
            </Link>
            <Link to={`/community${productId ? `?productId=${productId}` : ''}`}
              className="flex items-center gap-[var(--spacing-sm)] rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--spacing-md)] transition-colors hover:border-[var(--primary)]">
              Generar copy manual
            </Link>
            <Link to="/calendar"
              className="flex items-center gap-[var(--spacing-sm)] rounded-[var(--radius-md)] border border-[var(--border)] p-[var(--spacing-md)] transition-colors hover:border-[var(--primary)]">
              Calendario editorial
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
