# Hooks — calendario

| Hook | Descripción |
|------|-------------|
| `useCalendarMonth(month, year)` | Resumen mensual (`GET /calendar?month=&year=`) |
| `useCalendarDay(date)` | Detalle de un día (`GET /calendar/:date`) |
| `useSohoCalendarMonth(month, year, productId?)` | Mes SOHO: fusiona `/calendar` + bandeja (`publication-inbox`) con colores de la leyenda |

Servicio: `src/services/calendar.ts`. Tipos: `src/types/calendar.ts`.
