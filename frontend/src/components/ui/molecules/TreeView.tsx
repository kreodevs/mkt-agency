import {
    forwardRef,
    useState,
    useCallback,
    useEffect,
    useRef,
    type ReactNode,
} from 'react'
import { ChevronRight, Folder, File } from 'lucide-react'
import { cn } from '@/lib/utils'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface TreeNodeData {
    key: string
    label: string
    icon?: ReactNode
    children?: TreeNodeData[]
    disabled?: boolean
    className?: string
}

export interface TreeViewProps {
    nodes: TreeNodeData[]
    /** Array of selected node keys */
    value?: string[]
    /** Called when selection changes — receives the full updated array of keys */
    onSelectionChange?: (selectedKeys: string[]) => void
    className?: string
    selectionMode?: 'checkbox' | 'single' | 'none'
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function collectAllKeys(nodes: TreeNodeData[]): string[] {
    const keys: string[] = []
    for (const node of nodes) {
        keys.push(node.key)
        if (node.children?.length) {
            keys.push(...collectAllKeys(node.children))
        }
    }
    return keys
}

/** Collects the target key PLUS all descendant keys */
function collectDescendantKeys(node: TreeNodeData): string[] {
    const keys: string[] = [node.key]
    if (node.children?.length) {
        for (const child of node.children) {
            keys.push(...collectDescendantKeys(child))
        }
    }
    return keys
}

/** Deep-find a node by key */
function findNode(nodes: TreeNodeData[], key: string): TreeNodeData | null {
    for (const n of nodes) {
        if (n.key === key) return n
        if (n.children?.length) {
            const found = findNode(n.children, key)
            if (found) return found
        }
    }
    return null
}

/** Check whether ANY descendant of `node` (not including itself) is selected */
function hasAnyDescendantSelected(
    node: TreeNodeData,
    selected: Set<string>,
): boolean {
    if (!node.children?.length) return false
    for (const child of node.children) {
        if (selected.has(child.key)) return true
        if (hasAnyDescendantSelected(child, selected)) return true
    }
    return false
}

/** Check whether ALL descendants of `node` (not including itself) are selected */
function hasAllDescendantsSelected(
    node: TreeNodeData,
    selected: Set<string>,
): boolean {
    if (!node.children?.length) return true // vacuously true for leaves
    for (const child of node.children) {
        if (!selected.has(child.key)) return false
        if (!hasAllDescendantsSelected(child, selected)) return false
    }
    return true
}

// ──────────────────────────────────────────────
// Recursive TreeNode
// ──────────────────────────────────────────────

interface TreeNodeInnerProps {
    node: TreeNodeData
    depth: number
    expandedKeys: Set<string>
    selectedKeys: Set<string>
    onToggle: (key: string) => void
    onSelect: (key: string, checked: boolean) => void
    selectionMode: TreeViewProps['selectionMode']
}

const TreeNodeInner = ({
    node,
    depth,
    expandedKeys,
    selectedKeys,
    onToggle,
    onSelect,
    selectionMode,
}: TreeNodeInnerProps) => {
    const hasChildren = !!(node.children?.length)
    const isExpanded = expandedKeys.has(node.key)
    const isSelected = selectedKeys.has(node.key)

    // Checkbox tri-state for parents
    const allDescChecked =
        hasChildren && hasAllDescendantsSelected(node, selectedKeys)
    const someDescChecked =
        hasChildren && hasAnyDescendantSelected(node, selectedKeys)

    const checkboxRef = useRef<HTMLInputElement>(null)
    useEffect(() => {
        if (!checkboxRef.current) return
        // Indeterminate when some but NOT all descendants are selected AND parent itself isn't selected
        checkboxRef.current.indeterminate =
            hasChildren && someDescChecked && !allDescChecked
    }, [hasChildren, someDescChecked, allDescChecked])

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        onToggle(node.key)
    }

    const handleCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation()
        onSelect(node.key, e.target.checked)
    }

    const handleClick = () => {
        if (selectionMode === 'single') {
            onSelect(node.key, !isSelected)
        }
    }

    // Determine icon: use provided icon, or default Folder/File
    const icon = node.icon ?? (hasChildren
        ? <Folder className="w-4 h-4" />
        : <File className="w-4 h-4" />
    )

    return (
        <li className="p-0 m-0 list-none">
            <div
                className={cn(
                    'flex items-center p-[var(--spacing-sm)] rounded-[var(--radius)] cursor-pointer hover:bg-[var(--secondary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
                    isSelected &&
                        selectionMode === 'single' &&
                        'bg-[var(--primary)]/10 text-[var(--primary)] font-medium',
                    node.disabled && 'opacity-50 pointer-events-none',
                    node.className,
                )}
                onClick={handleClick}
                role="treeitem"
                aria-expanded={hasChildren ? isExpanded : undefined}
                aria-selected={selectionMode === 'single' ? isSelected : undefined}
            >
                {/* ── Toggle chevron ── */}
                {hasChildren ? (
                    <button
                        onClick={handleToggle}
                        tabIndex={-1}
                        className="w-6 h-6 flex items-center justify-center mr-[var(--spacing-xs)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] rounded hover:bg-[var(--secondary)] transition-colors shrink-0"
                    >
                        <ChevronRight
                            className={cn(
                                'w-4 h-4 transition-transform duration-[var(--transition-base)]',
                                isExpanded && 'rotate-90',
                            )}
                        />
                    </button>
                ) : (
                    <span className="w-6 h-6 mr-[var(--spacing-xs)] shrink-0" />
                )}

                {/* ── Checkbox ── */}
                {selectionMode === 'checkbox' && (
                    <input
                        ref={checkboxRef}
                        type="checkbox"
                        checked={isSelected || allDescChecked}
                        onChange={handleCheck}
                        onClick={(e) => e.stopPropagation()}
                        className="mr-[var(--spacing-sm)] accent-[var(--primary)] shrink-0 cursor-pointer"
                    />
                )}

                {/* ── Icon ── */}
                <span className="w-4 h-4 mr-[var(--spacing-sm)] text-[var(--accent)] shrink-0 flex items-center justify-center">
                    {icon}
                </span>

                {/* ── Label ── */}
                <span className="text-sm text-[var(--foreground)] select-none">
                    {node.label}
                </span>
            </div>

            {/* ── Children (recursive) ── */}
            {hasChildren && isExpanded && (
                <ul
                    className="m-0 list-none pl-[var(--spacing-lg)] border-l border-[var(--border)]/50 ml-[var(--spacing-md)]"
                    role="group"
                >
                    {node.children!.map((child) => (
                        <TreeNodeInner
                            key={child.key}
                            node={child}
                            depth={depth + 1}
                            expandedKeys={expandedKeys}
                            selectedKeys={selectedKeys}
                            onToggle={onToggle}
                            onSelect={onSelect}
                            selectionMode={selectionMode}
                        />
                    ))}
                </ul>
            )}
        </li>
    )
}

// ──────────────────────────────────────────────
// TreeView (public)
// ──────────────────────────────────────────────

export const TreeView = forwardRef<HTMLDivElement, TreeViewProps>(
    (
        {
            nodes,
            value = [],
            onSelectionChange,
            className,
            selectionMode = 'checkbox',
        },
        ref,
    ) => {
        // All nodes expanded by default
        const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
            () => new Set(collectAllKeys(nodes)),
        )

        // Sync expansion when nodes change (e.g. storybook controls)
        useEffect(() => {
            setExpandedKeys(new Set(collectAllKeys(nodes)))
        }, [nodes])

        const selectedKeys = new Set(value)

        const handleToggle = useCallback((key: string) => {
            setExpandedKeys((prev) => {
                const next = new Set(prev)
                if (next.has(key)) next.delete(key)
                else next.add(key)
                return next
            })
        }, [])

        const handleSelect = useCallback(
            (key: string, checked: boolean) => {
                if (selectionMode === 'single') {
                    onSelectionChange?.(checked ? [key] : [])
                    return
                }

                const node = findNode(nodes, key)
                if (!node) return

                const affected = new Set(collectDescendantKeys(node))
                const next = new Set(value)

                if (checked) {
                    for (const k of affected) next.add(k)
                } else {
                    for (const k of affected) next.delete(k)
                }

                onSelectionChange?.(Array.from(next))
            },
            [nodes, value, onSelectionChange, selectionMode],
        )

        return (
            <div
                ref={ref}
                className={cn(
                    'bg-[var(--background)] p-[var(--spacing-md)] rounded-[var(--radius)] border border-[var(--border)] text-[var(--foreground)] shadow-sm overflow-hidden',
                    className,
                )}
                role="tree"
            >
                <ul className="p-0 m-0 list-none overflow-auto">
                    {nodes.map((node) => (
                        <TreeNodeInner
                            key={node.key}
                            node={node}
                            depth={0}
                            expandedKeys={expandedKeys}
                            selectedKeys={selectedKeys}
                            onToggle={handleToggle}
                            onSelect={handleSelect}
                            selectionMode={selectionMode}
                        />
                    ))}
                </ul>
            </div>
        )
    },
)
TreeView.displayName = 'TreeView'
