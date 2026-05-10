import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { Eye, Edit3 } from 'lucide-react';

export interface MarkdownEditorProps {
    value: string;
    onChange?: (value: string) => void;
    readOnly?: boolean;
    minHeight?: string;
    className?: string;
    placeholder?: string;
}

export const MarkdownEditor = ({
    value,
    onChange,
    readOnly = false,
    minHeight = '300px',
    className,
    placeholder = 'Escribe tu markdown aquí...'
}: MarkdownEditorProps) => {

    const [activeTab, setActiveTab] = React.useState('write');

    return (
        <div className={cn("w-full border border-[var(--border)] bg-[var(--background)] rounded-xl shadow-sm flex flex-col overflow-hidden", className)}>

            {!readOnly && (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1">
                    <div className="bg-[var(--secondary)] border-b border-[var(--border)] px-[var(--spacing-md)] py-[var(--spacing-sm)] flex items-center justify-between">
                        <TabsList className="flex gap-[var(--spacing-sm)]">
                            <TabsTrigger
                                value="write"
                                className="flex items-center gap-[var(--spacing-sm)] px-[var(--spacing-md)] py-1.5 text-sm font-medium text-[var(--foreground-muted)] rounded-md data-[state=active]:bg-[var(--background)] data-[state=active]:text-[var(--foreground)] data-[state=active]:shadow-sm transition-all outline-none"
                            >
                                <Edit3 className="w-4 h-4" />
                                Fuente
                            </TabsTrigger>
                            <TabsTrigger
                                value="preview"
                                className="flex items-center gap-[var(--spacing-sm)] px-[var(--spacing-md)] py-1.5 text-sm font-medium text-[var(--foreground-muted)] rounded-md data-[state=active]:bg-[var(--background)] data-[state=active]:text-[var(--foreground)] data-[state=active]:shadow-sm transition-all outline-none"
                            >
                                <Eye className="w-4 h-4" />
                                Vista Previa
                            </TabsTrigger>
                        </TabsList>

                        <div className="text-xs text-[var(--foreground-muted)] font-mono opacity-60">Markdown soportado</div>
                    </div>

                    <div style={{ minHeight }} className="flex flex-col flex-1 relative bg-[var(--background)]">
                        {/* Editor Textarea */}
                        <TabsContent value="write" className="flex-1 m-0 p-0 outline-none h-full flex flex-col">
                            <textarea
                                value={value}
                                onChange={(e) => onChange?.(e.target.value)}
                                placeholder={placeholder}
                                className="flex-1 w-full h-full min-h-[inherit] p-[var(--spacing-md)] bg-transparent resize-none outline-none text-sm text-[var(--foreground)] font-mono leading-relaxed"
                                spellCheck={false}
                            />
                        </TabsContent>

                        {/* Preview Panel */}
                        <TabsContent value="preview" className="flex-1 m-0 p-[var(--spacing-lg)] overflow-auto outline-none h-full prose prose-sm max-w-none dark:prose-invert prose-headings:font-bold prose-headings:text-[var(--foreground)] prose-p:text-[var(--foreground)] prose-a:text-[var(--primary)] prose-code:text-[var(--accent)]">
                            {value ? (
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {value}
                                </ReactMarkdown>
                            ) : (
                                <div className="flex h-full items-center justify-center text-[var(--foreground-muted)] italic text-sm">
                                    Nada que previsualizar.
                                </div>
                            )}
                        </TabsContent>
                    </div>
                </Tabs>
            )}

            {/* Read Only Mode */}
            {readOnly && (
                <div
                    style={{ minHeight }}
                    className="p-[var(--spacing-lg)] overflow-auto prose prose-sm max-w-none dark:prose-invert prose-headings:font-bold prose-headings:text-[var(--foreground)] prose-p:text-[var(--foreground)] prose-a:text-[var(--primary)] prose-code:text-[var(--accent)]"
                >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {value}
                    </ReactMarkdown>
                </div>
            )}

        </div>
    );
};
