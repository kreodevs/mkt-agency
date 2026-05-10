import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import { ComponentPropsWithoutRef, forwardRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'

// === Interfaces ===

export interface AccordionItemProps {
  /** Unique identifier for the accordion item. Auto-generated from title if omitted. */
  value?: string
  title: string
  subtitle?: string
  icon?: ReactNode
  disabled?: boolean
  children: ReactNode
}

export interface AccordionProps extends Omit<ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>, 'className' | 'type'> {
  className?: string
  items?: AccordionItemProps[]
  variant?: 'default' | 'bordered' | 'separated'
  children?: ReactNode
  /** @deprecated Use `type="multiple"` instead of `multiple` boolean */
  multiple?: boolean
}

// === Variant Styles ===

const variantStyles = {
  default: {
    root: 'rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] overflow-hidden',
    item: 'border-b border-[var(--border)] last:border-b-0',
  },
  bordered: {
    root: 'rounded-[var(--radius)] border-2 border-[var(--border)] bg-transparent overflow-hidden',
    item: 'border-b-2 border-[var(--border)] last:border-b-0',
  },
  separated: {
    root: 'space-y-[var(--spacing-sm)]',
    item: 'rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] overflow-hidden',
  },
}

const triggerStyles = `
  flex items-center w-full px-[var(--spacing-md)] py-[var(--spacing-md)]
  text-left font-medium text-[var(--foreground)]
  bg-[var(--card)] hover:bg-[var(--secondary)]
  transition-colors cursor-pointer
  focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-inset
  data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed
`

const contentStyles = `
  px-[var(--spacing-md)] py-[var(--spacing-md)]
  text-sm text-[var(--foreground-muted)]
  bg-[var(--background)]
  border-t border-[var(--border)]
  overflow-hidden
`

const iconStyles = `
  w-4 h-4 shrink-0
  text-[var(--foreground-muted)]
  transition-transform duration-200
  group-data-[state=open]:rotate-180
`

// === Accordion Component ===

export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(
  ({ items, variant = 'default', className, children, multiple, ...props }, ref) => {
    const styles = variantStyles[variant]

    // Normalize backward-compat `multiple` boolean → Radix `type`
    const rootProps = {
      ...props,
      ...(multiple !== undefined ? { type: multiple ? 'multiple' : 'single' } : {}),
    } as ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>

    const content = children ? (
      children
    ) : (
      items?.map((item, index) => (
        <AccordionPrimitive.Item
          key={item.value ?? item.title ?? index}
          value={item.value ?? item.title ?? `accordion-item-${index}`}
          disabled={item.disabled}
          className={styles.item}
        >
          <AccordionPrimitive.Header className="flex">
            <AccordionPrimitive.Trigger
              className={cn(triggerStyles, 'group')}
              disabled={item.disabled}
            >
              <div className="flex items-center justify-between w-full gap-[var(--spacing-md)]">
                <div className="flex items-center gap-[var(--spacing-md)] min-w-0">
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
                <ChevronDown className={iconStyles} />
              </div>
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content className={contentStyles}>
            {item.children}
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))
    )

    return (
      <AccordionPrimitive.Root
        ref={ref}
        className={cn(styles.root, className)}
        {...rootProps}
      >
        {content}
      </AccordionPrimitive.Root>
    )
  },
)

Accordion.displayName = 'Accordion'

// === AccordionTab (backward-compat for code using `<AccordionTab header="..." />`) ===

export interface AccordionTabProps {
  value?: string
  header?: string
  disabled?: boolean
  children: ReactNode
}

export const AccordionTab = ({ value, header, disabled, children }: AccordionTabProps) => {
  const tabValue = value ?? header ?? crypto.randomUUID()

  return (
    <AccordionPrimitive.Item value={tabValue} disabled={disabled} className={variantStyles.default.item}>
      {header && (
        <AccordionPrimitive.Header className="flex">
          <AccordionPrimitive.Trigger
            className={cn(triggerStyles, 'group')}
            disabled={disabled}
          >
            <div className="flex items-center justify-between w-full gap-[var(--spacing-md)]">
              <span className="text-sm font-medium text-[var(--foreground)]">{header}</span>
              <ChevronDown className={iconStyles} />
            </div>
          </AccordionPrimitive.Trigger>
        </AccordionPrimitive.Header>
      )}
      <AccordionPrimitive.Content className={contentStyles}>
        {children}
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  )
}

// === AccordionItem (direct re-export of Radix Item) ===

export const AccordionItem = AccordionPrimitive.Item

export default Accordion
