import type { ContentVisualFormat } from '../../content/domain/content.constants';

/** Esquina donde Sharp superpone el logo del producto tras la generación IA. */
export const PRODUCT_LOGO_CORNER = 'top-left' as const;

const LOGO_CORNER_LABEL_ES = 'esquina superior izquierda';

export interface BrandedImagePromptInput {
  productName: string;
  title?: string;
  visualDescription?: string;
  /** When set, used as primary visual scene instead of generic visualDescription. */
  artRecipeBasePrompt?: string;
  hasLogo: boolean;
  visualFormat?: ContentVisualFormat;
  primaryColor?: string;
  visualStyle?: string;
  competitorAngle?: string | null;
}

/** Remove renderable brand name tokens when the official logo is composited afterwards. */
export function sanitizeVisualPromptForLogoOverlay(
  prompt: string,
  productName: string,
): string {
  const name = productName.trim();
  if (!name || !prompt.trim()) {
    return prompt;
  }

  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return prompt
    .replace(new RegExp(`"${escaped}"`, 'gi'), '"la marca"')
    .replace(new RegExp(`'${escaped}'`, 'gi'), "'la marca'")
    .replace(new RegExp(`\\b${escaped}\\b`, 'gi'), 'la marca');
}

export function buildBrandedImagePrompt(input: BrandedImagePromptInput): string {
  const productName = input.productName.trim() || 'la marca';
  const hasLogo = input.hasLogo;

  const rawScene =
    input.artRecipeBasePrompt?.trim() ||
    input.visualDescription?.trim() ||
    (input.title?.trim() ? `Tema: ${input.title.trim()}` : '');
  const scene = hasLogo
    ? sanitizeVisualPromptForLogoOverlay(rawScene, productName)
    : rawScene;

  const parts: string[] = [];

  if (hasLogo) {
    parts.push(
      'Imagen de marketing para redes sociales. El logo oficial de la marca se superpone después por software.',
      'CRÍTICO: NO escribas el nombre de la marca, ni wordmarks, ni logotipos tipográficos, ni titulares con el nombre del producto dentro de la imagen.',
      `Deja limpia la ${LOGO_CORNER_LABEL_ES} — sin texto, sin cajas vacías, sin placeholders.`,
      'NO incluyas logos, monogramas, marcas de agua ni símbolos de marca generados por IA.',
    );
  } else {
    parts.push(
      `Imagen de marketing para el producto "${productName}".`,
      'Debe ser claramente sobre este producto/marca, no un visual genérico intercambiable.',
      `La imagen debe estar claramente asociada al producto/marca "${productName}" — incluye el nombre de forma legible en el diseño.`,
    );
  }

  parts.push(
    'NO renderices el texto del post, hashtags, captions ni copy publicable dentro de la imagen.',
  );

  if (scene) {
    parts.push(`Escena visual (solo composición/fotografía/ilustración): ${scene}`);
  }

  if (input.visualFormat === 'carousel') {
    parts.push('Formato visual: carrusel de 3 imágenes relacionadas para redes sociales.');
  }

  if (input.primaryColor?.trim()) {
    parts.push(`Usa la paleta de marca con acento en ${input.primaryColor.trim()} (sin texto en la imagen).`);
  }

  if (input.visualStyle?.trim()) {
    parts.push(`Estética: ${input.visualStyle.trim()}.`);
  }

  if (input.competitorAngle?.trim()) {
    parts.push(`Diferenciación visual frente a competencia: ${input.competitorAngle.trim()}`);
  }

  if (hasLogo) {
    parts.push(
      `El branding lo aporta únicamente el logo superpuesto en la ${LOGO_CORNER_LABEL_ES}; la escena no debe duplicar el nombre.`,
    );
  }

  parts.push(
    'Estilo profesional para redes sociales (Instagram/LinkedIn), alta calidad, sin texto ilegible ni marcas ajenas.',
  );

  return parts.join(' ');
}
