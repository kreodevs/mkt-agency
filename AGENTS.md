# AGENTS

Punto de entrada para agentes de código (Cursor, Claude Code, Copilot, etc.).

## Documentos SDD (layout dual)

Lee primero el layout **spec-kit** en la raíz del repo; `docs/sdd/*` es espejo para gobernanza:

| Documento | Primario (spec-kit) | Espejo (gobernanza) |
|-----------|---------------------|---------------------|
| Constitución (MDD) | `.specify/memory/constitution.md` | `docs/sdd/mdd.md` |
| Spec | `specs/001-mkt-agency-os/spec.md` | `docs/sdd/spec.md` |
| Blueprint / Plan | `specs/001-mkt-agency-os/plan.md` | `docs/sdd/blueprint.md` |
| Tasks | `specs/001-mkt-agency-os/tasks.md` | `docs/sdd/tasks.md` |

## Instalación de gobernanza

El ZIP **no incluye** la carpeta oculta `.cursor/` (macOS/Finder la oculta al extraer). Los artefactos viven en `docs/agent-governance/`; instálalos en el repo destino así:

1. Lee `IMPLEMENT.md` y `.specify/memory/constitution.md`.
2. Lee `docs/agent-governance/COMO-USAR-GOBERNANZA-IA.md` y `docs/agent-governance/INSTALACION.md`.
3. Copia o mapea cada archivo según la tabla (o ejecuta `scripts/install-agent-governance.sh`).

| Archivo en ZIP | Destino en repo destino |
|----------------|-------------------------|
| `docs/agent-governance/rules/*.mdc` | `.cursor/rules/*.mdc` |
| `docs/agent-governance/skills/*/SKILL.md` | `.cursor/skills/*/SKILL.md` |
| `docs/agent-governance/references/*` | `.cursor/references/*` |
| `docs/agent-governance/agents/*` | `.cursor/agents/*` |
| `docs/agent-governance/commands/*` | `.cursor/commands/*` |
| `docs/agent-governance/mcp.json.example` | `.cursor/mcp.json` |

- **Uso del paquete:** `docs/agent-governance/COMO-USAR-GOBERNANZA-IA.md`
- **Onboarding:** `docs/agent-governance/agent-onboarding.md`
- **Instalación paso a paso:** `docs/agent-governance/INSTALACION.md`

## Skill impersonación (Kreo Eventos)

Para impersonación, suplantación o switch superadmin→tenant, usar **`docs/agent-governance/skills/platform-impersonation/`** (copia activa en `.cursor/skills/platform-impersonation/`).

## Hechos del proyecto (Mkt Agency OS)

- **Backend:** NestJS
- **Frontend:** React
- **Infra / deploy:** Dokploy

**Globs backend:**
- `apps/backend/**`

**Globs frontend:**
- `apps/web/**`
- `packages/**/src/**`

**Scripts npm/pnpm:**
- `yarn build`

**Capas:**
- 1. Contexto y alcance
- 2. Vista de módulos / capas
- 2.1 Capas arquitectónicas
- 2.2 Módulos del Monolito Modular
- 2.3 Patrones estructurales y de comportamiento
- 2.4 Diagrama de contexto del sistema
- 3. Modelo y persistencia
- 3.1 Esquema de base de datos (PostgreSQL 16)
- 3.2 Índices principales
- 3.3 Reglas de inmutabilidad

**Tasks (extracto):**
- [ ] [P] Implementar endpoint `GET /api/v1/setup/status` que verifique existencia de superadmin
- [ ] [P] Implementar endpoint `POST /api/v1/setup/init` para crear primer superadmin
- [ ] [P] Implementar guard de bootstrap que verifique que no exista superadmin previamente
- [ ] [P] Crear comando `CreateSuperadminCommand` y su handler
- [ ] [P] Implementar lógica de dominio para validar contraseña con Argon2id

**Docs SDD:**
- `docs/sdd/mdd.md`
- `docs/sdd/blueprint.md`
- `docs/sdd/spec.md`
- `docs/sdd/architecture.md`
- `docs/sdd/tasks.md`
- `docs/sdd/use-cases.md`
- `docs/sdd/user-stories.md`
- `docs/sdd/api-contracts.md`
- `docs/sdd/logic-flows.md`
- `docs/sdd/ux-ui-guide.md`
- `docs/sdd/infra.md`

## Resolución de conflictos SDD

El detector encontró posibles contradicciones entre entregables. **Prioriza el MDD** y documenta la decisión en `docs/sdd/PROGRESO.md`.

- TypeORM vs Prisma: prioriza el ORM declarado en MDD §2/Blueprint; no mezcles ambos en el mismo servicio.
