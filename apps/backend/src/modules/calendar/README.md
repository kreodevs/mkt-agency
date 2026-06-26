# Calendar module (US-012)

Calendario editorial a partir de `contents` + versión actual + campaña.

- `GET /api/v1/calendar?month=&year=` — resumen por día (conteos y estado dominante)
- `GET /api/v1/calendar/:date` — detalle del día (YYYY-MM-DD)

Fecha efectiva: `scheduled_date` o, si es null, `created_at`.

Colores frontend: verde=approved, amarillo=draft/in_review, rojo=rejected/in_changes.
