// REGISTRY: RichTextEditor

import { forwardRef } from 'react'
import { Editor, type EditorProps } from 'primereact/editor'
import { cn } from '@/lib/utils'

export interface RichTextEditorProps extends EditorProps {
    error?: string;
    label?: string;
}

export const RichTextEditor = forwardRef<Editor, RichTextEditorProps>(
    ({ className, error, label, ...props }, ref) => {
        return (
            <div className="flex flex-col gap-1.5 w-full">
                {label && <label className="text-sm font-medium leading-none text-[var(--foreground)]">{label}</label>}
                <Editor
                    ref={ref}
                    className={cn(
                        "w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] ring-offset-[var(--background)] overflow-hidden",
                        "pb-[var(--spacing-2xl)] /* Quill usually needs bottom spacing */ pb-0",
                        error && "border-[var(--destructive)]",
                        className
                    )}
                    pt={{
                        toolbar: { className: "bg-[var(--secondary)] !border-0 !border-b !border-[var(--border)] flex flex-wrap gap-[var(--spacing-xs)] p-[var(--spacing-sm)]" },
                        content: { className: "bg-[var(--background)] text-[var(--foreground)] !border-0 min-h-[150px]" },
                        root: { className: "text-sm" }
                    }}
                    {...props}
                />
                {error && <span className="text-[14px] text-[var(--destructive)] font-medium">{error}</span>}
            </div>
        )
    }
)
RichTextEditor.displayName = 'RichTextEditor'
