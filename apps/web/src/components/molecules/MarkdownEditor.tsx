import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

export interface MarkdownEditorProps {
  value: string;
  readOnly?: boolean;
  minHeight?: string;
  className?: string;
}

const proseClassName = cn(
  'prose prose-sm max-w-none dark:prose-invert',
  'prose-headings:font-bold prose-headings:text-[var(--foreground)]',
  'prose-p:text-[var(--foreground)] prose-a:text-[var(--primary)]',
  'prose-strong:text-[var(--foreground)] prose-li:text-[var(--foreground)]',
  'prose-code:text-[var(--accent)] prose-code:before:content-none prose-code:after:content-none',
  'prose-pre:bg-[var(--secondary)] prose-pre:text-[var(--foreground)]',
);

/** Visualización markdown GFM (modo readOnly de Kreo MarkdownEditor). */
export function MarkdownEditor({
  value,
  readOnly = true,
  minHeight = '240px',
  className,
}: MarkdownEditorProps) {
  if (!readOnly) {
    throw new Error('MarkdownEditor editable no está instalado en esta app; usa readOnly.');
  }

  return (
    <div
      className={cn(
        'w-full overflow-auto rounded-xl border border-[var(--border)] bg-[var(--background)] p-[var(--spacing-lg)] shadow-sm',
        proseClassName,
        className,
      )}
      style={{ minHeight }}
    >
      {value.trim() ? (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
      ) : (
        <p className="text-sm italic text-[var(--foreground-muted)]">Sin contenido markdown.</p>
      )}
    </div>
  );
}

export default MarkdownEditor;
