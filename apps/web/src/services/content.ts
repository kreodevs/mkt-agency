import { apiFetch } from '@/services/api';
import type {
  ApproveContentResponse,
  Content,
  CreateContentPayload,
  ListContentsParams,
  PaginatedContentsResponse,
  UpdateContentPayload,
  ContentVersion,
} from '@/types/content';

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

export async function listContents(
  params: ListContentsParams = {},
): Promise<PaginatedContentsResponse> {
  return apiFetch<PaginatedContentsResponse>(
    `/contents${buildQuery(params as Record<string, string | number | undefined>)}`,
  );
}

export async function getContent(id: string): Promise<Content> {
  return apiFetch<Content>(`/contents/${id}`);
}

export async function createContent(payload: CreateContentPayload): Promise<Content> {
  return apiFetch<Content>('/contents', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateContent(id: string, payload: UpdateContentPayload): Promise<Content> {
  return apiFetch<Content>(`/contents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteContent(id: string): Promise<void> {
  return apiFetch<void>(`/contents/${id}`, { method: 'DELETE' });
}

export async function listContentVersions(contentId: string): Promise<ContentVersion[]> {
  return apiFetch<ContentVersion[]>(`/contents/${contentId}/versions`);
}

export async function revertContent(
  contentId: string,
  versionId: string,
): Promise<ContentVersion> {
  return apiFetch<ContentVersion>(`/contents/${contentId}/revert/${versionId}`, {
    method: 'POST',
  });
}

export async function approveContentVersion(
  contentId: string,
  versionId: string,
  feedback?: string,
): Promise<ApproveContentResponse> {
  return apiFetch<ApproveContentResponse>(
    `/contents/${contentId}/versions/${versionId}/approve`,
    {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    },
  );
}

export async function rejectContentVersion(
  contentId: string,
  versionId: string,
  feedback?: string,
): Promise<{ contentId: string; versionId: string; status: string; message: string }> {
  return apiFetch(`/contents/${contentId}/versions/${versionId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ feedback }),
  });
}

export async function requestContentChanges(
  contentId: string,
  versionId: string,
  feedback?: string,
): Promise<ContentVersion> {
  return apiFetch<ContentVersion>(
    `/contents/${contentId}/versions/${versionId}/request-changes`,
    {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    },
  );
}
