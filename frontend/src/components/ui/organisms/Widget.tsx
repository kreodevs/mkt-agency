import React from 'react';
import { Card } from '../molecules/Card';
import { Move, MoreHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface WidgetProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    category?: string;
    icon?: React.ElementType;
    onMoreClick?: () => void;
    showHandle?: boolean;
    children: React.ReactNode;
}

/**
 * Widget - Un contenedor premium diseñado para ser utilizado dentro de un ModularGrid.
 * Proporciona un header consistente con drag-handle, iconografía y slot de contenido.
 */
export const Widget = React.forwardRef<HTMLDivElement, WidgetProps>(
    ({ title, category, icon: Icon, onMoreClick, showHandle = true, children, className, ...props }, ref) => {
        return (
            <Card
                ref={ref}
                className={cn(
                    "w-full h-full flex flex-col bg-[var(--card)] border-[var(--border)] overflow-hidden group select-none shadow-sm hover:shadow-md transition-shadow rounded-[2rem] p-0",
                    className
                )}
                {...props}
            >
                <div className="flex items-center justify-between p-[var(--spacing-md)] shrink-0 border-b border-[var(--border)] bg-[var(--secondary)]/10">
                    <div className="flex items-center gap-[var(--spacing-md)]">
                        {showHandle && (
                            <div className="drag-handle cursor-grab active:cursor-grabbing p-1.5 hover:bg-[var(--secondary)] rounded-lg transition-colors bg-[var(--background)] border border-[var(--border)]">
                                <Move className="w-4 h-4 text-[var(--foreground-muted)]" />
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-1.5">
                                {Icon && <Icon className="w-3 h-3 text-[var(--primary)]" />}
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)]">
                                    {category || 'Analytics'}
                                </span>
                            </div>
                            <h3 className="text-sm font-bold text-[var(--foreground)] leading-none mt-[var(--spacing-xs)]">{title}</h3>
                        </div>
                    </div>
                    {onMoreClick && (
                        <button
                            onClick={onMoreClick}
                            className="p-1.5 hover:bg-[var(--secondary)] rounded-md transition-colors text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <div className="flex-1 overflow-auto p-[var(--spacing-lg)]">
                    {children}
                </div>
            </Card>
        );
    }
);

Widget.displayName = 'Widget';
