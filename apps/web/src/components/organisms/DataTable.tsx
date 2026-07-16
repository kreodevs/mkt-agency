import { Column, type ColumnProps } from 'primereact/column';
import { DataTable as PrimeDataTable } from 'primereact/datatable';
import { InputText as PrimeInputText } from 'primereact/inputtext';
import { Search } from 'lucide-react';
import { forwardRef, useState } from 'react';
import { Checkbox } from '@/components/atoms/Checkbox';

export interface DataTableColumn extends Omit<ColumnProps, 'pt'> {
  field: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  /** Permite texto en varias líneas (anula whitespace-nowrap de la celda). */
  wrap?: boolean;
  cellType?: 'default' | 'checkbox';
  checkboxDisabled?: boolean | ((row: Record<string, unknown>) => boolean);
  onCheckboxChange?: (row: Record<string, unknown>, checked: boolean, field: string) => void;
}

export interface DataTableInputProps {
  columns: DataTableColumn[];
  data: any[];
  loading?: boolean;
  globalFilterEnabled?: boolean;
  globalFilterPlaceholder?: string;
  emptyMessage?: string;
  dense?: boolean;
  paginator?: boolean;
  rows?: number;
  rowsPerPageOptions?: number[];
}

const paginatorControlClass =
  'rounded-[var(--radius-sm)] p-1.5 text-[var(--foreground-muted)] hover:bg-[var(--muted)] disabled:opacity-50';

const paginatorPageClass =
  'min-w-[32px] rounded-[var(--radius-sm)] px-[var(--spacing-sm)] text-sm font-medium text-[var(--foreground-muted)] hover:bg-[var(--muted)] [&[data-p-highlight=true]]:bg-[var(--accent)] [&[data-p-highlight=true]]:text-[var(--accent-foreground)]';

const paginatorDropdownPanelClass =
  'overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-lg';

const ptStyles = {
  root: {
    className:
      'overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)]',
  },
  header: {
    className:
      'border-b border-[var(--border)] bg-[var(--secondary)] px-[var(--spacing-md)] py-[var(--spacing-md)]',
  },
  wrapper: { className: 'overflow-auto' },
  table: { className: 'w-full border-collapse' },
  thead: { className: 'bg-[var(--secondary)]' },
  headerRow: { className: 'border-b border-[var(--border)]' },
  headerCell: {
    className: `
      border-b border-[var(--border)] bg-[var(--secondary)] px-[var(--spacing-md)] py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]
      transition-colors [&[data-p-sortable-column=true]]:cursor-pointer
      [&[data-p-sortable-column=true]:hover]:bg-[var(--muted)] [&[data-p-sortable-column=true]:hover]:text-[var(--foreground)]
    `,
  },
  sortIcon: { className: 'ml-[var(--spacing-xs)] inline-flex text-[var(--foreground-muted)]' },
  tbody: { className: 'divide-y divide-[var(--border)]' },
  bodyRow: {
    className:
      'transition-colors hover:bg-[var(--secondary)] [&[data-p-highlight=true]]:bg-[var(--accent)]/10',
  },
  bodyCell: {
    className:
      'whitespace-nowrap px-[var(--spacing-md)] py-[var(--spacing-sm)] text-sm text-[var(--foreground)]',
  },
  footer: {
    className:
      'border-t border-[var(--border)] bg-[var(--secondary)] px-[var(--spacing-md)] py-[var(--spacing-md)]',
  },
  emptyMessageCell: {
    className: 'p-[var(--spacing-xl)] text-center text-[var(--foreground-muted)]',
  },
  paginator: {
    root: {
      className:
        'flex items-center justify-between border-t border-[var(--border)] bg-[var(--secondary)] px-[var(--spacing-md)] py-[var(--spacing-md)]',
    },
    firstPageIcon: { className: paginatorControlClass },
    prevPageIcon: { className: paginatorControlClass },
    nextPageIcon: { className: paginatorControlClass },
    lastPageIcon: { className: paginatorControlClass },
    pages: { className: 'flex items-center gap-[var(--spacing-xs)]' },
    pageButton: { className: paginatorPageClass },
    current: { className: 'text-sm text-[var(--foreground-muted)]' },
    RPPDropdown: {
      root: {
        className:
          'h-control-sm min-h-control-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--input)] text-sm text-[var(--foreground)]',
      },
      panel: {
        className: paginatorDropdownPanelClass,
      },
      wrapper: {
        className: 'max-h-56 overflow-auto bg-[var(--card)]',
      },
      list: {
        className: 'bg-[var(--card)] py-1',
      },
      item: {
        className:
          'cursor-pointer px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--secondary)] [&[data-p-highlight=true]]:bg-[var(--accent)]/10 [&[data-p-highlight=true]]:font-medium',
      },
    },
  },
  filterInput: {
    className:
      'h-control-sm min-h-control-sm w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--input)] px-[var(--spacing-sm)] text-sm text-[var(--foreground)]',
  },
};

function getNestedValue(row: Record<string, unknown>, field: string): unknown {
  return field.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, row);
}

function buildCheckboxBody(col: DataTableColumn) {
  return (rowData: Record<string, unknown>) => {
    const checked = Boolean(getNestedValue(rowData, col.field));
    const isDisabled =
      typeof col.checkboxDisabled === 'function'
        ? col.checkboxDisabled(rowData)
        : (col.checkboxDisabled ?? false);

    return (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={checked}
          disabled={isDisabled}
          onChange={(nextChecked) => col.onCheckboxChange?.(rowData, nextChecked, col.field)}
          aria-label={col.header}
        />
      </div>
    );
  };
}

export const DataTable = forwardRef<HTMLDivElement, DataTableInputProps>(
  (
    {
      columns,
      data,
      loading = false,
      globalFilterEnabled = true,
      globalFilterPlaceholder = 'Buscar en todos los campos...',
      emptyMessage = 'No se encontraron registros',
      dense = true,
      paginator = true,
      rows = 10,
      rowsPerPageOptions = [5, 10, 25, 50],
    },
    ref,
  ) => {
    const [globalFilter, setGlobalFilter] = useState('');
    const headerCell = dense
      ? { className: `${ptStyles.headerCell.className} px-[var(--spacing-sm)] py-1.5 text-[10px]` }
      : ptStyles.headerCell;
    const bodyCell = dense
      ? { className: `${ptStyles.bodyCell.className} px-[var(--spacing-sm)] py-1.5 text-xs` }
      : ptStyles.bodyCell;

    const renderHeader = () => {
      if (!globalFilterEnabled) return null;

      return (
        <div className="flex items-center justify-between gap-[var(--spacing-md)]">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
            <PrimeInputText
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder={globalFilterPlaceholder}
              className="h-9 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input)] pl-9 pr-[var(--spacing-md)] text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
          <div className="text-xs text-[var(--foreground-muted)]">{data.length} registros</div>
        </div>
      );
    };

    return (
      <div ref={ref}>
        <PrimeDataTable
          value={data}
          loading={loading}
          globalFilter={globalFilter}
          header={renderHeader()}
          emptyMessage={emptyMessage}
          paginator={paginator}
          rows={rows}
          rowsPerPageOptions={rowsPerPageOptions}
          paginatorDropdownAppendTo={typeof document !== 'undefined' ? document.body : undefined}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords}"
          sortMode="multiple"
          removableSort
          pt={{
            ...ptStyles,
            headerCell,
            bodyCell,
            paginator: ptStyles.paginator,
          } as any}
        >
          {columns.map((col) => {
            const isCheckbox = col.cellType === 'checkbox';
            const columnBodyCell = col.wrap
              ? {
                  className: `${bodyCell.className} whitespace-normal align-top`.replace(
                    'whitespace-nowrap',
                    '',
                  ),
                }
              : bodyCell;
            return (
              <Column
                key={col.field}
                field={col.field}
                header={col.header}
                body={isCheckbox ? buildCheckboxBody(col) : col.body}
                sortable={!isCheckbox && col.sortable}
                filter={!isCheckbox && col.filterable}
                filterPlaceholder={
                  isCheckbox ? undefined : `Filtrar ${col.header.toLowerCase()}...`
                }
                style={
                  col.width
                    ? { width: col.width, minWidth: col.width, maxWidth: col.width }
                    : undefined
                }
                pt={{
                  headerCell,
                  bodyCell: columnBodyCell,
                  filterInput: ptStyles.filterInput,
                }}
              />
            );
          })}
        </PrimeDataTable>
      </div>
    );
  },
);

DataTable.displayName = 'DataTable';
export { Column };
export default DataTable;
