# Componentes copiloto (SOHO)

UX simplificada para usuarios que solo copian y pegan en redes.

| Archivo | Rol |
|---------|-----|
| `CopilotStatusPanel.tsx` | Panel en bandeja: pipeline + botón «Preparar mi semana» |
| `CmCharacterSetupPanel.tsx` | Biblioteca de CMs: crear, editar apariencia (lista o pendiente) en borrador local, guardar con «Guardar apariencia», retrato (IA o assets), preview lip-sync |
| `SohoLegacyRedirect.tsx` | Redirige rutas de agencia a `/` en modo copiloto |

Estado de modo avanzado: `store/copilot-ui.ts` (`mkt-advanced-nav` en localStorage).

Navegación SOHO: `lib/tenant-navigation.ts` → `tenantSohoNavigation` (Inicio, Mi producto, Ajustes).
