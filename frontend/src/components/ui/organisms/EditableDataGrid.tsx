import { useState } from 'react';
import { DataTable, type DataTableRowEditCompleteEvent } from 'primereact/datatable';
import { Column, type ColumnEditorOptions } from 'primereact/column';
import { InputText } from '../atoms/InputText';
import { Dropdown } from '../molecules/Dropdown';
import { CurrencyInput } from '../molecules/CurrencyInput';
import { Skeleton } from '../atoms/Skeleton';
import { cn } from '@/lib/utils';

export interface GridColumn {
    field: string;
    header: string;
    type?: 'text' | 'number' | 'currency' | 'select' | 'boolean';
    options?: any[]; // For select type
    editable?: boolean;
}

export interface EditableDataGridProps {
    data: any[];
    columns: GridColumn[];
    onRowEditSave?: (newData: any, index: number) => void;
    className?: string;
    loading?: boolean;
}

export const EditableDataGrid = ({ data: initialData, columns, onRowEditSave, className, loading = false }: EditableDataGridProps) => {
    const [data, setData] = useState([...initialData]);

    const onRowEditComplete = (e: DataTableRowEditCompleteEvent) => {
        const _data = [...data];
        const { newData, index } = e;
        _data[index] = newData;
        setData(_data);
        onRowEditSave?.(newData, index);
    };

    const getEditor = (col: GridColumn, options: ColumnEditorOptions) => {
        const value = options.value;
        const onChange = (val: any) => options.editorCallback?.(val);

        switch (col.type) {
            case 'number':
                return (
                    <InputText
                        type="number"
                        value={value}
                        onChange={(e: any) => onChange(Number(e.target.value))}
                        className="w-full h-8 px-[var(--spacing-sm)] py-[var(--spacing-xs)] text-sm bg-[var(--background)]"
                        autoFocus
                    />
                );
            case 'currency':
                return (
                    <CurrencyInput
                        value={value}
                        onChange={(val) => onChange(val)}
                        className="w-full h-8 px-[var(--spacing-sm)] py-[var(--spacing-xs)] text-sm bg-[var(--background)]"
                    />
                );
            case 'select':
                return (
                    <Dropdown
                        value={value}
                        options={col.options || []}
                        onChange={(e) => onChange(e.value)}
                        className="w-full h-8 shadow-none border border-[var(--border)] items-center"
                    />
                );
            case 'text':
            default:
                return (
                    <InputText
                        type="text"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full h-8 px-[var(--spacing-sm)] py-[var(--spacing-xs)] text-sm bg-[var(--background)]"
                        autoFocus
                    />
                );
        }
    };

    return (
        <div className={cn("w-full bg-[var(--background)] border border-[var(--border)] rounded-[var(--radius)] shadow-sm overflow-hidden", className)}>
            {loading ? (
                <div className="w-full">
                    {/* Skeleton Header */}
                    <div className="flex bg-[var(--secondary)] border-b border-[var(--border)]">
                        {columns.map((col) => (
                            <div key={col.field} className="flex-1 px-[var(--spacing-md)] py-[var(--spacing-md)]">
                                <Skeleton width="50%" height="0.75rem" />
                            </div>
                        ))}
                        <div className="w-[10%] px-[var(--spacing-md)] py-[var(--spacing-md)] flex justify-center">
                            <Skeleton width="1rem" height="0.75rem" />
                        </div>
                    </div>
                    {/* 5 Skeleton Rows */}
                    {Array.from({ length: 5 }).map((_, rowIdx) => (
                        <div
                            key={rowIdx}
                            className="flex border-b border-[var(--border)] last:border-0"
                        >
                            {columns.map((col) => (
                                <div key={col.field} className="flex-1 px-[var(--spacing-md)] py-[var(--spacing-md)]">
                                    <Skeleton
                                        width={col.type === 'currency' ? '55%' : col.type === 'select' ? '70%' : '80%'}
                                        height="0.875rem"
                                    />
                                </div>
                            ))}
                            <div className="w-[10%] px-[var(--spacing-md)] py-[var(--spacing-md)] flex justify-center gap-[var(--spacing-sm)]">
                                <Skeleton width="1.25rem" height="1.25rem" variant="rounded" />
                                <Skeleton width="1.25rem" height="1.25rem" variant="rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <DataTable
                value={data}
                editMode="row"
                dataKey="id"
                onRowEditComplete={onRowEditComplete}
                size="small"
                stripedRows
                pt={{
                    table: { className: "w-full text-left text-sm" },
                    thead: { className: "bg-[var(--secondary)] border-b border-[var(--border)]" },
                    headerRow: { className: "text-xs font-bold text-[var(--foreground)] uppercase tracking-wider" },
                    bodyRow: { className: "border-b border-[var(--border)] last:border-0 hover:bg-[var(--secondary)]/50 transition-colors" },
                    column: {
                        headerCell: { className: "p-[var(--spacing-md)] py-[var(--spacing-md)] font-semibold" },
                        bodyCell: { className: "p-[var(--spacing-md)]" }
                    },
                    rowEditorSaveButton: { className: "text-[var(--success)] hover:bg-[var(--success)]/10 p-[var(--spacing-sm)] rounded transition-colors mr-[var(--spacing-sm)]" },
                    rowEditorCancelButton: { className: "text-[var(--destructive)] hover:bg-[var(--destructive)]/10 p-[var(--spacing-sm)] rounded transition-colors" },
                    rowEditorInitButton: { className: "text-[var(--primary)] hover:bg-[var(--primary)]/10 p-[var(--spacing-sm)] rounded transition-colors" },
                } as any}
            >
                {columns.map((col) => (
                    <Column
                        key={col.field}
                        field={col.field}
                        header={col.header}
                        editor={col.editable ? (options) => getEditor(col, options) : undefined}
                        body={(rowData) => {
                            if (col.type === 'currency') return `$${rowData[col.field]?.toLocaleString()}`;
                            if (col.type === 'select') {
                                const opt = col.options?.find(o => o.value === rowData[col.field] || o === rowData[col.field]);
                                return opt?.label || opt || rowData[col.field];
                            }
                            return rowData[col.field];
                        }}
                    />
                ))}
                {/* Actions Column (Edit/Save/Cancel) */}
                <Column
                    rowEditor
                    headerStyle={{ width: '10%' }}
                    bodyStyle={{ textAlign: 'center' }}
                    pt={{
                        rowEditorInitIcon: { className: "w-4 h-4" },
                        rowEditorSaveIcon: { className: "w-4 h-4" },
                        rowEditorCancelIcon: { className: "w-4 h-4" }
                    }}
                />
            </DataTable>
            )}
        </div>
    );
};
