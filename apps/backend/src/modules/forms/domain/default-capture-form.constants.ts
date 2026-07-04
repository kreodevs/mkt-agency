import type { FormFieldDefinition } from '../infrastructure/typeorm/form.entity';

export const DEFAULT_CAPTURE_FORM_NAME = 'Captura SOHO';

export const DEFAULT_CAPTURE_FORM_FIELDS: FormFieldDefinition[] = [
  { name: 'name', label: 'Nombre', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'WhatsApp / Teléfono', type: 'tel' },
  { name: 'message', label: '¿En qué te podemos ayudar?', type: 'textarea' },
];
