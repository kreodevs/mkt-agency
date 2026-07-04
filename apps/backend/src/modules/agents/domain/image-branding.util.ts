export interface BrandedImagePromptInput {
  productName: string;
  title?: string;
  body?: string;
  visualDescription?: string;
  hasLogo: boolean;
  visualFormat?: 'image' | 'video' | 'carousel';
}

export function buildBrandedImagePrompt(input: BrandedImagePromptInput): string {
  const productName = input.productName.trim() || 'la marca';
  const parts = [
    `Imagen de marketing para el producto "${productName}".`,
    'Debe ser claramente sobre este producto/marca, no un visual genérico intercambiable.',
  ];

  if (input.visualDescription?.trim()) {
    parts.push(`Escena: ${input.visualDescription.trim()}`);
  } else if (input.title?.trim()) {
    parts.push(`Tema del post: "${input.title.trim()}".`);
  }

  if (input.body?.trim()) {
    parts.push(`Contexto: ${input.body.replace(/\s+/g, ' ').trim().slice(0, 400)}`);
  }

  if (input.visualFormat === 'video') {
    parts.push(
      'Formato visual: video corto vertical para redes con narración hablada en español.',
    );
  } else if (input.visualFormat === 'carousel') {
    parts.push('Formato visual: carrusel de 3 imágenes relacionadas para redes sociales.');
  }

  if (input.hasLogo) {
    parts.push(
      `Incluye el nombre "${productName}" solo como texto legible (preferiblemente en la parte inferior), nunca como monograma o símbolo gráfico.`,
      'PROHIBIDO: logos, monogramas, iniciales estilizadas (ej. una "A" en círculo), iconos de marca, marcas de agua o símbolos en cualquier esquina.',
      'PROHIBIDO: recuadros blancos, cajas vacías o placeholders. La esquina inferior derecha debe quedar totalmente libre de gráficos; el logo oficial se superpone después por software.',
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
