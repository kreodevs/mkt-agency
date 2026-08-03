# Calendario editorial

## Qué es

Dos vistas de calendario que comparten datos de contenidos programados:

1. **Calendario SOHO** — `/calendario` (menú copiloto)
2. **Calendario editorial avanzado** — `/calendar` (solo vista avanzada)

## Para qué sirve

Planificar visualmente **qué publicar cada día**, ver borradores y aprobados en contexto temporal, y complementar la bandeja con una vista mensual.

## Cómo usarlo

### Calendario SOHO (`/calendario`)

- Vista mensual optimizada para SOHO.
- Panel lateral al seleccionar un día (`SohoCalendarDayPanel`) con tarjetas `InboxItemCard`.
- Leyenda de colores (`SohoCalendarLegend`).
- Hook: `useSohoCalendarMonth`.
- Acceso desde menú **Calendario** en modo copiloto y avanzado (grupo «Hoy»).

**Flujo:**

1. Navega meses con flechas o «Hoy».
2. Click en día con piezas → detalle y acciones (aprobar, copiar, etc.).
3. Días sin contenido aparecen vacíos — prepara semana desde Inicio si el mes está vacío.

### Calendario editorial avanzado (`/calendar`)

- Ruta en **Configuración → Calendario editorial (avanzado)**.
- Muestra borradores y aprobados (no exige aprobación para aparecer).
- Ubica cada pieza por `scheduledDate` o, si falta, por fecha de creación.
- Aviso cuando el mes visible no tiene piezas.
- Hooks: `useCalendarMonth`, `useCalendarDay`.
- Componentes en `components/calendar/`.

Redirige a `/` si estás en modo copiloto (`SohoLegacyRedirect` no aplica a `/calendario`, pero sí a `/calendar`).

### Comparación

| Aspecto | `/calendario` | `/calendar` |
|---------|---------------|-------------|
| Modo SOHO | Sí | No (avanzado) |
| Acciones de bandeja | Sí (tarjetas inbox) | Vista principalmente consultiva |
| API | Publication inbox + contents | `GET /api/v1/calendar` |

### Recordatorios automáticos

Cron `approval-reminder` (09:00 y 23:00 UTC):

- Notificación si hay pendientes de aprobar
- Notificación **Hoy toca publicar** (`publish_reminder`) para piezas del día

## Qué pasa si...

| Situación | Comportamiento |
|-----------|----------------|
| Post sin `scheduledDate` | Aparece en fecha de creación |
| Mes vacío | Mensaje guía; usar Preparar mi semana |
| Pieza publicada | Sale de próximas/listas; puede no mostrarse en calendario activo |
| Cambio de fecha en editor | Reflejo tras refrescar query |

## Relacionado con

- [Copiloto y bandeja](../copiloto-bandeja/README.md)
- [Campañas y contenido](../campanas-contenido/README.md)
- [Publicación n8n](../publicacion-n8n/README.md)
