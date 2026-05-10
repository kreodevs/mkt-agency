import { Avatar } from '../atoms/Avatar';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import {
    Eye, Pencil, Trash2, MoreHorizontal
} from "lucide-react";
import { Menu } from '../molecules/Menu';
import type { MenuItem } from '../molecules/Menu';

/**
 * StatusCell - Renderiza un badge de estado con colores semánticos.
 */
export const StatusCell = (value: string, variant: any = 'default') => {
    return <Badge variant={variant}>{value}</Badge>;
};

/**
 * UserCell - Renderiza un avatar con nombre y correo electrónico.
 */
export const UserCell = (name: string, email?: string, avatar?: string) => {
    return (
        <div className="flex items-center gap-[var(--spacing-md)]">
            <Avatar src={avatar} name={name} size="sm" />
            <div className="flex flex-col">
                <span className="font-bold text-[var(--foreground)] leading-none mb-[var(--spacing-xs)]">{name}</span>
                {email && <span className="text-[10px] text-[var(--foreground-muted)]">{email}</span>}
            </div>
        </div>
    );
};

/**
 * ProgressCell - Renderiza una barra de progreso minimalista.
 */
export const ProgressCell = (value: number, color: string = 'var(--primary)') => {
    return (
        <div className="flex items-center gap-[var(--spacing-md)] w-full max-w-[120px]">
            <div className="flex-1 h-1.5 rounded-full bg-[var(--secondary)] overflow-hidden">
                <div
                    className="h-full transition-all duration-500"
                    style={{ width: `${value}%`, backgroundColor: color }}
                />
            </div>
            <span className="text-[10px] font-black text-[var(--foreground-subtle)] w-8">{value}%</span>
        </div>
    );
};

/**
 * ActionCell - Renderiza un menú de acciones común para filas de tabla.
 */
export const ActionCell = (options: {
    onView?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    customActions?: MenuItem[];
}) => {
    const items: MenuItem[] = [
        ...(options.onView ? [{ label: 'Ver Detalles', icon: <Eye className="w-4 h-4" />, command: options.onView }] : []),
        ...(options.onEdit ? [{ label: 'Editar', icon: <Pencil className="w-4 h-4" />, command: options.onEdit }] : []),
        ...(options.onDelete ? [{ label: 'Eliminar', icon: <Trash2 className="w-4 h-4" />, className: 'text-[var(--destructive)]', command: options.onDelete }] : []),
        ...(options.customActions || [])
    ];

    return (
        <div className="flex justify-end">
            <Menu
                items={items}
                trigger={
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--foreground-muted)]">
                        <MoreHorizontal className="w-4 h-4" />
                    </Button>
                }
            />
        </div>
    );
};

/**
 * CurrencyCell - Formatea valores monetarios con estética premium.
 */
export const CurrencyCell = (amount: number, currency: string = 'USD') => {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    });
    return <span className="font-mono font-bold text-[var(--foreground)]">{formatter.format(amount)}</span>;
};
