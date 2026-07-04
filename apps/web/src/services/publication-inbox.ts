import { apiFetch } from './api';
import type {
  BulkApproveResult,
  CopilotStatus,
  PrepareWeekResult,
  PublicationInboxData,
} from '@/types/publication-inbox';

export function getPublicationInbox(productId?: string): Promise<PublicationInboxData> {
  const query = productId ? `?productId=${encodeURIComponent(productId)}` : '';
  return apiFetch<PublicationInboxData>(`/publication-inbox${query}`);
}

export function getCopilotStatus(productId?: string): Promise<CopilotStatus> {
  const query = productId ? `?productId=${encodeURIComponent(productId)}` : '';
  return apiFetch<CopilotStatus>(`/publication-inbox/copilot-status${query}`);
}

export function prepareWeek(productId?: string): Promise<PrepareWeekResult> {
  return apiFetch<PrepareWeekResult>('/publication-inbox/prepare-week', {
    method: 'POST',
    body: JSON.stringify(productId ? { productId } : {}),
  });
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
