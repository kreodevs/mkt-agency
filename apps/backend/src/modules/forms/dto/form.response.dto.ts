import type { FormFieldDefinition } from '../infrastructure/typeorm/form.entity';

export class FormResponseDto {
  id!: string;
  tenantId!: string;
  productId!: string | null;
  name!: string;
  fields!: FormFieldDefinition[];
  style!: Record<string, unknown>;
  snippetJs!: string | null;
  isActive!: boolean;
  createdAt!: string;
  updatedAt!: string;
}

export class PaginatedFormsResponseDto {
  items!: FormResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
}

export class FormSnippetResponseDto {
  formId!: string;
  snippetHtml!: string;
  snippetJs!: string;
}

export class SubmitFormResponseDto {
  submissionId!: string;
  leadId!: string;
  message!: string;
  isDuplicate!: boolean;
}

export class FormSubmissionResponseDto {
  id!: string;
  formId!: string;
  leadId!: string | null;
  data!: Record<string, unknown>;
  createdAt!: string;
}

export class PaginatedFormSubmissionsResponseDto {
  items!: FormSubmissionResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
}
