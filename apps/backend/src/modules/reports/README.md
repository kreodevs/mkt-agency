# ReportsModule

Informes de rendimiento generados por IA a partir de campañas, leads y contenidos.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/reports` | Solicitar generación (202) |
| GET | `/api/v1/reports` | Listar (filtros `type`, `campaignId`) |
| GET | `/api/v1/reports/:id` | Detalle con `data` JSON |

## Tipos

- `campaign_performance`
- `lead_analytics`

## Worker

Cola `report-generation` — agrega métricas del tenant y genera análisis (stub/OpenRouter).

## Migration

`1730000000005-CreateReports.ts`
