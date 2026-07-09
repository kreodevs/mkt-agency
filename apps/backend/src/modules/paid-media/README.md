# Paid Media (stub offline)

Media Buyer sin APIs de Meta/Google. Genera **intenciones de campaña** para lanzamiento manual en Ads Manager.

## Flujo

1. Creative emite `CreativePackReady` y persiste `creative_packs`
2. `MediaBuyerStubService` crea `media_campaign_intents` por plataforma
3. Usuario aprueba intent → marca `launched_manual` cuando publica en Ads Manager

## API (`Growth` + presupuesto activo)

| Método | Ruta |
|--------|------|
| GET | `/api/v1/agency/media-intents` |
| POST | `/api/v1/agency/media-intents/:id/approve` |
| POST | `/api/v1/agency/media-intents/:id/launch-manual` |
| POST | `/api/v1/agency/media-intents/process-pack/:packId` |
