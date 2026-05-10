import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Checkbox } from '../atoms/Checkbox';

export interface PermissionModule {
    id: string;
    name: string;
    description?: string;
}

export interface PermissionAction {
    id: string;
    label: string;
    tooltip?: string;
}

export type PermissionState = Record<string, string[]>; // { [moduleId]: ['actionId1', 'actionId2'] }

export interface PermissionsMatrixProps {
    modules: PermissionModule[];
    actions: PermissionAction[];
    value?: PermissionState;
    onChange?: (state: PermissionState) => void;
    disabled?: boolean;
    className?: string;
    loading?: boolean;
}

export const PermissionsMatrix = ({
    modules,
    actions,
    value = {},
    onChange,
    disabled = false,
    className,
    loading = false
}: PermissionsMatrixProps) => {

    const [localState, setLocalState] = useState<PermissionState>(value);

    // Sync with controlled value if provided
    React.useEffect(() => {
        if (value !== localState && onChange) {
            setLocalState(value);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const updateState = useCallback((newState: PermissionState) => {
        setLocalState(newState);
        onChange?.(newState);
    }, [onChange]);

    // Handler for individual checkbox
    const togglePermission = (moduleId: string, actionId: string, checked: boolean) => {
        if (disabled) return;
        const currentActions = localState[moduleId] || [];
        const newActions = checked
            ? [...currentActions, actionId]
            : currentActions.filter(id => id !== actionId);

        updateState({ ...localState, [moduleId]: newActions });
    };

    // Handler for "Select All Row"
    const toggleRow = (moduleId: string, checked: boolean) => {
        if (disabled) return;
        updateState({
            ...localState,
            [moduleId]: checked ? actions.map(a => a.id) : []
        });
    };

    const isRowChecked = (moduleId: string) => {
        return (localState[moduleId] || []).length === actions.length && actions.length > 0;
    };

    // Render Module Name Column
    const moduleBodyTemplate = (rowData: PermissionModule) => {
        return (
            <div className="flex flex-col gap-[var(--spacing-xxs)]">
                <span className="font-semibold text-sm text-[var(--foreground)]">{rowData.name}</span>
                {rowData.description && <span className="text-xs text-[var(--foreground-muted)]">{rowData.description}</span>}
            </div>
        );
    };

    // Render "Select All Row" Column
    const selectAllBodyTemplate = (rowData: PermissionModule) => {
        // Determine Checkbox state since custom indeterminate mapping might be tricky just with PrimeReact's native, 
        // we use our custom Checkbox wrapper
        return (
            <div className="flex items-center justify-center p-[var(--spacing-sm)]">
                <Checkbox
                    checked={isRowChecked(rowData.id)}
                    disabled={disabled}
                    onChange={(checked) => toggleRow(rowData.id, checked || false)}
                // If we wanted indeterminate visual we'd need to style it via Tailwind, 
                // but `checked` true/false + data state is usually enough.
                />
            </div>
        );
    };

    // Render skeleton rows when loading
    const skeletonRows = Array.from({ length: 5 }).map((_, i) => (
        <div
            key={`skeleton-${i}`}
            className="flex items-center border-b border-[var(--border)] last:border-0 p-[var(--spacing-md)] hover:bg-[var(--secondary)]/50 transition-colors"
        >
            <div className="flex-1 md:w-1/3 p-[var(--spacing-md)]">
                <div className="h-4 w-3/4 bg-[var(--border)] rounded animate-pulse" />
            </div>
            <div className="flex items-center justify-center p-[var(--spacing-md)] bg-[var(--secondary)]/20">
                <div className="h-5 w-5 bg-[var(--border)] rounded animate-pulse" />
            </div>
            {actions.map((action) => (
                <div key={action.id} className="flex items-center justify-center p-[var(--spacing-md)]">
                    <div className="h-5 w-5 bg-[var(--border)] rounded animate-pulse" />
                </div>
            ))}
        </div>
    ));

    return (
        <div className={cn("w-full border border-[var(--border)] rounded-[var(--radius)] overflow-hidden bg-[var(--background)] shadow-sm", className)}>
            {loading ? (
                <div>
                    {/* Skeleton Header */}
                    <div className="flex items-center bg-[var(--secondary)] border-b border-[var(--border)] p-[var(--spacing-md)] text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
                        <div className="flex-1 md:w-1/3 p-[var(--spacing-md)]">Módulo</div>
                        <div className="text-center p-[var(--spacing-md)]">Todo</div>
                        {actions.map((action) => (
                            <div key={action.id} className="text-center p-[var(--spacing-md)]">{action.label}</div>
                        ))}
                    </div>
                    {skeletonRows}
                </div>
            ) : (
                <DataTable
                value={modules}
                dataKey="id"
                stripedRows
                size="small"
                pt={{
                    table: { className: "w-full text-left border-collapse" },
                    thead: { className: "bg-[var(--secondary)] border-b border-[var(--border)]" },
                    headerRow: { className: "text-xs font-bold text-[var(--foreground)] uppercase tracking-wider" },
                    bodyRow: { className: "border-b border-[var(--border)] last:border-0 hover:bg-[var(--secondary)]/50 transition-colors" },
                    column: {
                        headerCell: { className: "p-[var(--spacing-md)] font-semibold text-left" },
                        bodyCell: { className: "p-[var(--spacing-md)] text-sm" }
                    }
                }}
            >
                <Column
                    field="name"
                    header="Módulo"
                    body={moduleBodyTemplate}
                    pt={{ bodyCell: { className: "p-[var(--spacing-md)] md:w-1/3" } }}
                />

                <Column
                    header="Todo"
                    body={selectAllBodyTemplate}
                    align="center"
                    pt={{ headerCell: { className: "p-[var(--spacing-md)] text-center" }, bodyCell: { className: "p-[var(--spacing-md)] text-center bg-[var(--secondary)]/20" } }}
                />

                {actions.map((action) => (
                    <Column
                        key={action.id}
                        header={action.label}
                        align="center"
                        pt={{ headerCell: { className: "p-[var(--spacing-md)] text-center" }, bodyCell: { className: "p-[var(--spacing-md)] text-center" } }}
                        body={(rowData: PermissionModule) => {
                            const isChecked = (localState[rowData.id] || []).includes(action.id);
                            return (
                                <div className="flex items-center justify-center p-[var(--spacing-sm)]">
                                    <Checkbox
                                        checked={isChecked}
                                        disabled={disabled}
                                        onChange={(checked) => togglePermission(rowData.id, action.id, checked || false)}
                                    />
                                </div>
                            );
                        }}
                    />
                ))}
            </DataTable>
            )}
        </div>
    );
};
