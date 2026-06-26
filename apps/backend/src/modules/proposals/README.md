# ProposalsModule

Propuestas comerciales generadas por IA con firma digital SHA-256.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/proposals` | Solicitar generación (202, status `generating`) |
| GET | `/api/v1/proposals` | Listar (filtros `campaignId`, `status`) |
| GET | `/api/v1/proposals/:id` | Detalle con contenido |
| POST | `/api/v1/proposals/:id/sign` | Firma digital → `accepted` |
| POST | `/api/v1/proposals/:id/reject` | Rechazar → `rejected` |

## Worker

Cola `proposal-generation` — genera contenido vía `StubProposalAdapter` o `OpenRouterProposalAdapter`.

## Migration

`1730000000004-CreateProposals.ts`
