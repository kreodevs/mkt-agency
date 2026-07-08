# Componentes copiloto (SOHO)

UX simplificada para usuarios que solo copian y pegan en redes.

| Archivo | Rol |
|---------|-----|
| `CopilotStatusPanel.tsx` | Panel en bandeja: pipeline + botón «Preparar mi semana» |
| `CmCharacterSetupPanel.tsx` | Actividad inicial: retrato CM + vista previa lip-sync |
| `SohoLegacyRedirect.tsx` | Redirige rutas de agencia a `/` en modo copiloto |

Estado de modo avanzado: `store/copilot-ui.ts` (`mkt-advanced-nav` en localStorage).

Navegación SOHO: `lib/tenant-navigation.ts` → `tenantSohoNavigation` (Inicio, Mi producto, Ajustes).
