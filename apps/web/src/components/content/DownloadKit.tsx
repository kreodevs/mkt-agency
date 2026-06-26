import { useMemo } from 'react';
import { Download, Copy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';
import { toast } from '@/components/molecules/Sonner';
import { getCalendarDay } from '@/services/calendar';
import type { CalendarDayItem } from '@/types/calendar';
import type { ContentType } from '@/types/content';

interface DownloadKitProps {
  date: string;
}

interface KitSection {
  type: ContentType;
  items: CalendarDayItem[];
}

function buildKitMarkdown(date: string, sections: KitSection[]): string {
  const header = `# Kit Copiar y Llevar — ${date}\n\nContenido aprobado y congelado (firma SHA-256).\n`;
  const body = sections
    .map((section) => {
      const blocks = section.items
        .map(
          (item) =>
            `## ${item.title}\n- Tipo: ${item.type}\n- Campaña: ${item.campaignName ?? '—'}\n- Firma: ${item.signatureHash ?? '—'}\n\n${item.preview}\n`,
        )
        .join('\n');
      return `### ${section.type.toUpperCase()}\n\n${blocks}`;
    })
    .join('\n---\n\n');

  return `${header}\n${body}`;
}

export function DownloadKit({ date }: DownloadKitProps) {
  const dayQuery = useQuery({
    queryKey: ['calendar-day', date, 'kit'],
    queryFn: () => getCalendarDay(date),
  });

  const approvedItems = useMemo(
    () =>
      (dayQuery.data?.items ?? []).filter(
        (item) => item.status === 'approved' && item.signatureHash,
      ),
    [dayQuery.data?.items],
  );

  const sections = useMemo(() => {
    const byType = new Map<ContentType, CalendarDayItem[]>();
    for (const item of approvedItems) {
      const type = item.type as ContentType;
      const list = byType.get(type) ?? [];
      list.push(item);
      byType.set(type, list);
    }
    return Array.from(byType.entries()).map(([type, items]) => ({ type, items }));
  }, [approvedItems]);

  const kitMarkdown = useMemo(
    () => (approvedItems.length ? buildKitMarkdown(date, sections) : ''),
    [approvedItems.length, date, sections],
  );

  const downloadFile = () => {
    if (!kitMarkdown) return;
    const blob = new Blob([kitMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `copiar-y-llevar-${date}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Kit descargado');
  };

  const copyAll = async () => {
    if (!kitMarkdown) return;
    await navigator.clipboard.writeText(kitMarkdown);
    toast.success('Kit copiado al portapapeles');
  };

  const frozenCount = approvedItems.length;
  const pendingCount = (dayQuery.data?.items ?? []).filter(
    (item) => item.status !== 'approved' || !item.signatureHash,
  ).length;

  return (
    <Card
      title="Copiar y Llevar"
      subtitle={`${date} — ${frozenCount} piezas listas${pendingCount ? `, ${pendingCount} pendientes de firma` : ''}`}
    >
      {dayQuery.isLoading && (
        <p className="text-sm text-[var(--foreground-muted)]">Preparando kit...</p>
      )}

      {!dayQuery.isLoading && frozenCount === 0 && (
        <p className="text-sm text-[var(--foreground-muted)]">
          No hay contenido aprobado y firmado para este día. Aprueba piezas en el calendario para
          liberar el kit.
        </p>
      )}

      {frozenCount > 0 && (
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.type}>
              <h4 className="mb-2 text-sm font-semibold uppercase text-[var(--foreground-muted)]">
                {section.type}
              </h4>
              <ul className="space-y-2 text-sm">
                {section.items.map((item) => (
                  <li key={item.contentId} className="rounded border border-[var(--border)] p-2">
                    <strong>{item.title}</strong>
                    <p className="mt-1 whitespace-pre-wrap text-[var(--foreground-muted)]">
                      {item.preview}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={downloadFile}>
              <Download className="mr-1 h-4 w-4" />
              Descargar .md
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={copyAll}>
              <Copy className="mr-1 h-4 w-4" />
              Copiar todo
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default DownloadKit;
