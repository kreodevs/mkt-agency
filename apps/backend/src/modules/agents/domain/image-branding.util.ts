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
  visualHeadline?: string | null;
  visualSubline?: string | null;
  visualCta?: string | null;
  allowNativeText?: boolean;
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

  const headline = input.visualHeadline?.trim();
  const subline = input.visualSubline?.trim();
  const cta = input.visualCta?.trim();
  const isMarketingCreative = Boolean(headline || input.allowNativeText);

  const rawScene =
    input.artRecipeBasePrompt?.trim() ||
    input.visualDescription?.trim() ||
    (input.title?.trim() ? `Concepto visual fotográfico para ${input.title.trim()}` : '');
  const scene = hasLogo && !isMarketingCreative
    ? sanitizeVisualPromptForLogoOverlay(rawScene, productName)
    : rawScene;

  const parts: string[] = [];

  if (isMarketingCreative) {
    parts.push(
      'COMMERCIAL MARKETING AD POSTER & HIGH-CONVERTING SOCIAL MEDIA CREATIVE:',
      `High-converting, editorial marketing poster ad for "${productName}". Professional advertising layout, premium graphic design, perfectly balanced hierarchy.`,
    );

    if (headline) {
      parts.push(
        `HEADLINE TYPOGRAPHY: Prominently feature this bold, high-contrast headline in Spanish at the top in clean modern sans-serif: "${headline}". Perfect Spanish typography, no typos, immaculate letter rendering.`,
      );
    }

    if (subline) {
      parts.push(
        `CATEGORY & FEATURE CHECKLIST: Prominently render the secondary category text and feature highlights in Spanish: "${subline}". Render the category title in vibrant brand accent color (e.g. pink / magenta) and format each benefit item with a distinct circular checkmark icon "✓".`,
      );
    }

    if (cta) {
      const ctaWithArrow = cta.includes('→') || cta.includes('>') ? cta : `${cta} →`;
      parts.push(
        `CALL TO ACTION BUTTON: Eye-catching rounded pill CTA button with text: "${ctaWithArrow}". Placed cleanly in the lower half of the design in high-contrast vibrant accent color (e.g. vibrant fuchsia / pink or brand accent) with crisp readable text.`,
      );
    }

    if (hasLogo) {
      parts.push(
        `BRAND IDENTITY & EDITORIAL FOOTER: At the bottom, render a clean, high-end editorial brand footer. On the right side, render the brand tagline in spaced small-caps and editorial micro-labels in the corner. CRITICAL LOGO REQUIREMENT: On the left side of the footer, leave a completely clean, empty space for the official logo. Do NOT draw, invent, or render any brand emblem, mascot, animal head, icon, crest, or fake logo graphic anywhere in the image. The official brand logo will be composited onto the bottom-left by software. Absolutely zero fictional mascots and no hallucinated logos.`,
      );
    } else {
      parts.push(
        `BRAND IDENTITY & EDITORIAL FOOTER: At the bottom, render a clean, high-end editorial brand footer: the exact wordmark "${productName}" in clean modern typography, followed by the brand tagline in spaced small-caps, and editorial micro-labels in the corner. Zero fake barcodes, no random model numbers, no watermarks, no fictional mascots.`,
      );
    }

    if (scene) {
      parts.push(`ESCENA Y COMPOSICIÓN: ${scene}`);
    }

    parts.push(
      'DIRECTRICES VISUALES Y MOCKUPS: Composición publicitaria de nivel agencia y performance marketing. Si el concepto involucra una app móvil o recuerdos digitales, incluye en primer plano un mockup hiperrealista (por ejemplo, una mano sosteniendo un smartphone moderno mostrando la interfaz real con cuadrícula de fotos o funciones activas con branding de "${productName}") perfectamente integrado con la iluminación ambiental de la escena de fondo. Si involucra eventos (bodas, XV años, convenciones, bautizos), muestra a los protagonistas y a los invitados interactuando alegremente capturando fotos con sus teléfonos. Si es un concepto mágico de marca, ilustra al alebrije o símbolo resplandeciente rodeado de fotografías flotantes con destellos dorados.',
      `CONTROL DE TEXTO Y LIMPIEZA: Los ÚNICOS textos permitidos en la imagen son el HEADLINE especificado, el SUBTITLE/CHECKLIST y el botón CTA. ESTRICTAMENTE PROHIBIDO generar números de serie inventados (como CJ201, códigos de modelo o identificadores aleatorios), sellos falsos, marcas de agua, ni texto ficticio en las esquinas o bordes.${hasLogo ? ' PROHIBIDO inventar o dibujar isotipos, emblemas o mascotas gráficas de marca; el logo oficial se superpone automáticamente por software.' : ''}`,
    );

    if (input.visualFormat === 'carousel') {
      parts.push('Formato visual: carrusel publicitario de 3 imágenes secuenciales para redes sociales.');
    }

    if (input.primaryColor?.trim()) {
      parts.push(`Paleta de marca con acentos en ${input.primaryColor.trim()}.`);
    }

    if (input.visualStyle?.trim()) {
      parts.push(`Estética visual: ${input.visualStyle.trim()}.`);
    }

    if (input.competitorAngle?.trim()) {
      parts.push(`Ángulo de diferenciación: ${input.competitorAngle.trim()}`);
    }

    parts.push('Pieza publicitaria lista para publicar, alta conversión visual para feed de Instagram o LinkedIn.');
    return parts.join(' ');
  }

  parts.push(
    'CRITICAL REQUIREMENT - ABSOLUTELY ZERO TEXT IN IMAGE: ' +
      'Do NOT paint, write, or generate ANY words, letters, phrases, headlines, subtitles, quotes, or typography inside the image. ' +
      'The generated background must be 100% clean photography/artwork with NO written words in any language (no Spanish, no Italian, no English words painted in the image). ' +
      'All words, headlines, and copywriting are composited digitally in post-processing. Clean negative space only.',
    'ESTRICTAMENTE PROHIBIDO: CERO PALABRAS, CERO TEXTO Y CERO LETRAS DENTRO DE LA IMAGEN. ' +
      'NO dibujes ni escribas ningún titular, ni frases en la imagen. La foto debe ser 100% limpia de texto.',
  );

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
    'ESTILO Y COMPOSICIÓN: Fotografía publicitaria cinematográfica o arte editorial de alta gama. ' +
      'ESTRICTAMENTE PROHIBIDO: NO generes clip-art, iconos vectoriales 2D, diagramas, esquemas, infografías, ' +
      'códigos QR falsos, logos de WhatsApp o terceras empresas, ni texto dibujado a mano. ' +
      'La imagen debe ser una escena fotográfica o visual orgánica y completa.',
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
