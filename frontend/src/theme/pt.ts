/* =====================================================================
 * MarketingOS — PrimeReact PassThrough (unstyled mode)
 * Tokens Superhuman para componentes PrimeReact no migrados
 * =====================================================================
 * ¿Por qué existe? El modo unstyled del Provider permite que los
 * componentes Kreo inyecten estilos vía Tailwind, pero las páginas que
 * aún NO hemos migrado (Dashboard, CRM, Campaigns, etc.) usan
 * PrimeReact directamente y perderían TODO estilo.
 *
 * Este PT les da apariencia Superhuman hasta que migremos cada página.
 * Cuando una página se migre al estándar Kreo, podemos remover
 * sus entradas de PT aquí.
 *
 * Todos los valores usan CSS variables de vars.css
 * ===================================================================== */

/* ---- Helpers ---- */
/* CSS variables se resuelven en runtime via className con var() */

/* ---- Card ---- */
const card = {
  root: {
    className:
      'bg-[var(--card)] text-[var(--card-foreground)] rounded-[var(--radius-md)] border border-[var(--card-border)] shadow-sm overflow-hidden',
  },
  title: {
    className: 'text-base font-semibold text-[var(--foreground)] px-5 pt-4 pb-0 m-0',
  },
  subTitle: {
    className: 'text-sm text-[var(--foreground-muted)] px-5 pb-0 m-0',
  },
  body: { className: 'p-0' },
  content: { className: 'p-5 pt-3' },
};

/* ---- Button ---- */
const sevBg: Record<string, string> = {
  secondary: 'bg-white text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--background-tertiary)]',
  success:   'bg-[var(--success)] text-white hover:opacity-90',
  info:      'bg-[var(--info)] text-white hover:opacity-90',
  warning:   'bg-[var(--warning)] text-[var(--warning-foreground)] hover:opacity-90',
  danger:    'bg-[var(--destructive)] text-white hover:opacity-90',
  help:      'bg-[var(--accent)] text-white hover:opacity-90',
};

const button = {
  root: ({ props }: any) => {
    const base =
      'inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium transition-all duration-150 cursor-pointer select-none border-0 disabled:opacity-50 disabled:cursor-not-allowed';
    const severity = sevBg[props.severity] || 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]';
    const size = props.size === 'small' ? 'px-3 py-1.5 text-xs' : props.size === 'large' ? 'px-6 py-3 text-base' : '';
    const outlined = props.outlined
      ? 'bg-transparent border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--accent-muted)]'
      : '';
    const text = props.text
      ? 'bg-transparent text-[var(--primary)] hover:bg-[var(--accent-muted)]'
      : '';
    return { className: `${base} ${severity} ${size} ${outlined} ${text}`.trim() };
  },
  label: { className: 'font-medium leading-none' },
  icon: { className: 'text-base leading-none' },
};

/* ---- InputText ---- */
const inputbase =
  'w-full rounded-[var(--radius-sm)] border border-[var(--input-border)] bg-[var(--input)] text-[var(--foreground)] px-3 py-2 text-sm transition-all duration-150 placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--input-focus)] disabled:opacity-50 disabled:cursor-not-allowed';

const inputtext = { root: { className: inputbase } };

/* ---- Password ---- */
const password = {
  root: { className: inputbase },
  input: { className: 'border-0 focus:ring-0 p-0 bg-transparent w-full outline-none text-sm' },
  panel: {
    className:
      'bg-[var(--popover)] text-[var(--popover-foreground)] rounded-[var(--radius-md)] border border-[var(--border)] shadow-lg p-3 mt-1',
  },
};

/* ---- InputTextarea ---- */
const inputtextarea = {
  root: { className: `${inputbase} resize-y min-h-[80px]` },
};

/* ---- InputNumber ---- */
const inputnumber = {
  root: { className: `inline-flex items-stretch rounded-[var(--radius-sm)] border border-[var(--input-border)] bg-[var(--input)] overflow-hidden` },
  input: { root: { className: 'w-full px-3 py-2 text-sm text-[var(--foreground)] bg-transparent border-0 outline-none focus:ring-0' } },
  buttonGroup: { className: 'flex' },
  incrementButton: { className: 'px-2 flex items-center justify-center bg-[var(--muted)] text-[var(--foreground-muted)] hover:bg-[var(--border)] cursor-pointer border-l border-[var(--border)] text-xs' },
  decrementButton: { className: 'px-2 flex items-center justify-center bg-[var(--muted)] text-[var(--foreground-muted)] hover:bg-[var(--border)] cursor-pointer border-l border-[var(--border)] text-xs' },
};

/* ---- Dropdown ---- */
const dropdown = {
  root: {
    className:
      'inline-flex items-center w-full rounded-[var(--radius-sm)] border border-[var(--input-border)] bg-[var(--input)] text-[var(--foreground)] px-3 py-2 text-sm cursor-pointer transition-all duration-150 hover:border-[var(--border-hover)] focus:ring-2 focus:ring-[var(--ring)]',
  },
  input: { className: 'flex-1 bg-transparent border-0 outline-none text-sm text-[var(--foreground)]' },
  trigger: { className: 'flex items-center text-[var(--foreground-muted)] ml-2' },
  panel: {
    className:
      'bg-[var(--popover)] text-[var(--popover-foreground)] rounded-[var(--radius-md)] border border-[var(--border)] shadow-lg mt-1 overflow-hidden',
  },
  wrapper: { className: 'max-h-60 overflow-auto' },
  item: { className: 'px-3 py-2 text-sm cursor-pointer transition-colors hover:bg-[var(--accent-muted)] text-[var(--foreground)]' },
};

/* ---- Tag ---- */
const tag = {
  root: ({ props }: any) => {
    const m: Record<string, string> = {
      info:    'bg-[var(--accent-muted)] text-[var(--primary)]',
      success: 'bg-emerald-100 text-emerald-800',
      warning: 'bg-amber-100 text-amber-800',
      danger:  'bg-red-100 text-red-800',
      help:    'bg-purple-100 text-purple-800',
    };
    return {
      className: `inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-2.5 py-0.5 text-xs font-medium ${m[props.severity] || m.info}`,
    };
  },
  value: { className: 'leading-none' },
  icon: { className: 'text-xs' },
};

/* ---- DataTable ---- */
/* Cell-level styling (headerCell, bodyCell) va en Column PT abajo */
const datatable = {
  root: { className: 'rounded-[var(--radius-md)] border border-[var(--border)] overflow-hidden bg-[var(--card)]' },
  header: { className: 'bg-[var(--background)] px-4 py-3 border-b border-[var(--border)] text-sm font-medium text-[var(--foreground-muted)]' },
  table: { className: 'w-full border-collapse text-sm' },
  thead: { className: 'border-b border-[var(--border)] bg-[var(--background)]' },
  headerRow: { className: 'border-b border-[var(--border)] bg-[var(--background)]' },
  tbody: {},
  bodyRow: { className: 'border-b border-[var(--border)] hover:bg-[var(--background)] transition-colors even:bg-[var(--background-tertiary)]' },
  footer: { className: 'border-t border-[var(--border)] bg-[var(--background)]' },
  emptyMessage: { className: 'px-4 py-8 text-center text-[var(--foreground-muted)]' },
  loadingOverlay: { className: 'absolute inset-0 bg-white/60 flex items-center justify-center z-10' },
  paginator: {
    root: { className: 'flex items-center justify-between px-4 py-3 border-t border-[var(--border)] bg-[var(--background)] text-sm' },
    firstPageButton: { className: 'px-2 py-1 text-[var(--foreground-muted)] cursor-pointer hover:text-[var(--foreground)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed' },
    prevPageButton: { className: 'px-2 py-1 text-[var(--foreground-muted)] cursor-pointer hover:text-[var(--foreground)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed' },
    nextPageButton: { className: 'px-2 py-1 text-[var(--foreground-muted)] cursor-pointer hover:text-[var(--foreground)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed' },
    lastPageButton: { className: 'px-2 py-1 text-[var(--foreground-muted)] cursor-pointer hover:text-[var(--foreground)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed' },
    pageButton: { className: 'px-3 py-1 rounded-[var(--radius-sm)] text-sm cursor-pointer hover:bg-[var(--accent-muted)] transition-colors aria-[current=page]:bg-[var(--primary)] aria-[current=page]:text-white' },
  },
};

/* ---- Column ---- */
/* Cell-level styling que PrimeReact 10.9.7 aplica via Column */
const column = {
  headerCell: { className: 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)] border-r last:border-r-0 border-[var(--border)]' },
  bodyCell: { className: 'px-4 py-3 text-[var(--foreground)] border-r last:border-r-0 border-[var(--border)]' },
  footerCell: { className: 'px-4 py-3 text-[var(--foreground-muted)] text-xs' },
  sortIcon: { className: 'ml-1 text-[var(--foreground-subtle)]' },
  columnTitle: { className: 'flex items-center gap-1' },
};

/* ---- Dialog ---- */
const dialog = {
  root: { className: 'rounded-[var(--radius-lg)] bg-[var(--popover)] text-[var(--popover-foreground)] shadow-xl border border-[var(--border)] flex flex-col max-h-[90vh]' },
  header: { className: 'flex items-center justify-between px-6 py-4 border-b border-[var(--border)]' },
  title: { className: 'text-lg font-semibold text-[var(--foreground)] m-0' },
  content: { className: 'p-6 overflow-y-auto flex-1' },
  footer: { className: 'flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)]' },
  closeButton: { className: 'w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--foreground-muted)] hover:bg-[var(--muted)] transition-colors cursor-pointer border-0 bg-transparent' },
  mask: { className: 'fixed inset-0 bg-black/40 z-[var(--z-modal-backdrop)] flex items-center justify-center p-4' },
};

/* ---- ConfirmDialog ---- */
const confirmdialog = {
  root: { className: 'rounded-[var(--radius-lg)] bg-[var(--popover)] text-[var(--popover-foreground)] shadow-xl border border-[var(--border)] flex flex-col max-h-[90vh] w-[420px]' },
  header: { className: 'flex items-center justify-between px-6 py-4 border-b border-[var(--border)]' },
  headerTitle: { className: 'text-lg font-semibold text-[var(--foreground)]' },
  content: { className: 'p-6' },
  icon: { className: 'text-2xl text-[var(--destructive)] mx-auto mb-3 block' },
  message: { className: 'text-sm text-[var(--foreground-muted)] text-center' },
  footer: { className: 'flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)]' },
  rejectButton: { className: `${button.root({ props: {} }).className}` },
  acceptButton: { className: `${button.root({ props: { severity: 'danger' } }).className}` },
};

/* ---- Message ---- */
const message = {
  root: ({ props }: any) => {
    const m: Record<string, string> = {
      error:   'bg-red-50 border-red-200 text-red-800',
      success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      warn:    'bg-amber-50 border-amber-200 text-amber-800',
      info:    'bg-purple-50 border-purple-200 text-purple-800',
    };
    return {
      className: `flex items-center gap-2 rounded-[var(--radius-sm)] border px-4 py-3 text-sm ${m[props.severity] || m.info}`,
    };
  },
  text: { className: 'flex-1' },
  icon: { className: 'text-base flex-shrink-0' },
};

/* ---- InputSwitch ---- */
const inputswitch = {
  root: { className: 'inline-flex relative w-10 h-6 rounded-full cursor-pointer transition-colors bg-[var(--muted)] aria-checked:bg-[var(--primary)]' },
  slider: { className: 'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 aria-checked:translate-x-4' },
};

/* ---- Panel ---- */
const panel = {
  root: { className: 'rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] overflow-hidden mb-4' },
  header: { className: 'flex items-center justify-between px-5 py-3 bg-[var(--background)] border-b border-[var(--border)]' },
  title: { className: 'text-sm font-semibold text-[var(--foreground)] m-0' },
  icons: { className: 'flex items-center gap-1' },
  toggler: { className: 'w-7 h-7 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--foreground-muted)] hover:bg-[var(--muted)] cursor-pointer border-0 bg-transparent transition-colors' },
  content: { className: 'p-5 text-sm text-[var(--foreground)]' },
};

/* =====================================================================
 * EXPORT — PT unificado para el PrimeReactProvider
 * ===================================================================== */
export const superhumanPt = {
  card,
  button,
  inputtext,
  password,
  inputtextarea,
  inputnumber,
  dropdown,
  tag,
  datatable,
  column,
  dialog,
  confirmdialog,
  message,
  inputswitch,
  panel,
};

export default superhumanPt;
