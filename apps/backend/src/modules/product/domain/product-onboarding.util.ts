import { ProductEntity } from '../infrastructure/typeorm/product.entity';

export interface ProductOnboardingFieldStatus {
  key: string;
  label: string;
  complete: boolean;
  required: boolean;
}

const REQUIRED_FIELDS: Array<{ key: keyof ProductEntity; label: string }> = [
  { key: 'name', label: 'Nombre del producto' },
  { key: 'category', label: 'Tipo de producto' },
  { key: 'description', label: 'Descripción' },
  { key: 'valueProposition', label: 'Propuesta de valor' },
  { key: 'targetAudience', label: 'Audiencia objetivo' },
];

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

export function getProductOnboardingFieldStatuses(
  product: ProductEntity,
): ProductOnboardingFieldStatus[] {
  const keywordCount = Array.isArray(product.keywords)
    ? product.keywords.filter((k) => String(k).trim()).length
    : 0;

  return [
    ...REQUIRED_FIELDS.map(({ key, label }) => ({
      key: String(key),
      label,
      required: true,
      complete:
        key === 'name' || key === 'category'
          ? hasText(product[key] as string | null)
          : hasText(product[key] as string | null),
    })),
    {
      key: 'priceRange',
      label: 'Rango de precio',
      required: false,
      complete: hasText(product.priceRange),
    },
    {
      key: 'keywords',
      label: 'Tags SEO',
      required: true,
      complete: keywordCount >= 3,
    },
  ];
}

export function calculateProductOnboardingCompletion(product: ProductEntity): number {
  const fields = getProductOnboardingFieldStatuses(product);
  const required = fields.filter((f) => f.required);
  const completed = required.filter((f) => f.complete).length;
  if (required.length === 0) return 0;
  return Math.round((completed / required.length) * 100);
}

export function getProductOnboardingMissing(product: ProductEntity): string[] {
  return getProductOnboardingFieldStatuses(product)
    .filter((f) => f.required && !f.complete)
    .map((f) => f.label);
}

export function isProductOnboardingReady(product: ProductEntity): boolean {
  return getProductOnboardingMissing(product).length === 0;
}

export function isProductOnboardingCompleted(product: ProductEntity): boolean {
  const at = product.metadata?.onboardingCompletedAt;
  return typeof at === 'string' && at.trim().length > 0;
}
