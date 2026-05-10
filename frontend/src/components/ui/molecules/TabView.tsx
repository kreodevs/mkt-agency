import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs'
import { forwardRef, ReactNode, useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

export interface TabItemProps {
  value: string
  label: string
  icon?: ReactNode
  badge?: string | number
  disabled?: boolean
  children: ReactNode
}

export interface TabViewInputProps {
  tabs?: TabItemProps[]
  variant?: 'default' | 'bordered' | 'pills' | 'underline'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  children?: ReactNode
  /** Controlled active tab index (0-based) — maps to Radix value internally */
  activeIndex?: number
  /** Default tab value for uncontrolled usage */
  defaultValue?: string
  /** Called when the active tab changes — receives the tab's string value */
  onTabChange?: (value: string) => void
  className?: string
}

const sizeStyles = {
  sm: { tab: 'px-[var(--spacing-md)] py-1.5 text-xs', icon: 'w-3 h-3', badge: 'text-[10px] px-1.5 py-[var(--spacing-xxs)]' },
  md: { tab: 'px-[var(--spacing-md)] py-[var(--spacing-sm)] text-sm', icon: 'w-4 h-4', badge: 'text-xs px-[var(--spacing-sm)] py-[var(--spacing-xxs)]' },
  lg: { tab: 'px-[var(--spacing-lg)] py-2.5 text-base', icon: 'w-5 h-5', badge: 'text-xs px-[var(--spacing-sm)] py-[var(--spacing-xs)]' },
}

const variantStyles = {
  default: {
    nav: 'flex border-b border-[var(--border)] bg-[var(--secondary)]',
    tab: `
      relative font-medium
      text-[var(--foreground-muted)]
      hover:text-[var(--foreground)] hover:bg-[var(--muted)]
      transition-colors
      data-[state=active]:text-[var(--accent)]
      data-[state=active]:after:absolute
      data-[state=active]:after:bottom-0
      data-[state=active]:after:left-0
      data-[state=active]:after:right-0
      data-[state=active]:after:h-0.5
      data-[state=active]:after:bg-[var(--accent)]
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    content: 'p-[var(--spacing-md)] bg-[var(--card)]',
  },
  bordered: {
    nav: 'flex border border-[var(--border)] rounded-t-[var(--radius)] bg-[var(--secondary)] overflow-hidden',
    tab: `
      font-medium border-r border-[var(--border)] last:border-r-0
      text-[var(--foreground-muted)]
      hover:text-[var(--foreground)] hover:bg-[var(--muted)]
      transition-colors
      data-[state=active]:text-[var(--accent)]
      data-[state=active]:bg-[var(--card)]
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    content: 'p-[var(--spacing-md)] border border-t-0 border-[var(--border)] rounded-b-[var(--radius)] bg-[var(--card)]',
  },
  pills: {
    nav: 'flex gap-[var(--spacing-sm)] p-[var(--spacing-xs)] rounded-[var(--radius)] bg-[var(--secondary)]',
    tab: `
      font-medium rounded-[var(--radius-sm)]
      text-[var(--foreground-muted)]
      hover:text-[var(--foreground)]
      transition-colors
      data-[state=active]:text-[var(--primary-foreground)]
      data-[state=active]:bg-[var(--primary)]
      data-[state=active]:shadow-sm
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    content: 'p-[var(--spacing-md)] mt-[var(--spacing-sm)]',
  },
  underline: {
    nav: 'flex gap-[var(--spacing-md)]',
    tab: `
      relative font-medium pb-[var(--spacing-sm)]
      text-[var(--foreground-muted)]
      hover:text-[var(--foreground)]
      transition-colors
      data-[state=active]:text-[var(--accent)]
      data-[state=active]:after:absolute
      data-[state=active]:after:bottom-0
      data-[state=active]:after:left-0
      data-[state=active]:after:right-0
      data-[state=active]:after:h-0.5
      data-[state=active]:after:bg-[var(--accent)]
      data-[state=active]:after:rounded-full
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    content: 'p-[var(--spacing-md)] border-t border-[var(--border)]',
  },
}

export const TabView = forwardRef<HTMLDivElement, TabViewInputProps>(
  ({ tabs, variant = 'default', size = 'md', fullWidth = false, children, activeIndex, defaultValue, onTabChange, className, ...props }, ref) => {
    const styles = variantStyles[variant]
    const sizes = sizeStyles[size]
    const fullWidthStyles = fullWidth ? 'flex-1 justify-center' : ''

    // Derive the string value from activeIndex (controlled) or fallback
    const controlledValue =
      activeIndex !== undefined && tabs && tabs[activeIndex] ? tabs[activeIndex].value : undefined

    const fallbackDefault = tabs?.[0]?.value ?? 'tab-0'
    const [internalValue, setInternalValue] = useState<string>(defaultValue ?? fallbackDefault)

    // Sync external activeIndex changes into internal state
    useEffect(() => {
      if (controlledValue !== undefined) {
        setInternalValue(controlledValue)
      }
    }, [controlledValue])

    const handleValueChange = useCallback(
      (value: string) => {
        setInternalValue(value)
        onTabChange?.(value)
      },
      [onTabChange]
    )

    // Current value for Radix: controlled if activeIndex is given, otherwise internal
    const radixValue = controlledValue !== undefined ? controlledValue : internalValue

    const renderTabHeader = (item: TabItemProps) => (
      <div className="flex items-center gap-[var(--spacing-sm)]">
        {item.icon && <span className={sizes.icon}>{item.icon}</span>}
        <span>{item.label}</span>
        {item.badge !== undefined && (
          <span
            className={cn(
              sizes.badge,
              'rounded-full font-medium bg-[var(--accent)] text-[var(--accent-foreground)]'
            )}
          >
            {item.badge}
          </span>
        )}
      </div>
    )

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        <Tabs value={radixValue} onValueChange={handleValueChange}>
          <TabsList className={styles.nav}>
            {tabs?.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                disabled={tab.disabled}
                className={cn(
                  styles.tab,
                  sizes.tab,
                  fullWidthStyles,
                  'flex items-center gap-[var(--spacing-sm)] outline-none'
                )}
              >
                {renderTabHeader(tab)}
              </TabsTrigger>
            ))}
            {!tabs &&
              // If children are provided directly, render them as triggers
              // Children should be elements shaped like TabItemProps
              children}
          </TabsList>

          {tabs?.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className={cn(styles.content, 'outline-none')}>
              {tab.children}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    )
  }
)

TabView.displayName = 'TabView'

export default TabView
