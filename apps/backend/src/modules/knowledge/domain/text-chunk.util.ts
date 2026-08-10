import { createHash } from 'crypto';

export function hashKnowledgeContent(content: string): string {
  return createHash('sha256').update(content.trim()).digest('hex');
}

export function splitTextIntoChunks(text: string, maxChars = 900): string[] {
  const normalized = text.trim();
  if (!normalized) {
    return [];
  }
  if (normalized.length <= maxChars) {
    return [normalized];
  }

  const paragraphs = normalized.split(/\n{2,}/);
  const chunks: string[] = [];
  let current = '';

  for (const paragraph of paragraphs) {
    const piece = paragraph.trim();
    if (!piece) {
      continue;
    }

    const candidate = current ? `${current}\n\n${piece}` : piece;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push(current);
    }

    if (piece.length > maxChars) {
      for (let offset = 0; offset < piece.length; offset += maxChars) {
        chunks.push(piece.slice(offset, offset + maxChars));
      }
      current = '';
    } else {
      current = piece;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

export function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}
