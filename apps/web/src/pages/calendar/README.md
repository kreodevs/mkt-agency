# Calendario editorial

Página tenant en `/calendar`: calendario mensual + panel lateral de detalle del día.

- Muestra borradores y aprobados (no exige aprobación para aparecer).
- Ubica cada pieza por `scheduledDate` o, si falta, por fecha de creación.
- Aviso cuando el mes visible no tiene piezas (navegar con «today» u otro mes).

Usa `useCalendarMonth` / `useCalendarDay` y componentes en `src/components/calendar/`.
