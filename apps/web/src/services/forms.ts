import { apiFetch } from '@/services/api';
import type {
  CreateFormPayload,
  Form,
  FormSnippetResponse,
  PaginatedFormSubmissionsResponse,
  PaginatedFormsResponse,
  PublicForm,
  SubmitFormResult,
  UpdateFormPayload,
} from '@/types/forms';

export async function listForms(page = 1, limit = 20): Promise<PaginatedFormsResponse> {
  return apiFetch<PaginatedFormsResponse>(`/forms?page=${page}&limit=${limit}`);
}

export async function getForm(id: string): Promise<Form> {
  return apiFetch<Form>(`/forms/${id}`);
}

export async function createForm(payload: CreateFormPayload): Promise<Form> {
  return apiFetch<Form>('/forms', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateForm(id: string, payload: UpdateFormPayload): Promise<Form> {
  return apiFetch<Form>(`/forms/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteForm(id: string): Promise<void> {
  return apiFetch<void>(`/forms/${id}`, { method: 'DELETE' });
}

export async function getFormSnippet(id: string): Promise<FormSnippetResponse> {
  return apiFetch<FormSnippetResponse>(`/forms/${id}/snippet`);
}

export async function listFormSubmissions(
  id: string,
  page = 1,
  limit = 20,
): Promise<PaginatedFormSubmissionsResponse> {
  return apiFetch<PaginatedFormSubmissionsResponse>(
    `/forms/${id}/submissions?page=${page}&limit=${limit}`,
  );
}

export async function ensureCaptureForm(productId?: string): Promise<Form> {
  const query = productId ? `?productId=${encodeURIComponent(productId)}` : '';
  return apiFetch<Form>(`/forms/capture${query}`);
}

export async function getPublicForm(id: string): Promise<PublicForm> {
  return apiFetch<PublicForm>(`/forms/${id}/public`);
}

export async function submitPublicForm(
  id: string,
  payload: Record<string, string>,
): Promise<SubmitFormResult> {
  return apiFetch<SubmitFormResult>(`/forms/${id}/submit`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
