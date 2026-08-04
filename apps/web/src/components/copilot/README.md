# Componentes copiloto (SOHO)

UX simplificada para usuarios que solo copian y pegan en redes.

| Archivo | Rol |
|---------|-----|
| `CopilotStatusPanel.tsx` | Panel en bandeja: pipeline + botón «Preparar mi semana» (tras éxito invalida bandeja y muestra banner de bienvenida) |
| `CmCharacterSetupPanel.tsx` | Biblioteca CM: chips, apariencia, retrato IA o desde `/libreria` (enlace «Abrir librería completa»). El error de lip-sync solo se muestra con `status === 'failed'` (el retrato puede seguir visible). |
| `SohoLegacyRedirect.tsx` | Redirige rutas de agencia a `/` en modo copiloto |
| `PaidProfileRedirect.tsx` | Redirige `/agency/media-intents` si no hay perfil Growth con pauta |

Estado de modo avanzado: `store/copilot-ui.ts` (`mkt-advanced-nav` en localStorage).

Navegación SOHO: `lib/tenant-navigation.ts` → `tenantSohoNavigation` (10 ítems: Inicio, Resumen, Calendario, Actividad agentes, **Agentes IA**, …).

Toggle sidebar: «Cambiar a modo agencia (Growth)» / «Volver a copiloto (SOHO)» — cambia el perfil operativo del tenant (tooltip en el botón).
