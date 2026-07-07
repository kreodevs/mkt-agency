import { apiFetch, ApiError } from './api';
import type {
  BulkApproveResult,
  CopilotStatus,
  PrepareWeekJobStatus,
  PrepareWeekResult,
  PublicationInboxData,
  SohoSummary,
} from '@/types/publication-inbox';

const PREPARE_WEEK_POLL_INTERVAL_MS = 4000;
const PREPARE_WEEK_POLL_MAX_ATTEMPTS = 180;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getPublicationInbox(productId?: string): Promise<PublicationInboxData> {
  const query = productId ? `?productId=${encodeURIComponent(productId)}` : '';
  return apiFetch<PublicationInboxData>(`/publication-inbox${query}`);
}

export function getCopilotStatus(productId?: string): Promise<CopilotStatus> {
  const query = productId ? `?productId=${encodeURIComponent(productId)}` : '';
  return apiFetch<CopilotStatus>(`/publication-inbox/copilot-status${query}`);
}

export function getSohoSummary(productId?: string): Promise<SohoSummary> {
  const query = productId ? `?productId=${encodeURIComponent(productId)}` : '';
  return apiFetch<SohoSummary>(`/dashboard/soho-summary${query}`);
}

export function regenerateInboxContent(contentId: string): Promise<{ contentId: string; title: string; regenerated: true }> {
  return apiFetch(`/publication-inbox/regenerate/${contentId}`, { method: 'POST' });
}

export function requestInboxChanges(
  contentId: string,
  versionId: string,
  feedback: string,
): Promise<{ contentId: string; title: string; regenerated: true }> {
  return apiFetch(`/publication-inbox/request-changes/${contentId}`, {
    method: 'POST',
    body: JSON.stringify({ versionId, feedback }),
  });
}

export function getPrepareWeekJob(jobId: string): Promise<PrepareWeekJobStatus> {
  return apiFetch<PrepareWeekJobStatus>(`/publication-inbox/prepare-week/jobs/${jobId}`);
}

export async function prepareWeek(productId?: string): Promise<PrepareWeekResult> {
  const started = await apiFetch<{ jobId: string; status: 'processing' }>(
    '/publication-inbox/prepare-week',
    {
      method: 'POST',
      body: JSON.stringify(productId ? { productId } : {}),
    },
  );

  for (let attempt = 0; attempt < PREPARE_WEEK_POLL_MAX_ATTEMPTS; attempt += 1) {
    if (attempt > 0) {
      await sleep(PREPARE_WEEK_POLL_INTERVAL_MS);
    }

    const status = await getPrepareWeekJob(started.jobId);
    if (status.status === 'completed' && status.result) {
      return status.result;
    }
    if (status.status === 'failed') {
      throw new ApiError(status.error ?? 'No se pudo preparar la semana', 500);
    }
  }

  throw new ApiError(
    'El copiloto sigue preparando tu semana. Revisa la bandeja en unos minutos.',
    504,
  );
}

export function bulkApproveInbox(contentIds: string[]): Promise<BulkApproveResult> {
  return apiFetch<BulkApproveResult>('/publication-inbox/bulk-approve', {
    method: 'POST',
    body: JSON.stringify({ contentIds }),
  });
}

export function markNotificationRead(id: string): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>(`/publication-inbox/notifications/${id}/read`, {
    method: 'PATCH',
  });
}

export function markAllNotificationsRead(): Promise<{ marked: number }> {
  return apiFetch<{ marked: number }>('/publication-inbox/notifications/read-all', {
    method: 'PATCH',
  });
}
