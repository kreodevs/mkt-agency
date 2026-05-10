import { Accordion, AccordionTab } from '@/components'
import { cn } from '@/lib/utils'

export interface FAQItem {
    question: string
    answer: string
}

export interface FAQProps {
    items: FAQItem[]
    title?: string
    description?: string
    className?: string
}

export function FAQ({ items, title, description, className }: FAQProps) {
    return (
        <div className={cn("max-w-4xl mx-auto py-20 px-[var(--spacing-md)]", className)}>
            {(title || description) && (
                <div className="text-center mb-[var(--spacing-3xl)]">
                    {title && <h2 className="text-4xl md:text-5xl font-black text-[var(--foreground)] mb-[var(--spacing-lg)] tracking-tight leading-tight">{title}</h2>}
                    {description && <p className="text-lg md:text-xl text-[var(--foreground-muted)] max-w-2xl mx-auto">{description}</p>}
                </div>
            )}

            <Accordion
                multiple
                variant="separated"
                className="max-w-3xl mx-auto"
            >
                {items.map((item, index) => (
                    <AccordionTab
                        key={index}
                        header={item.question}
                    >
                        <div
                            className="bg-[var(--card)]/50 p-[var(--spacing-lg)] rounded-b-[var(--radius-lg)] border-t border-[var(--border)]"
                            dangerouslySetInnerHTML={{ __html: item.answer }}
                        />
                    </AccordionTab>
                ))}
            </Accordion>

            {/* JSON-LD for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        "mainEntity": items.map(item => ({
                            "@type": "Question",
                            "name": item.question,
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": item.answer
                            }
                        }))
                    })
                }}
            />
        </div>
    )
}

export default FAQ
