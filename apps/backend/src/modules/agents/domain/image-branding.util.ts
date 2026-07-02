export interface BrandedImagePromptInput {
  productName: string;
  title?: string;
  body?: string;
  visualDescription?: string;
  hasLogo: boolean;
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

  parts.push(
    `La imagen debe estar claramente asociada al producto/marca "${productName}" — incluye el nombre de forma legible en el diseño.`,
  );

  if (input.hasLogo) {
    parts.push(
      'Deja espacio limpio en la esquina superior derecha para superponer el logo oficial (no dibujes un logo inventado ni de otra marca).',
    );
  }

  parts.push(
    'Estilo profesional para redes sociales (Instagram/LinkedIn), alta calidad, sin texto ilegible ni marcas ajenas.',
  );

  return parts.join(' ');
}
