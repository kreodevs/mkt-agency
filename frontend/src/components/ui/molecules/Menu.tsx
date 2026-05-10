import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import * as MenubarPrimitive from '@radix-ui/react-menubar'
import { ChevronRight, Menu as MenuIcon } from 'lucide-react'
import { forwardRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

// ===== Types =====

export interface MenuItem {
  /** Display label for the menu item. */
  label?: string
  /** Icon element or component (e.g. Lucide icon). Supports both JSX elements and component classes. */
  icon?: ReactNode | React.ComponentType<{ className?: string }>
  /** Whether the item is disabled. */
  disabled?: boolean
  /** If true, renders a separator/divider instead of a clickable item. */
  separator?: boolean
  /** Nested submenu items. When present, the item renders as a submenu trigger. */
  items?: MenuItem[]
  /** Callback when the item is selected/clicked. */
  command?: () => void
  /** Badge text to display on the item. */
  badge?: string
  /** Keyboard shortcut hint text. */
  shortcut?: string
  /** Additional class name for the item element. */
  className?: string
  /** Custom render function that overrides default item rendering. */
  render?: () => ReactNode
}

export interface MenuProps {
  /** Array of menu items (supports nesting for submenus). */
  items: MenuItem[]
  /**
   * If true, renders as a horizontal top menubar (uses @radix-ui/react-menubar).
   * If false/undefined, renders as a dropdown menu (uses @radix-ui/react-dropdown-menu).
   * @default false
   */
  menubar?: boolean
  /** Trigger element for dropdown mode. Required when menubar=false. */
  trigger?: ReactNode
  /** Logo/brand element displayed on the left side in menubar mode. */
  logo?: ReactNode
  /** Content rendered on the right side in menubar mode (e.g. actions, profile). */
  end?: ReactNode
  /** Additional class name for the content/root wrapper. */
  className?: string
  /** Controlled open state for dropdown mode. */
  open?: boolean
  /** Callback when open state changes. */
  onOpenChange?: (open: boolean) => void
}

export interface NavbarProps extends Omit<MenuProps, 'menubar' | 'trigger'> {
  /** @deprecated Use `logo` instead. */
  start?: ReactNode
}

// ===== Style Constants =====

const contentStyles = cn(
  'min-w-[180px] py-[var(--spacing-xs)]',
  'rounded-[var(--radius)]',
  'border border-[var(--border)]',
  'bg-[var(--popover)]',
  'shadow-lg z-[var(--z-dropdown)]',
)

const itemStyles = cn(
  'relative flex items-center gap-[var(--spacing-sm)]',
  'px-[var(--spacing-md)] py-[var(--spacing-sm)]',
  'text-sm text-[var(--foreground)]',
  'cursor-pointer select-none outline-none',
  'transition-colors',
  'data-[disabled]:opacity-50 data-[disabled]:pointer-events-none',
  'data-[highlighted]:bg-[var(--secondary)]',
)

const submenuTriggerStyles = cn(
  'relative flex items-center justify-between gap-[var(--spacing-sm)]',
  'px-[var(--spacing-md)] py-[var(--spacing-sm)]',
  'text-sm text-[var(--foreground)]',
  'cursor-pointer select-none outline-none',
  'transition-colors',
  'data-[disabled]:opacity-50 data-[disabled]:pointer-events-none',
  'data-[state=open]:bg-[var(--secondary)]',
  'data-[highlighted]:bg-[var(--secondary)]',
)

const menubarTriggerStyles = cn(
  'flex items-center gap-[var(--spacing-sm)]',
  'px-[var(--spacing-md)] py-[var(--spacing-sm)]',
  'text-sm font-medium text-[var(--foreground-muted)]',
  'rounded-[var(--radius)]',
  'cursor-pointer select-none outline-none',
  'transition-colors',
  'hover:text-[var(--foreground)] hover:bg-[var(--secondary)]',
  'data-[state=open]:text-[var(--foreground)] data-[state=open]:bg-[var(--secondary)]',
  'data-[disabled]:opacity-50 data-[disabled]:pointer-events-none',
)

const separatorStyles = 'my-[var(--spacing-xs)] mx-[var(--spacing-sm)] h-px bg-[var(--border)]'

// ===== Render Helpers =====

function renderIcon(icon: ReactNode | React.ComponentType<{ className?: string }>) {
  if (typeof icon === 'function') {
    const IconComp = icon as React.ComponentType<{ className?: string }>
    return <IconComp className="w-4 h-4 text-[var(--foreground-muted)] shrink-0" />
  }
  return <span className="w-4 h-4 text-[var(--foreground-muted)] shrink-0 flex items-center">{icon}</span>
}

function Badge({ badge }: { badge?: string }) {
  if (!badge) return null
  return (
    <span className="px-[var(--spacing-sm)] py-[var(--spacing-xxs)] text-xs font-medium rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] leading-none">
      {badge}
    </span>
  )
}

function Shortcut({ shortcut }: { shortcut?: string }) {
  if (!shortcut) return null
  return <span className="ml-auto text-xs text-[var(--foreground-muted)]">{shortcut}</span>
}

// ===== Dropdown Menu Item Renderers =====

function renderDropdownItems(items: MenuItem[]): ReactNode[] {
  return items.map((item, index) => {
    if (item.separator) {
      return (
        <DropdownMenuPrimitive.Separator
          key={`sep-${index}`}
          className={separatorStyles}
        />
      )
    }

    if (item.render) {
      return (
        <DropdownMenuPrimitive.Item
          key={`custom-${index}`}
          disabled={item.disabled}
          className={cn('outline-none', item.className)}
          onSelect={(e) => {
            if (!item.command) e.preventDefault()
            else item.command()
          }}
        >
          {item.render()}
        </DropdownMenuPrimitive.Item>
      )
    }

    if (item.items?.length) {
      return (
        <DropdownMenuPrimitive.Sub key={`sub-${index}`}>
          <DropdownMenuPrimitive.SubTrigger
            className={cn(submenuTriggerStyles, item.className)}
            disabled={item.disabled}
          >
            {item.icon && renderIcon(item.icon)}
            <span className="flex-1 truncate">{item.label}</span>
            <ChevronRight className="w-3 h-3 text-[var(--foreground-muted)] shrink-0" />
          </DropdownMenuPrimitive.SubTrigger>
          <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.SubContent
              className={contentStyles}
              sideOffset={4}
              alignOffset={-4}
            >
              {renderDropdownItems(item.items)}
            </DropdownMenuPrimitive.SubContent>
          </DropdownMenuPrimitive.Portal>
        </DropdownMenuPrimitive.Sub>
      )
    }

    return (
      <DropdownMenuPrimitive.Item
        key={`item-${index}`}
        className={cn(itemStyles, item.className)}
        disabled={item.disabled}
        onSelect={() => item.command?.()}
      >
        {item.icon && renderIcon(item.icon)}
        <span className="flex-1 truncate">{item.label}</span>
        <Shortcut shortcut={item.shortcut} />
        <Badge badge={item.badge} />
      </DropdownMenuPrimitive.Item>
    )
  })
}

// ===== Menubar Item Renderers =====

function renderMenubarTriggers(items: MenuItem[]): ReactNode[] {
  return items.map((item, index) => {
    if (item.separator) {
      return (
        <MenubarPrimitive.Separator
          key={`sep-${index}`}
          className={separatorStyles}
        />
      )
    }

    if (item.items?.length) {
      return (
        <MenubarPrimitive.Menu key={`menu-${index}`}>
          <MenubarPrimitive.Trigger
            className={cn(menubarTriggerStyles, item.className)}
            disabled={item.disabled}
          >
            {item.icon && renderIcon(item.icon)}
            <span className="truncate">{item.label}</span>
          </MenubarPrimitive.Trigger>
          <MenubarPrimitive.Portal>
            <MenubarPrimitive.Content
              className={cn(contentStyles, 'mt-[var(--spacing-xs)]')}
              align="start"
              sideOffset={4}
            >
              {renderMenubarItems(item.items)}
            </MenubarPrimitive.Content>
          </MenubarPrimitive.Portal>
        </MenubarPrimitive.Menu>
      )
    }

    return (
      <MenubarPrimitive.Item
        key={`item-${index}`}
        className={cn(itemStyles, 'rounded-[var(--radius)]', item.className)}
        disabled={item.disabled}
        onSelect={() => item.command?.()}
      >
        {item.icon && renderIcon(item.icon)}
        <span className="flex-1 truncate">{item.label}</span>
        <Shortcut shortcut={item.shortcut} />
      </MenubarPrimitive.Item>
    )
  })
}

function renderMenubarItems(items: MenuItem[]): ReactNode[] {
  return items.map((item, index) => {
    if (item.separator) {
      return (
        <MenubarPrimitive.Separator
          key={`sep-${index}`}
          className={separatorStyles}
        />
      )
    }

    if (item.render) {
      return (
        <MenubarPrimitive.Item
          key={`custom-${index}`}
          disabled={item.disabled}
          className={cn('outline-none', item.className)}
          onSelect={(e) => {
            if (!item.command) e.preventDefault()
            else item.command()
          }}
        >
          {item.render()}
        </MenubarPrimitive.Item>
      )
    }

    if (item.items?.length) {
      return (
        <MenubarPrimitive.Sub key={`sub-${index}`}>
          <MenubarPrimitive.SubTrigger
            className={cn(submenuTriggerStyles, item.className)}
            disabled={item.disabled}
          >
            {item.icon && renderIcon(item.icon)}
            <span className="flex-1 truncate">{item.label}</span>
            <ChevronRight className="w-3 h-3 text-[var(--foreground-muted)] shrink-0" />
          </MenubarPrimitive.SubTrigger>
          <MenubarPrimitive.Portal>
            <MenubarPrimitive.SubContent
              className={contentStyles}
              sideOffset={4}
              alignOffset={-4}
            >
              {renderMenubarItems(item.items)}
            </MenubarPrimitive.SubContent>
          </MenubarPrimitive.Portal>
        </MenubarPrimitive.Sub>
      )
    }

    return (
      <MenubarPrimitive.Item
        key={`menubar-subitem-${index}`}
        className={cn(itemStyles, item.className)}
        disabled={item.disabled}
        onSelect={() => item.command?.()}
      >
        {item.icon && renderIcon(item.icon)}
        <span className="flex-1 truncate">{item.label}</span>
        <Shortcut shortcut={item.shortcut} />
        <Badge badge={item.badge} />
      </MenubarPrimitive.Item>
    )
  })
}

// ===== Dropdown Mode Component =====

const DropdownMenu = forwardRef<HTMLButtonElement, MenuProps>(
  ({ items, trigger, open, onOpenChange, className, ...props }, ref) => {
    if (!trigger) return null

    return (
      <DropdownMenuPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <DropdownMenuPrimitive.Trigger asChild ref={ref}>
          {trigger}
        </DropdownMenuPrimitive.Trigger>
        <DropdownMenuPrimitive.Portal>
          <DropdownMenuPrimitive.Content
            className={cn(contentStyles, className)}
            sideOffset={4}
            {...(props as any)}
          >
            {renderDropdownItems(items)}
          </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
      </DropdownMenuPrimitive.Root>
    )
  },
)
DropdownMenu.displayName = 'DropdownMenu'

// ===== Menubar Mode Component =====

const MenubarMenu = forwardRef<HTMLDivElement, MenuProps>(
  ({ items, logo, end, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-between',
          'px-[var(--spacing-md)] py-[var(--spacing-sm)]',
          'bg-[var(--card)] border-b border-[var(--border)]',
          className,
        )}
      >
        <div className="flex items-center gap-[var(--spacing-md)] min-w-0">
          {logo}
          <MenubarPrimitive.Menubar
            className="flex items-center gap-[var(--spacing-xs)] list-none p-0 m-0 bg-transparent border-none"
            {...(props as any)}
          >
            {renderMenubarTriggers(items)}
          </MenubarPrimitive.Menubar>
        </div>
        {end && (
          <div className="flex items-center gap-[var(--spacing-sm)] shrink-0">
            {end}
          </div>
        )}
      </div>
    )
  },
)
MenubarMenu.displayName = 'MenubarMenu'

// ===== Unified Menu (Public Export) =====

export const Menu = forwardRef<HTMLButtonElement | HTMLDivElement, MenuProps>(
  (props, ref) => {
    if (props.menubar) {
      return <MenubarMenu {...props} ref={ref as any} />
    }
    return <DropdownMenu {...props} ref={ref as any} />
  },
)
Menu.displayName = 'Menu'

// ===== Navbar (Backward-Compatible Alias) =====

export const Navbar = forwardRef<HTMLDivElement, NavbarProps>(
  ({ logo, end, start, ...props }, ref) => {
    return (
      <MenubarMenu
        ref={ref as any}
        logo={logo ?? start}
        end={end}
        menubar
        {...props}
      />
    )
  },
)
Navbar.displayName = 'Navbar'

// ===== Mobile Menu Button =====

export const MenuButton = ({
  onClick,
  className = '',
}: {
  onClick: () => void
  className?: string
}) => (
  <button
    onClick={onClick}
    className={cn(
      'p-[var(--spacing-sm)] rounded-[var(--radius)]',
      'text-[var(--foreground-muted)]',
      'hover:text-[var(--foreground)] hover:bg-[var(--secondary)]',
      'transition-colors',
      className,
    )}
  >
    <MenuIcon className="w-5 h-5" />
  </button>
)

export default Menu
