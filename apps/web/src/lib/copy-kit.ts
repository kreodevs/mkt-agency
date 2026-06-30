import type { ContentType } from '@/types/content';
import type { PublicationInboxItem } from '@/types/publication-inbox';

export interface KitSection {
  type: ContentType;
  items: PublicationInboxItem[];
}

export function buildKitMarkdown(
  label: string,
  sections: KitSection[],
): string {
  const header = `# Kit Copiar y Llevar — ${label}\n\nContenido aprobado y congelado (firma SHA-256).\n`;
  const body = sections
    .map((section) => {
      const blocks = section.items
        .map(
          (item) =>
            `## ${item.title}\n- Fecha: ${item.scheduledDate}\n- Tipo: ${item.type}\n- Producto: ${item.productName ?? '—'}\n- Firma: ${item.signatureHash ?? '—'}\n\n${item.preview}\n`,
        )
        .join('\n');
      return `### ${section.type.toUpperCase()}\n\n${blocks}`;
    })
    .join('\n---\n\n');

  return `${header}\n${body}`;
}

export function groupInboxItemsByType(items: PublicationInboxItem[]): KitSection[] {
  const byType = new Map<ContentType, PublicationInboxItem[]>();
  for (const item of items) {
    const type = item.type as ContentType;
    const list = byType.get(type) ?? [];
    list.push(item);
    byType.set(type, list);
  }
  return Array.from(byType.entries()).map(([type, sectionItems]) => ({
    type,
    items: sectionItems,
  }));
}
