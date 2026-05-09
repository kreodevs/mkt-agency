---
version: alpha
name: MarketingOS
description: MarketingOS — CRM + Marketing Automation multi-tenant. Tema Luxury/Corporate: negro profundo, carbón, dorado refinado. Basado en Kreo UI Corporate-UI-Lib.
colors:
  primary: "#C9A227"
  primaryForeground: "#0A0A0A"
  primaryHover: "#B8922A"
  background: "#0A0A0A"
  backgroundSecondary: "#111111"
  backgroundTertiary: "#1C1C1C"
  foreground: "#F5F5F5"
  foregroundMuted: "#A3A3A3"
  foregroundSubtle: "#6B6B6B"
  accent: "#C9A227"
  accentForeground: "#0A0A0A"
  accentMuted: "#8B7018"
  card: "#141414"
  cardForeground: "#F5F5F5"
  cardBorder: "#2A2A2A"
  popover: "#1C1C1C"
  popoverForeground: "#F5F5F5"
  secondary: "#1C1C1C"
  secondaryForeground: "#F5F5F5"
  muted: "#262626"
  mutedForeground: "#A3A3A3"
  destructive: "#DC2626"
  success: "#16A34A"
  warning: "#CA8A04"
  info: "#0EA5E9"
  border: "#2A2A2A"
  borderHover: "#3A3A3A"
  input: "#1C1C1C"
  inputBorder: "#2A2A2A"
  inputFocus: "#C9A227"
  ring: "#C9A227"
typography:
  h1:
    fontFamily: Inter
    fontSize: 1.75rem
    fontWeight: 700
    lineHeight: 1.2
  h2:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: 600
    lineHeight: 1.3
  h3:
    fontFamily: Inter
    fontSize: 1.25rem
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: Inter
    fontSize: 0.8125rem
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
rounded:
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primaryForeground}"
    rounded: "{rounded.md}"
    padding: 8px 16px
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.primaryHover}"
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.foregroundMuted}"
    rounded: "{rounded.md}"
    padding: 8px 16px
  card-default:
    backgroundColor: "{colors.card}"
    textColor: "{colors.cardForeground}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  input-default:
    backgroundColor: "{colors.input}"
    textColor: "{colors.foreground}"
    borderColor: "{colors.inputBorder}"
    rounded: "{rounded.md}"
    padding: 8px 12px
  sidebar-item:
    backgroundColor: transparent
    textColor: "{colors.foregroundMuted}"
    rounded: "{rounded.md}"
    padding: 10px 16px
  sidebar-item-active:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.primary}"
  tab-active:
    textColor: "{colors.primary}"
    borderColor: "{colors.primary}"
  tab-inactive:
    textColor: "{colors.foregroundMuted}"
    borderColor: transparent
---

## Overview

MarketingOS es un sistema CRM + Marketing Automation con diseño Luxury/Corporate. La paleta combina negro profundo con acentos dorados para transmitir exclusividad y confianza. El espaciado generoso (16px base) asegura que el contenido respire. Los bordes de tarjetas (#2A2A2A) son sutiles pero definidos. Los rings de focus son dorados para mantener consistencia visual.

## Colors

- **Primary (#C9A227):** Dorado refinado — el único color de interacción. Botones, links, rings de focus, tabs activos.
- **Background (#0A0A0A):** Negro profundo — fondo principal. Crea el contraste dramático.
- **Foreground (#F5F5F5):** Texto principal — casi blanco sobre fondo negro.
- **Card (#141414):** Negro ligeramente más claro que el fondo para jerarquía de superficie.
- **Destructive (#DC2626):** Solo para eliminar datos. Sin roces — borrar es irreversible.
- **Success (#16A34A):** Indicadores de estado completado.
- **Warning (#CA8A04):** Advertencias y notificaciones de atención.

## Typography

Inter (sans-serif) para todo. Sin fuentes decorativas excepto `font-display` (Playfair Display) para landing pages externas. El tamaño base es 14px (0.875rem). Los Labels son 13px con tracking suave.

## Layout & Spacing

- **Grid base:** 16px (md). Todo el espaciado escala desde aquí.
- **Contenido principal:** padding `p-4` (16px) que se expande a `md:p-6` (24px) en desktop.
- **Sidebar:** 280px en desktop, overlay en mobile (<768px).
- **Max content width:** 1200px para páginas de listados.

## Components

### Button
El `button-primary` es la única acción de alto énfasis por vista. Usar `button-ghost` para acciones secundarias. Los botones eliminar usan `button-primary` con foreground blanco sobre fondo red. Sin variedad de tamaños — solo `default` y `sm` (para tablas).

### Card
Todas las tarjetas usan `card-default`. El título va dentro de la tarjeta con `h3`. El padding interno es `lg` (24px).

### Input
Inputs en modo dark con fondo `#1C1C1C` y borde `#2A2A2A`. El focus ring es dorado. Placeholder en `foregroundSubtle`.

### Sidebar
Items con padding de 10px 16px. El item activo se ilumina con fondo secondary y texto primary (dorado). Iconos en `foregroundMuted` (16x16). El logo va en la parte superior con `font-display`.

### DataTable
Tablas sin bordes verticales. Filas con hover en `muted`. Paginación minimalista solo con números. El header en `foregroundMuted` con tamaño `body-sm`.

### Dialog
Fondo `popover` (#1C1C1C) con borde `cardBorder`. Backdrop semitransparente (#000 a 60%). Footer alineado a la derecha con botones ghost + primary.

## Do's and Don'ts

- **DO** usar `text-[var(--primary)]` para texto decorativo/destacado.
- **DON'T** usar colores hardcodeados. Siempre CSS variable.
- **DO** usar Lucide icons (16x16 en tablas, 20x20 en sidebar, 24x24 en estados vacíos).
- **DON'T** usar PrimeIcons (`pi pi-*`).
- **DO** mantener espaciado generoso entre secciones (al menos `gap-4`).
- **DON'T** poner botones primarios duplicados en una misma vista.
- **DO** usar breadcrumb con `< en gris muted para navegación secundaria.
