# platform-impersonation

Skill de dominio Kreo para **impersonación de tenant** (superadmin → operativa tenant).

## Archivos

| Archivo | Contenido |
|---------|-----------|
| `SKILL.md` | Principios, checklist, anti-patrones |
| `reference.md` | Contrato API, JWT, guards, localStorage |
| `examples.md` | Monolito (mkt-agency) y apps separadas (eodin) |

## Instalación activa

Copiar a `.cursor/skills/platform-impersonation/` (incluido en repo) o ejecutar `scripts/install-agent-governance.sh`.

Copia global personal: `~/.cursor/skills/platform-impersonation/`.

## Referencia viva en este repo

- `apps/web/src/lib/impersonation.ts`
- `apps/web/src/components/admin/TenantImpersonationSelect.tsx`
- `apps/web/src/components/admin/ImpersonationSwitcher.tsx`
- `apps/backend/src/modules/superadmin/commands/impersonate.handler.ts`
