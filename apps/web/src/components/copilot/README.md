# Componentes copiloto (SOHO)

UX simplificada para usuarios que solo copian y pegan en redes.

| Archivo | Rol |
|---------|-----|
| `CopilotStatusPanel.tsx` | Panel en bandeja: pipeline + botón «Preparar mi semana» |
| `CmCharacterSetupPanel.tsx` | Biblioteca CM: chips, apariencia, retrato IA o desde `/assets` (enlace «Abrir librería completa») |
| `SohoLegacyRedirect.tsx` | Redirige rutas de agencia a `/` en modo copiloto |

Estado de modo avanzado: `store/copilot-ui.ts` (`mkt-advanced-nav` en localStorage).

Navegación SOHO: `lib/tenant-navigation.ts` → `tenantSohoNavigation` (Inicio, Calendario, Librería, Mi producto, Ajustes).
