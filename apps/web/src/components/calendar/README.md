# Calendario editorial (US-012)

Componentes del calendario mensual con FullCalendar.

| Archivo | Rol |
|---------|-----|
| `CalendarView.tsx` | Vista mensual; eventos coloreados por `dominantStatus`; `initialDate` + `key` sincronizan mes y eventos async |
| `DayDetail.tsx` | Detalle del día con preview, firma y `ApprovalActions` |

Colores: verde = aprobado, amarillo = borrador/revisión, rojo = rechazado/en cambios, gris = mixto.

Ruta: `/calendar`.
