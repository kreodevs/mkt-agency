import { Accordion as PrimeAccordion, type AccordionProps as PrimeAccordionProps, AccordionTab, type AccordionTabProps } from 'primereact/accordion'
import { ChevronDown } from 'lucide-react'
import { forwardRef, type ReactNode } from 'react'

export interface AccordionItemProps extends Omit<AccordionTabProps, 'pt'> {
  title: string
  subtitle?: string
  icon?: ReactNode
  disabled?: boolean
  children: ReactNode
}

export interface AccordionInputProps extends Omit<PrimeAccordionProps, 'pt'> {
  items?: AccordionItemProps[]
  variant?: 'default' | 'bordered' | 'separated'
  children?: ReactNode
}

const variantStyles = {
  default: {
    root: 'rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] overflow-hidden',
    tab: 'border-b border-[var(--border)] last:border-b-0',
  },
  bordered: {
    root: 'rounded-[var(--radius)] border-2 border-[var(--border)] bg-transparent overflow-hidden',
    tab: 'border-b-2 border-[var(--border)] last:border-b-0',
  },
  separated: {
    root: 'space-y-2',
    tab: 'rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] overflow-hidden',
  },
}

export const Accordion = forwardRef<HTMLDivElement, AccordionInputProps>(
  ({ items, variant = 'default', children, multiple = false, ...props }, ref) => {
    const styles = variantStyles[variant]

    const ptStyles = {
      root: {
        className: styles.root,
      },
      tab: {
        root: {
          className: styles.tab,
        },
        header: {
          className: `
            flex items-center w-full px-4 py-3
            text-left font-medium text-[var(--foreground)]
            bg-[var(--card)] hover:bg-[var(--secondary)]
            transition-colors cursor-pointer
            focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-inset
            [&[data-p-disabled=true]]:opacity-50 [&[data-p-disabled=true]]:cursor-not-allowed
          `,
        },
        headerAction: {
          className: 'flex items-center justify-between w-full gap-3',
        },
        headerIcon: {
          className: `
            w-4 h-4 shrink-0
            text-[var(--foreground-muted)]
            transition-transform duration-200
            [.p-accordion-tab[data-p-active=true]_&]:rotate-180
          `,
        },
        headerTitle: {
          className: 'flex-1 text-sm font-medium text-[var(--foreground)]',
        },
        content: {
          className: `
            px-4 py-3
            text-sm text-[var(--foreground-muted)]
            bg-[var(--background)]
            border-t border-[var(--border)]
          `,
        },
      },
    }

    const renderHeaderTemplate = (item: AccordionItemProps) => (options: any) => {
      return (
        <button
          className={ptStyles.tab.header.className}
          onClick={options.onClick}
          disabled={item.disabled}
        >
          <div className={ptStyles.tab.headerAction.className}>
            <div className="flex items-center gap-3 min-w-0">
              {item.icon && (
                <span className="shrink-0 text-[var(--accent)]">
                  {item.icon}
                </span>
              )}
              <div className="min-w-0">
                <div className="text-sm font-medium text-[var(--foreground)] truncate">
                  {item.title}
                </div>
                {item.subtitle && (
                  <div className="text-xs text-[var(--foreground-muted)] truncate">
                    {item.subtitle}
                  </div>
                )}
              </div>
            </div>
            <ChevronDown className={ptStyles.tab.headerIcon.className} />
          </div>
        </button>
      )
    }

    if (children) {
      return (
        <div ref={ref} className={styles.root}>
          <PrimeAccordion multiple={multiple} {...props} pt={ptStyles}>
            {children}
          </PrimeAccordion>
        </div>
      )
    }

    return (
      <div ref={ref} className={styles.root}>
        <PrimeAccordion multiple={multiple} {...props} pt={ptStyles}>
          {items?.map((item, index) => (
            <AccordionTab
              key={index}
              header={item.title}
              headerTemplate={renderHeaderTemplate(item)}
              disabled={item.disabled}
              pt={{
                root: { className: styles.tab },
                content: { className: ptStyles.tab.content.className },
              }}
            >
              {item.children}
            </AccordionTab>
          ))}
        </PrimeAccordion>
      </div>
    )
  }
)

Accordion.displayName = 'Accordion'

// Export AccordionTab for custom usage
export { AccordionTab }

// Simple wrapper for AccordionItem
export const AccordionItem = ({ children, ...props }: AccordionItemProps) => (
  <AccordionTab {...props}>{children}</AccordionTab>
)

export default Accordion
