import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';
import { toast } from '@/components/molecules/Sonner';
import type { FormSnippetResponse } from '@/types/forms';

interface FormSnippetProps {
  snippet?: FormSnippetResponse;
  loading?: boolean;
}

async function copyText(value: string, label: string) {
  await navigator.clipboard.writeText(value);
  toast.success(`${label} copiado al portapapeles`);
}

export function FormSnippet({ snippet, loading }: FormSnippetProps) {
  const [copied, setCopied] = useState<'js' | 'html' | null>(null);

  const handleCopy = async (type: 'js' | 'html') => {
    if (!snippet) return;
    const value = type === 'js' ? snippet.snippetJs : snippet.snippetHtml;
    await copyText(value, type === 'js' ? 'Snippet JS' : 'Snippet HTML');
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <Card title="Snippet embebible">
        <p className="text-sm text-[var(--foreground-muted)]">Generando snippet...</p>
      </Card>
    );
  }

  if (!snippet) {
    return (
      <Card title="Snippet embebible">
        <p className="text-sm text-[var(--foreground-muted)]">
          Selecciona un formulario para ver el código de embed.
        </p>
      </Card>
    );
  }

  return (
    <Card title="Snippet embebible" subtitle="Copia el JS en tu sitio y monta con MktAgencyEmbed[formId](element)">
      <div className="mb-4 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => handleCopy('js')}>
          {copied === 'js' ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
          Copiar JS
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => handleCopy('html')}>
          {copied === 'html' ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
          Copiar HTML referencia
        </Button>
      </div>

      <pre className="max-h-panel-md overflow-auto rounded-lg border border-[var(--border)] bg-[var(--muted)] p-3 text-xs">
        {snippet.snippetJs}
      </pre>
    </Card>
  );
}

export default FormSnippet;
