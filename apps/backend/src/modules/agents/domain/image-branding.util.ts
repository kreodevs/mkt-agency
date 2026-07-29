import type { ContentVisualFormat } from '../../content/domain/content.constants';

/** Esquina donde Sharp superpone el logo del producto tras la generación IA. */
export const PRODUCT_LOGO_CORNER = 'top-left' as const;

const LOGO_CORNER_LABEL_ES = 'esquina superior izquierda';

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
      'NO incluyas logos, monogramas, marcas de agua, iconos de redes (LinkedIn, Instagram, etc.) ni símbolos de marca generados por IA.',
      'NO dejes recuadros vacíos, cajas blancas, marcos en blanco ni placeholders en ninguna esquina — el lienzo debe estar totalmente compuesto.',
      `El logo oficial del producto se superpone después por software en la ${LOGO_CORNER_LABEL_ES}; no simules ni reserves un hueco para él.`,
      `Evita titulares grandes con el nombre "${productName}"; el branding lo aporta el logo superpuesto, no texto inventado.`,
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
