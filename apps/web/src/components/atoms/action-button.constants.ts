/** Contenedor de acciones en filas de tabla, cards o toolbars. */
export const ACTION_BUTTON_GROUP_CLASS =
  'flex items-center gap-[var(--action-gap)]';

/** Tamaño estándar de íconos Lucide dentro de IconButton (también vía [&_svg] en size action). */
export const ACTION_ICON_CLASS = 'h-action-icon w-action-icon shrink-0';

export type ActionButtonTone =
  | 'default'
  | 'primary'
  | 'selected'
  | 'destructive'
  | 'success'
  | 'danger';

export const actionButtonToneVariant = {
  default: 'action',
  primary: 'action-primary',
  selected: 'action-selected',
  destructive: 'action-destructive',
  success: 'action-success',
  danger: 'action-danger',
} as const satisfies Record<ActionButtonTone, string>;
