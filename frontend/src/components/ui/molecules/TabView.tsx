import { TabView as PrimeTabView, type TabViewProps as PrimeTabViewProps, TabPanel, type TabPanelProps } from 'primereact/tabview'
import { forwardRef, type ReactNode } from 'react'

export interface TabItemProps extends Omit<TabPanelProps, 'pt'> {
  label: string
  icon?: ReactNode
  badge?: string | number
  disabled?: boolean
  children: ReactNode
}

export interface TabViewInputProps extends Omit<PrimeTabViewProps, 'pt'> {
  tabs?: TabItemProps[]
  variant?: 'default' | 'bordered' | 'pills' | 'underline'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  children?: ReactNode
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
      [&[data-p-highlight=true]]:text-[var(--accent)]
      [&[data-p-highlight=true]]:after:absolute
      [&[data-p-highlight=true]]:after:bottom-0
      [&[data-p-highlight=true]]:after:left-0
      [&[data-p-highlight=true]]:after:right-0
      [&[data-p-highlight=true]]:after:h-0.5
      [&[data-p-highlight=true]]:after:bg-[var(--accent)]
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
      [&[data-p-highlight=true]]:text-[var(--accent)]
      [&[data-p-highlight=true]]:bg-[var(--card)]
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
      [&[data-p-highlight=true]]:text-[var(--primary-foreground)]
      [&[data-p-highlight=true]]:bg-[var(--primary)]
      [&[data-p-highlight=true]]:shadow-sm
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
      [&[data-p-highlight=true]]:text-[var(--accent)]
      [&[data-p-highlight=true]]:after:absolute
      [&[data-p-highlight=true]]:after:bottom-0
      [&[data-p-highlight=true]]:after:left-0
      [&[data-p-highlight=true]]:after:right-0
      [&[data-p-highlight=true]]:after:h-0.5
      [&[data-p-highlight=true]]:after:bg-[var(--accent)]
      [&[data-p-highlight=true]]:after:rounded-full
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    content: 'p-[var(--spacing-md)] border-t border-[var(--border)]',
  },
}

export const TabView = forwardRef<HTMLDivElement, TabViewInputProps>(
  ({ tabs, variant = 'default', size = 'md', fullWidth = false, children, ...props }, ref) => {
    const styles = variantStyles[variant]
    const sizes = sizeStyles[size]

    const fullWidthStyles = fullWidth ? 'flex-1 justify-center' : ''

    const ptStyles = {
      root: {
        className: 'w-full',
      },
      nav: {
        className: styles.nav,
      },
      tab: {
        root: {
          className: '',
        },
        header: {
          className: `${styles.tab} ${sizes.tab} ${fullWidthStyles}`.trim(),
        },
        headerAction: {
          className: 'flex items-center gap-[var(--spacing-sm)] outline-none',
        },
        headerTitle: {
          className: 'whitespace-nowrap',
        },
      },
      panelContainer: {
        className: styles.content,
      },
    }

    const renderTabHeader = (item: TabItemProps) => (
      <div className="flex items-center gap-[var(--spacing-sm)]">
        {item.icon && (
          <span className={sizes.icon}>
            {item.icon}
          </span>
        )}
        <span>{item.label}</span>
        {item.badge !== undefined && (
          <span className={`
            ${sizes.badge} rounded-full font-medium
            bg-[var(--accent)] text-[var(--accent-foreground)]
          `}>
            {item.badge}
          </span>
        )}
      </div>
    )

    if (children) {
      return (
        <div ref={ref}>
          <PrimeTabView {...props} pt={ptStyles}>
            {children}
          </PrimeTabView>
        </div>
      )
    }

    return (
      <div ref={ref}>
        <PrimeTabView {...props} pt={ptStyles}>
          {tabs?.map((tab, index) => (
            <TabPanel
              key={index}
              header={renderTabHeader(tab)}
              disabled={tab.disabled}
              pt={{
                header: { className: `${styles.tab} ${sizes.tab} ${fullWidthStyles}`.trim() },
                headerAction: { className: 'flex items-center gap-[var(--spacing-sm)] outline-none' },
                content: { className: '' },
              }}
            >
              {tab.children}
            </TabPanel>
          ))}
        </PrimeTabView>
      </div>
    )
  }
)

TabView.displayName = 'TabView'

// Export TabPanel for custom usage
export { TabPanel }

export default TabView
