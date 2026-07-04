# Theme — Anthropic Home (Ivory & Slate)

Sistema visual definido en `design.md`, implementado en `vars.css` y `tailwind.config.js`.

## Paleta

| Token design | CSS | Rol semántico |
|---|---|---|
| ivory-light | `--color-ivory-light` | `--background`, texto en CTA oscuro |
| ivory-medium | `--color-ivory-medium` | `--card`, `--secondary` |
| ivory-dark | `--color-ivory-dark` | hover en superficies secundarias |
| slate-dark | `--color-slate-dark` | `--foreground`, `--primary` (CTA) |
| slate-light | `--color-slate-light` | `--foreground-muted` |
| cloud-dark | `--color-cloud-dark` | `--foreground-subtle`, captions |
| cloud-medium | `--color-cloud-medium` | `--border` |
| oat | `--color-oat` | `--border-hover`, acentos footer |

## Tipografía

Familias: `--font-sans` (Anthropic Sans → Arial), `--font-serif` (Georgia), `--font-mono`.

Utilidades en `index.css`: `.type-display-xl`, `.type-ui-sans-semibold`, `.type-body-serif-s`, `.type-detail-xs`, etc.

## Espaciado y radio

- Grid 4px: `--space-1` … `--space-9`, aliases `--spacing-xs` … `--spacing-2xl`
- Layout: `--site-gutter`, `--site-margin`, `--section-space-sm`, `--section-space-main`
- Radios: `--radius-sm` (4px), `--radius-md` (8px), `--radius-lg` (16px), `--radius-full`

## Breakpoints (Tailwind)

- `tablet`: 768px
- `desktop`: 992px

## Action buttons

Botones icon-only en tablas y toolbars. Usar `IconButton` + `ACTION_BUTTON_GROUP_CLASS`.

| Token | Valor | Uso |
|-------|-------|-----|
| `--action-size` | 2.25rem | Ancho/alto del botón |
| `--action-bg` | ivory-medium | Fondo |
| `--action-bg-hover` | ivory-dark | Hover |
| `--action-border-hover` | slate-dark | Borde activo |

**Tones (`IconButton`):** `default`, `primary`, `selected`, `destructive`, `success`, `danger`.
