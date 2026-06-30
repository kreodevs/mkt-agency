import { useMemo } from 'react';
import { Copy, Download } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';
import { toast } from '@/components/molecules/Sonner';
import { buildKitMarkdown, groupInboxItemsByType } from '@/lib/copy-kit';
import type { PublicationInboxItem } from '@/types/publication-inbox';

interface InboxKitPanelProps {
  items: PublicationInboxItem[];
}

export function InboxKitPanel({ items }: InboxKitPanelProps) {
  const sections = useMemo(() => groupInboxItemsByType(items), [items]);
  const label = useMemo(() => {
    if (items.length === 0) return '';
    const dates = [...new Set(items.map((item) => item.scheduledDate))].sort();
    if (dates.length === 1) return dates[0];
    return `${dates[0]} — ${dates[dates.length - 1]}`;
  }, [items]);

  const kitMarkdown = useMemo(
    () => (items.length ? buildKitMarkdown(label, sections) : ''),
    [items.length, label, sections],
  );

  const downloadFile = () => {
    if (!kitMarkdown) return;
    const blob = new Blob([kitMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `copiar-y-llevar-${label.replace(/\s/g, '')}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Kit descargado');
  };

  const copyAll = async () => {
    if (!kitMarkdown) return;
    await navigator.clipboard.writeText(kitMarkdown);
    toast.success('Kit copiado al portapapeles');
  };

  if (items.length === 0) {
    return (
      <Card title="Copiar y Llevar" subtitle="Aprueba contenido para liberar el kit">
        <p className="text-sm text-[var(--foreground-muted)]">
          Cuando apruebes publicaciones, aparecerán aquí listas para copiar a tus redes.
        </p>
      </Card>
    );
  }

  return (
    <Card
      title="Copiar y Llevar"
      subtitle={`${items.length} pieza(s) aprobada(s) — ${label}`}
    >
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
                  <p className="text-xs text-[var(--foreground-muted)]">{item.scheduledDate}</p>
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
    </Card>
  );
}

export default InboxKitPanel;
