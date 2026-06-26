# CompetitorsModule

Monitoreo de competencia: registro de competidores y consulta de menciones.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/competitors` | Listar competidores del tenant |
| POST | `/api/v1/competitors` | Registrar competidor |
| DELETE | `/api/v1/competitors/:id` | Eliminar (cascade menciones) |
| GET | `/api/v1/competitors/:id/mentions` | Menciones (filtro `sentiment`, paginación) |

## Notas MVP

Al registrar un competidor se insertan menciones demo para validar la UI. Un worker externo las reemplazará en producción.

## Migration

`1730000000006-CreateCompetitors.ts`
