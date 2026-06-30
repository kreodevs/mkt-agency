import type { ProductCategory } from '@/types/product';
import type { SectionFieldConfig } from '@/config/onboarding-sections';

export type ProductOnboardingStepKey =
  | 'name'
  | 'category'
  | 'description'
  | 'valueProposition'
  | 'targetAudience'
  | 'priceRange'
  | 'keywords';

export interface ProductOnboardingSectionConfig {
  key: ProductOnboardingStepKey;
  label: string;
  mandatory: boolean;
  fields: SectionFieldConfig[];
}

const CATEGORY_OPTIONS: Array<{ label: string; value: ProductCategory }> = [
  { label: 'Producto físico', value: 'physical' },
  { label: 'Producto digital', value: 'digital' },
  { label: 'Servicio', value: 'service' },
  { label: 'Suscripción', value: 'subscription' },
  { label: 'Otro', value: 'other' },
];

export const PRODUCT_ONBOARDING_SECTIONS: ProductOnboardingSectionConfig[] = [
  {
    key: 'name',
    label: 'Producto',
    mandatory: true,
    fields: [
      {
        name: 'name',
        label: 'Nombre comercial',
        type: 'text',
        placeholder: 'Ej. Plan de consultoría SEO',
        required: true,
      },
    ],
  },
  {
    key: 'category',
    label: 'Tipo',
    mandatory: true,
    fields: [
      {
        name: 'category',
        label: 'Tipo de producto o servicio',
        type: 'select',
        required: true,
        options: CATEGORY_OPTIONS,
      },
    ],
  },
  {
    key: 'description',
    label: 'Descripción',
    mandatory: true,
    fields: [
      {
        name: 'description',
        label: 'Qué es y qué problema resuelve',
        type: 'textarea',
        placeholder: 'Describe tu oferta en 2–3 frases',
        required: true,
        rows: 4,
      },
    ],
  },
  {
    key: 'valueProposition',
    label: 'Propuesta de valor',
    mandatory: true,
    fields: [
      {
        name: 'valueProposition',
        label: 'Por qué elegirte',
        type: 'textarea',
        placeholder: 'Tu diferenciador frente a alternativas',
        required: true,
        rows: 4,
      },
    ],
  },
  {
    key: 'targetAudience',
    label: 'Audiencia',
    mandatory: true,
    fields: [
      {
        name: 'targetAudience',
        label: 'Cliente ideal',
        type: 'textarea',
        placeholder: '¿Quién compra esto?',
        required: true,
        rows: 4,
      },
    ],
  },
  {
    key: 'priceRange',
    label: 'Precio',
    mandatory: false,
    fields: [
      {
        name: 'priceRange',
        label: 'Rango de precio (opcional)',
        type: 'text',
        placeholder: 'Ej. $500 – $2,000 MXN',
      },
    ],
  },
  {
    key: 'keywords',
    label: 'Tags SEO',
    mandatory: true,
    fields: [],
  },
];

export function productToFormValues(product: {
  name: string;
  category: string | null;
  description: string | null;
  valueProposition: string | null;
  targetAudience: string | null;
  priceRange: string | null;
}): Record<ProductOnboardingStepKey, Record<string, string>> {
  return {
    name: { name: product.name ?? '' },
    category: { category: product.category ?? '' },
    description: { description: product.description ?? '' },
    valueProposition: { valueProposition: product.valueProposition ?? '' },
    targetAudience: { targetAudience: product.targetAudience ?? '' },
    priceRange: { priceRange: product.priceRange ?? '' },
    keywords: {},
  };
}

export function validateProductStep(
  section: ProductOnboardingSectionConfig,
  values: Record<string, string>,
  keywords: string[],
): string | null {
  if (section.key === 'keywords') {
    const count = keywords.filter((k) => k.trim()).length;
    if (count < 3) {
      return 'Agrega al menos 3 tags SEO para buscar competidores';
    }
    return null;
  }

  for (const field of section.fields) {
    if (field.required && !values[field.name]?.trim()) {
      return `${field.label} es obligatorio`;
    }
  }
  return null;
}

export function stepToUpdatePayload(
  key: ProductOnboardingStepKey,
  values: Record<string, string>,
  keywords: string[],
  websiteUrl?: string,
): Record<string, unknown> {
  switch (key) {
    case 'name':
      return { name: values.name?.trim() };
    case 'category':
      return { category: values.category?.trim() };
    case 'description':
      return { description: values.description?.trim() };
    case 'valueProposition':
      return { valueProposition: values.valueProposition?.trim() };
    case 'targetAudience':
      return { targetAudience: values.targetAudience?.trim() };
    case 'priceRange':
      return { priceRange: values.priceRange?.trim() || undefined };
    case 'keywords':
      return {
        keywords: keywords.map((k) => k.trim()).filter(Boolean),
        ...(websiteUrl?.trim() ? { websiteUrl: websiteUrl.trim() } : {}),
      };
    default:
      return {};
  }
}
