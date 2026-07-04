export const PRODUCT_MEDIA_ROLES = [
  'product-screenshot',
  'product-demo',
  'event-photo',
  'team-photo',
  'testimonial',
  'b-roll',
  'other',
] as const;

export type ProductMediaRole = (typeof PRODUCT_MEDIA_ROLES)[number];

export const PRODUCT_MEDIA_ROLE_LABELS: Record<ProductMediaRole, string> = {
  'product-screenshot': 'Captura de producto / app',
  'product-demo': 'Video demo del producto',
  'event-photo': 'Foto de evento o taller',
  'team-photo': 'Foto del equipo',
  testimonial: 'Testimonial',
  'b-roll': 'B-roll del nicho',
  other: 'Otro',
};

/** Prioridad al componer posts estáticos (más humano, menos stock). */
export const COMPOSE_IMAGE_ROLE_PRIORITY: ProductMediaRole[] = [
  'product-screenshot',
  'event-photo',
  'team-photo',
  'testimonial',
  'b-roll',
  'other',
];
