import { useQueries } from '@tanstack/react-query';
import {
  listCompetitorAnalyses,
  listImageGenerations,
  listInterviews,
} from '@/services/agents';
import type { AgentCatalogItem, AgentInterview } from '@/types/agents';
import { getEffectiveInterviewStatus } from '@/utils/brandInterview';

export interface AgentHubStat {
  total: number;
  inProgress: number;
  completed: number;
  failed: number;
  lastActivityAt: string | null;
  inProgressHref: string | null;
  lastResultHref: string | null;
  statusLabel: string;
  statusTone: 'success' | 'warning' | 'error' | 'neutral';
}

function effectiveStatus(item: AgentInterview): AgentInterview['status'] {
  return getEffectiveInterviewStatus(item);
}

function buildInterviewStats(items: Awaited<ReturnType<typeof listInterviews>>): AgentHubStat {
  const brandItems = items.filter((item) => item.agentType === 'brand_interview');
  const inProgress = brandItems.find((item) => effectiveStatus(item) === 'in_progress');
  const lastCompleted = brandItems.find((item) => effectiveStatus(item) === 'completed');
  const lastFailed = brandItems.find((item) => effectiveStatus(item) === 'failed');
  const lastItem = brandItems[0];
  const completedCount = brandItems.filter(
    (item) => effectiveStatus(item) === 'completed',
  ).length;

  let statusLabel = 'Sin ejecuciones';
  let statusTone: AgentHubStat['statusTone'] = 'neutral';
  if (inProgress) {
    statusLabel = 'En progreso';
    statusTone = 'warning';
  } else if (lastCompleted) {
    statusLabel = `${completedCount} completada(s)`;
    statusTone = 'success';
  } else if (lastFailed) {
    statusLabel = 'Última fallida';
    statusTone = 'error';
  }

  return {
    total: brandItems.length,
    inProgress: brandItems.filter((item) => effectiveStatus(item) === 'in_progress').length,
    completed: completedCount,
    failed: brandItems.filter((item) => effectiveStatus(item) === 'failed').length,
    lastActivityAt: lastItem?.updatedAt ?? null,
    inProgressHref: inProgress ? `/agents/brand-interview/${inProgress.id}` : null,
    lastResultHref: lastCompleted
      ? `/agents/brand-interview/${lastCompleted.id}`
      : lastFailed
        ? `/agents/brand-interview/${lastFailed.id}`
        : null,
    statusLabel,
    statusTone,
  };
}

function buildCompetitorStats(
  items: Awaited<ReturnType<typeof listCompetitorAnalyses>>,
): AgentHubStat {
  const inProgress = items.find(
    (item) => item.status === 'pending' || item.status === 'processing',
  );
  const lastCompleted = items.find((item) => item.status === 'completed');
  const lastFailed = items.find((item) => item.status === 'failed');

  let statusLabel = 'Sin ejecuciones';
  let statusTone: AgentHubStat['statusTone'] = 'neutral';
  if (inProgress) {
    statusLabel = 'Analizando';
    statusTone = 'warning';
  } else if (lastCompleted) {
    statusLabel = `${items.filter((item) => item.status === 'completed').length} reporte(s)`;
    statusTone = 'success';
  } else if (lastFailed) {
    statusLabel = 'Último fallido';
    statusTone = 'error';
  }

  return {
    total: items.length,
    inProgress: items.filter(
      (item) => item.status === 'pending' || item.status === 'processing',
    ).length,
    completed: items.filter((item) => item.status === 'completed').length,
    failed: items.filter((item) => item.status === 'failed').length,
    lastActivityAt: items[0]?.updatedAt ?? null,
    inProgressHref: inProgress ? `/agents/competitor-intel?analysis=${inProgress.id}` : null,
    lastResultHref: lastCompleted
      ? `/agents/competitor-intel?analysis=${lastCompleted.id}`
      : lastFailed
        ? `/agents/competitor-intel?analysis=${lastFailed.id}`
        : null,
    statusLabel,
    statusTone,
  };
}

function buildImageStats(items: Awaited<ReturnType<typeof listImageGenerations>>): AgentHubStat {
  const completed = items.filter((item) => item.status === 'completed' && item.imageUrl);
  const pending = items.filter(
    (item) => item.status === 'pending' || item.status === 'processing',
  );

  return {
    total: items.length,
    inProgress: pending.length,
    completed: completed.length,
    failed: items.filter((item) => item.status === 'failed').length,
    lastActivityAt: items[0]?.createdAt ?? null,
    inProgressHref: null,
    lastResultHref: items.length > 0 ? '/agents/image-generator' : null,
    statusLabel:
      items.length === 0
        ? 'Sin ejecuciones'
        : `${completed.length} imagen(es) · ${items.length} total`,
    statusTone: pending.length > 0 ? 'warning' : items.length > 0 ? 'success' : 'neutral',
  };
}

export function useAgentHubStats(): Record<string, AgentHubStat> {
  const results = useQueries({
    queries: [
      { queryKey: ['agent-interviews'], queryFn: listInterviews },
      { queryKey: ['competitor-analyses'], queryFn: listCompetitorAnalyses },
      { queryKey: ['image-generations'], queryFn: listImageGenerations },
    ],
  });

  const interviews = results[0].data ?? [];
  const competitors = results[1].data ?? [];
  const images = results[2].data ?? [];

  return {
    brand_interview: buildInterviewStats(interviews),
    competitor_intel: buildCompetitorStats(competitors),
    image_generation: buildImageStats(images),
  };
}

export function getAgentCardActions(agent: AgentCatalogItem, stats: AgentHubStat) {
  if (stats.inProgressHref) {
    return {
      primary: { label: 'Continuar', href: stats.inProgressHref },
      secondary: { label: 'Ver historial', href: agent.href },
    };
  }

  if (stats.total > 0) {
    return {
      primary: { label: 'Ver historial', href: agent.href },
      secondary: stats.lastResultHref
        ? { label: 'Último resultado', href: stats.lastResultHref }
        : null,
    };
  }

  return {
    primary: { label: 'Iniciar', href: agent.href },
    secondary: null,
  };
}
