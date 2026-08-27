# Componentes copiloto (SOHO)

UX simplificada para usuarios que solo copian y pegan en redes.

| Archivo | Rol |
|---------|-----|
| `CopilotStatusPanel.tsx` | Panel en bandeja: pipeline + selector día/semana + preparar contenido + plantillas |
| `CmCharacterSetupPanel.tsx` | Biblioteca CM: polling en generación, retrato visible con fetch autenticado, reset de «lista» al cambiar retrato |
| `SohoLegacyRedirect.tsx` | Redirige rutas de agencia a `/` en modo copiloto |
| `PaidProfileRedirect.tsx` | Redirige `/agency/media-intents` si no hay perfil Growth con pauta |

Estado de modo avanzado: `store/copilot-ui.ts` (`mkt-advanced-nav` en localStorage).

Navegación SOHO: `lib/tenant-navigation.ts` → `tenantSohoNavigation` (10 ítems: Inicio, Resumen, Calendario, Actividad agentes, **Agentes IA**, …).

Toggle sidebar: «Cambiar a modo agencia (Growth)» / «Volver a copiloto (SOHO)» — cambia el perfil operativo del tenant (tooltip en el botón).
