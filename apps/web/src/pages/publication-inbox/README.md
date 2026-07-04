# Bandeja de publicación (frontend)

Página principal del tenant en `/`. En **modo copiloto** (default SOHO) el usuario solo revisa, aprueba y copia/pega; el copiloto orquesta competidores, análisis y generación.

## Modo copiloto vs agencia

| Modo | Menú | Rutas legacy |
|------|------|----------------|
| Copiloto (default) | Inicio, Mi producto, Ajustes | `/contents`, `/calendar`, `/community`, `/strategy`, `/dashboard` → `/` |
| Agencia avanzado | Menú completo (17 ítems) | Rutas accesibles |

Toggle: sidebar «Modo agencia (avanzado)» o `/settings/copilot`.

## Archivos

| Archivo | Rol |
|---------|-----|
| `pages/publication-inbox/PublicationInboxPage.tsx` | Vista hub + `CopilotStatusPanel` |
| `components/publication-inbox/InboxItemCard.tsx` | CTA «Copiar y publicar» + preview visual |
| `components/publication-inbox/InboxItemVisualPreview.tsx` | Imagen/video/carrusel antes de aprobar |
| `components/publication-inbox/InboxKitPanel.tsx` | Kit Copiar y Llevar multi-día |
| `components/copilot/CopilotStatusPanel.tsx` | Estado pipeline + preparar semana |
| `services/publication-inbox.ts` | Cliente API (incl. copilot-status, prepare-week) |
| `store/copilot-ui.ts` | Persistencia modo avanzado |
| `lib/tenant-navigation.ts` | Nav SOHO vs avanzado |

Resumen KPIs legacy: `/agency-overview` (solo modo avanzado en sidebar).
