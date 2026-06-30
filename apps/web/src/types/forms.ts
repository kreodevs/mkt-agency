export interface FormFieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea';
  required?: boolean;
}

export interface Form {
  id: string;
  tenantId: string;
  productId: string | null;
  name: string;
  fields: FormFieldDefinition[];
  style: Record<string, unknown>;
  snippetJs: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedFormsResponse {
  items: Form[];
  total: number;
  page: number;
  limit: number;
}

export interface FormSnippetResponse {
  formId: string;
  snippetHtml: string;
  snippetJs: string;
}

export interface FormSubmission {
  id: string;
  formId: string;
  leadId: string | null;
  data: Record<string, unknown>;
  createdAt: string;
}

export interface PaginatedFormSubmissionsResponse {
  items: FormSubmission[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateFormPayload {
  name: string;
  fields: FormFieldDefinition[];
  style?: Record<string, unknown>;
  isActive?: boolean;
  productId?: string | null;
}

export interface UpdateFormPayload {
  name?: string;
  fields?: FormFieldDefinition[];
  style?: Record<string, unknown>;
  isActive?: boolean;
  productId?: string | null;
}

export const DEFAULT_FORM_FIELDS: FormFieldDefinition[] = [
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'name', label: 'Nombre', type: 'text' },
  { name: 'phone', label: 'Teléfono', type: 'tel' },
  { name: 'company', label: 'Empresa', type: 'text' },
  { name: 'message', label: 'Mensaje', type: 'textarea' },
];
