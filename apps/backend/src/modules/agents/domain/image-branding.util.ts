import type { ContentVisualFormat } from '../../content/domain/content.constants';

/** Esquina reservada para superponer el logo del producto tras la generación IA. */
export const PRODUCT_LOGO_CORNER = 'top-right' as const;

const LOGO_CORNER_LABEL_ES = 'esquina superior derecha';

export interface BrandedImagePromptInput {
  productName: string;
  title?: string;
  visualDescription?: string;
  hasLogo: boolean;
  visualFormat?: ContentVisualFormat;
}

export function buildBrandedImagePrompt(input: BrandedImagePromptInput): string {
  const productName = input.productName.trim() || 'la marca';
  const parts = [
    `Imagen de marketing para el producto "${productName}".`,
    'Debe ser claramente sobre este producto/marca, no un visual genérico intercambiable.',
    'NO renderices el texto del post, hashtags, captions ni copy publicable dentro de la imagen.',
  ];

  if (input.visualDescription?.trim()) {
    parts.push(`Escena visual (solo composición/fotografía/ilustración): ${input.visualDescription.trim()}`);
  } else if (input.title?.trim()) {
    parts.push(`Tema ilustrado (sin copiar el texto del post): "${input.title.trim()}".`);
  }

  if (input.visualFormat === 'carousel') {
    parts.push('Formato visual: carrusel de 3 imágenes relacionadas para redes sociales.');
  }

  if (input.hasLogo) {
    parts.push(
      `Incluye el nombre "${productName}" solo como texto legible (preferiblemente en la parte inferior), nunca como monograma o símbolo gráfico.`,
      'PROHIBIDO: logos, monogramas, iniciales estilizadas (ej. una "A" en círculo), iconos de marca, marcas de agua o símbolos en cualquier esquina.',
      `Reserva un margen limpio en la ${LOGO_CORNER_LABEL_ES} (~15% del lienzo) sin rostros, texto ni elementos clave; el logo oficial del producto se superpone ahí después por software.`,
      `PROHIBIDO: recuadros blancos, cajas vacías o placeholders en la ${LOGO_CORNER_LABEL_ES}.`,
    );
  } else {
    parts.push(
      `La imagen debe estar claramente asociada al producto/marca "${productName}" — incluye el nombre de forma legible en el diseño.`,
    );
  }

  parts.push(
    'Estilo profesional para redes sociales (Instagram/LinkedIn), alta calidad, sin texto ilegible ni marcas ajenas.',
  );

  return parts.join(' ');
}
