---
version: alpha
name: MarketingOS
description: MarketingOS — CRM + Marketing Automation multi-tenant. Inspirado en Superhuman: parchment warm canvas, Ink text, Iris violet accent, Aubergine structural framing. Cinematic cockpit aesthetic.
colors:
  primary: "#714cb6"
  primaryForeground: "#ffffff"
  primaryHover: "#5a3a9e"
  background: "#f2f0eb"
  backgroundSecondary: "#ffffff"
  backgroundTertiary: "#f7f6f3"
  foreground: "#292827"
  foregroundMuted: "#666666"
  foregroundSubtle: "#999999"
  accent: "#714cb6"
  accentForeground: "#ffffff"
  accentMuted: "#d4c7ff"
  card: "#ffffff"
  cardForeground: "#292827"
  cardBorder: "#e3e3e2"
  popover: "#ffffff"
  popoverForeground: "#292827"
  secondary: "#ffffff"
  secondaryForeground: "#292827"
  muted: "#e3e3e2"
  mutedForeground: "#666666"
  destructive: "#DC2626"
  success: "#16A34A"
  warning: "#CA8A04"
  info: "#0EA5E9"
  border: "#e3e3e2"
  borderHover: "#dcd7d3"
  input: "#ffffff"
  inputBorder: "#e3e3e2"
  inputFocus: "#714cb6"
  ring: "#714cb6"
  aubergine: "#421d24"
  aubergineDeep: "#4e242c"
  lavenderChip: "#d4c7ff"
typography:
  h1:
    fontFamily: Inter
    fontSize: 1.75rem
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  h2:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.014em"
  h3:
    fontFamily: Inter
    fontSize: 1.25rem
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.008em"
  body:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: 460
    lineHeight: 1.5
  body-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: 460
    lineHeight: 1.5
  label:
    fontFamily: Inter
    fontSize: 0.8125rem
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
rounded:
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
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
    rounded: "{rounded.sm}"
    padding: 8px 16px
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.primaryHover}"
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: 8px 16px
    borderColor: "{colors.primary}"
  card-default:
    backgroundColor: "{colors.card}"
    textColor: "{colors.cardForeground}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
    borderColor: "{colors.cardBorder}"
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
    backgroundColor: "{colors.muted}"
    textColor: "{colors.primary}"
  tab-active:
    textColor: "{colors.primary}"
    borderColor: "{colors.primary}"
  tab-inactive:
    textColor: "{colors.foregroundMuted}"
    borderColor: transparent
---

## Overview

MarketingOS adopta la estética del sistema Superhuman — un cockpit de productividad cinematográfico sobre un lienzo de pergamino cálido. La paleta combina un fondo crema (#f2f0eb) con acentos violeta (#714cb6) y texto tinta (#292827). Las tarjetas blancas (#ffffff) flotan sobre el pergamino. El violeta es el ÚNICO acento cromático — aparece en botones outline, rings de focus y links. El diseño es ligero, espacioso y sin sombras — la profundidad se logra con bordes sutiles (#e3e3e2) y superposición de capas, no con elevación.

## Colors

- **Primary / Iris (#714cb6):** Único acento cromático — botones primarios, rings de focus, links, bordes outline. Nunca como fondo de botón relleno en superficies claras (solo botón primario sobre blanco).
- **Parchment Canvas (#f2f0eb):** Fondo principal de toda la app — distingue MarketingOS del SaaS blanco genérico.
- **Bone (#ffffff):** Superficies de tarjetas y paneles que se elevan sobre el pergamino.
- **Ink (#292827):** Texto principal con subtono marrón cálido, no negro puro.
- **Fog (#e3e3e2):** Bordes y divisores sutiles.
- **Graphite (#666666):** Texto secundario para descripciones y metadatos.
- **Aubergine (#421d24):** Solo para elementos estructurales (futuro: banner y footer).
- **Lavender Chip (#d4c7ff):** Fondo de botón SignUp, badges.

## Typography

Inter (sans-serif) para todo. El peso 460 es el default para body. 600 para headings. Tracking negativo progresivo: -0.02em en h1, -0.014em en h2, -0.008em en h3. Sin tracking positivo.

## Layout & Spacing

- **Grid base:** 16px. Espaciado generoso entre secciones.
- **Contenido principal:** padding `p-4` (16px), expande a `md:p-6` (24px) en desktop.
- **Sidebar:** 280px en desktop, overlay en mobile (<768px).
- **Max content width:** 1200px.
- **Sin sombras.** La profundidad se logra con bordes de 1px #e3e3e2 y capas de fondo superpuestas.

## Components

### Button
Botón primario con fondo Iris (#714cb6) y texto blanco. 8px radius. Para acciones ghost/outline: borde Iris 1px, texto Iris, fondo transparente. Sin variantes de tamaño — solo `default` (h-10) y `sm` (h-8).

### Card
Fondo blanco (#ffffff), borde 1px Fog (#e3e3e2), 16px radius. Padding `lg` (24px). Sin sombra.

### Input
Inputs en modo light con fondo blanco y borde Fog. Focus ring Iris (#714cb6). Placeholder en foregroundSubtle.

### Sidebar
Fondo Bone (#ffffff) con borde derecho Fog. Items con padding 10px 16px. Item activo con fondo Fog y texto Iris.

### DataTable
Tablas sin bordes verticales. Filas con hover en Fog. Header en foregroundMuted (tamaño body-sm).

### Dialog
Fondo Bone (#ffffff), borde Fog. Backdrop semitransparente. Footer alineado a la derecha.

## Do's and Don'ts

- **DO** usar `text-[var(--primary)]` para acentos violeta (links, iconos decorativos).
- **DON'T** usar #f2f0eb como fondo de tarjetas — las tarjetas son blancas.
- **DO** usar #714cb6 como borde outline en botones ghost.
- **DON'T** usar sombras en tarjetas — ni box-shadow ni drop-shadow.
- **DO** mantener espaciado generoso (al menos `gap-4` entre secciones).
- **DON'T** usar colores hardcodeados — siempre CSS variable.
- **DO** usar Lucide icons con tint Iris en superficies claras.
