import type { SectionKey } from '@/types/company-profile';

export type SectionFieldType = 'text' | 'url' | 'textarea' | 'select';

export interface SectionFieldConfig {
  name: string;
  label: string;
  type: SectionFieldType;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  rows?: number;
}

export interface OnboardingSectionConfig {
  key: SectionKey;
  label: string;
  description: string;
  mandatory: boolean;
  fields: SectionFieldConfig[];
}

export const ONBOARDING_SECTIONS: OnboardingSectionConfig[] = [
  {
    key: 'company_name',
    label: 'Empresa',
    description: 'Obligatorio',
    mandatory: true,
    fields: [
      {
        name: 'companyName',
        label: 'Nombre comercial',
        type: 'text',
        placeholder: 'Ej. Kreo Marketing',
        required: true,
      },
    ],
  },
  {
    key: 'industry',
    label: 'Industria',
    description: 'Obligatorio',
    mandatory: true,
    fields: [
      {
        name: 'industry',
        label: 'Sector',
        type: 'select',
        required: true,
        options: [
          { label: 'Retail / eCommerce', value: 'retail' },
          { label: 'Servicios profesionales', value: 'services' },
          { label: 'Salud', value: 'health' },
          { label: 'Tecnología', value: 'tech' },
          { label: 'Otro', value: 'other' },
        ],
      },
    ],
  },
  {
    key: 'website',
    label: 'Web',
    description: 'Obligatorio',
    mandatory: true,
    fields: [
      {
        name: 'website',
        label: 'Sitio web',
        type: 'url',
        placeholder: 'https://tuempresa.com',
        required: true,
      },
    ],
  },
  {
    key: 'brand_voice',
    label: 'Voz de marca',
    description: 'Obligatorio',
    mandatory: true,
    fields: [
      {
        name: 'brandVoice',
        label: 'Tono y personalidad',
        type: 'textarea',
        placeholder: 'Profesional, cercano, innovador...',
        required: true,
        rows: 4,
      },
    ],
  },
  {
    key: 'target_audience_desc',
    label: 'Audiencia',
    description: 'Obligatorio',
    mandatory: true,
    fields: [
      {
        name: 'targetAudienceDesc',
        label: 'Cliente ideal',
        type: 'textarea',
        placeholder: 'Describe a quién te diriges',
        required: true,
        rows: 4,
      },
    ],
  },
  {
    key: 'competitors',
    label: 'Competencia',
    description: 'Opcional',
    mandatory: false,
    fields: [
      {
        name: 'competitors',
        label: 'Principales competidores',
        type: 'textarea',
        placeholder: 'Uno por línea',
        rows: 3,
      },
    ],
  },
  {
    key: 'objectives',
    label: 'Objetivos',
    description: 'Opcional',
    mandatory: false,
    fields: [
      {
        name: 'objectives',
        label: 'Objetivos de marketing',
        type: 'textarea',
        placeholder: 'Awareness, leads, ventas...',
        rows: 3,
      },
    ],
  },
  {
    key: 'visual_preferences',
    label: 'Visual',
    description: 'Opcional',
    mandatory: false,
    fields: [
      {
        name: 'style',
        label: 'Estilo visual preferido',
        type: 'text',
        placeholder: 'Minimalista, corporativo, bold...',
      },
      {
        name: 'primaryColor',
        label: 'Color principal (hex)',
        type: 'text',
        placeholder: '#C9A227',
      },
    ],
  },
];

export function getDefaultSectionValues(
  section: OnboardingSectionConfig,
  existing?: Record<string, unknown>,
): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of section.fields) {
    const raw = existing?.[field.name];
    values[field.name] = raw != null ? String(raw) : '';
  }
  return values;
}

export function validateSectionValues(
  section: OnboardingSectionConfig,
  values: Record<string, string>,
): string | null {
  for (const field of section.fields) {
    if (field.required && !values[field.name]?.trim()) {
      return `${field.label} es obligatorio`;
    }
  }
  return null;
}

export function toSectionPayload(values: Record<string, string>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    const trimmed = value.trim();
    if (trimmed) payload[key] = trimmed;
  }
  return payload;
}
