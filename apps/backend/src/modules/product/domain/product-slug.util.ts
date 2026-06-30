export function slugifyProductName(name: string): string {
  const base = name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);

  return base || 'producto';
}

export function parseProductNamesFromText(text: string): string[] {
  if (!text.trim()) {
    return [];
  }

  const parts = text
    .split(/[\n;•]|(?:,\s*(?=[A-ZÁÉÍÓÚÑ]))/u)
    .map((part) => part.replace(/^[-*•\d.)]+\s*/, '').trim())
    .filter((part) => part.length >= 2);

  return [...new Set(parts)].slice(0, 10);
}
