# Prompt inicial — implementa este handoff

**Misión:** Implementar **Mkt Agency OS** desde el entregable TheForge, tarea a tarea, respetando spec-kit y gobernanza IA.

## Prerrequisitos (humano)

- Descomprime el ZIP en la **raíz del repositorio destino** (mismo nivel que `AGENTS.md` e `IMPLEMENT.md`).
- Abre el repo en la herramienta de agente (Cursor, Claude Code, GitHub Copilot, OpenHands, etc.).

## Paso 1 — Instalar gobernanza IA (acción del agente)

**Tu primera acción** en esta sesión es instalar gobernanza ejecutando el script en **terminal/shell** desde la raíz del repo. Cursor, Claude Code, Copilot y herramientas similares pueden correr shell si el usuario **aprueba permisos de terminal** cuando se soliciten.

**Ejecuta en terminal:**

```bash
chmod +x scripts/install-agent-governance.sh
./scripts/install-agent-governance.sh
```

**Verifica** que exista `.cursor/rules/` (y `.cursor/skills/` si aplica) antes de continuar al Paso 2. El script copia reglas, skills y referencias de `docs/agent-governance/` hacia `.cursor/`.

**No pidas al usuario** que ejecute el script salvo que falle por permisos, rutas inexistentes o un error que no puedas resolver.

## Paso 1.5 — Vincular The Forge MCP (si aplica)

Si existe **`.theforge-project.json`** en la raíz del repo:

1. Copia `docs/agent-governance/mcp.json.example` → `.cursor/mcp.json` (si no lo hizo el script).
2. Sustituye `{{API_URL}}` y `{{MCP_M2M_SECRET}}` con tu Secret MCP de The Forge.
3. Lee `docs/agent-governance/references/THEFORGE-LINK.md` para `projectId` y `stageId`.
4. Si la documentación SDD contradice el código correcto, usa MCP **`report_documentation_gap`** (ver skill `theforge-doc-sync`).

## Paso 2 — Orden de lectura (obligatorio)

Lee **en este orden** antes de escribir código:

1. **`IMPLEMENT.md`** — bootstrap spec-kit y relación con gobernanza
2. **`.specify/memory/constitution.md`** — principios del proyecto
3. **`AGENTS.md`** — entrada cross-tool e instalación
4. **`docs/agent-governance/references/AGENT-PROMPT.md`** — contexto específico (stack, módulos, conflictos SDD)
5. **`specs/NNN-slug/tasks.md`** — checklist canónica (espejo: `docs/sdd/tasks.md`)

## Paso 3 — Primera tarea abierta

Implementa la **primera tarea pendiente** del checklist:

- [ ] [P] Implementar endpoint `GET /api/v1/setup/status` que verifique existencia de superadmin
- [ ] [P] Implementar endpoint `POST /api/v1/setup/init` para crear primer superadmin
- [ ] [P] Implementar guard de bootstrap que verifique que no exista superadmin previamente
- [ ] [P] Crear comando `CreateSuperadminCommand` y su handler
- [ ] [P] Implementar lógica de dominio para validar contraseña con Argon2id

Consulta Blueprint (`docs/sdd/blueprint.md`), MDD (`docs/sdd/mdd.md`) y Architecture si aplica.

## Paso 4 — Gates antes de cerrar

- `yarn build`
- Respeta subflujos en `docs/agent-governance/references/workflows.md`.

## Paso 5 — Actualizar progreso

Marca la tarea completada en **`docs/sdd/PROGRESO.md`** (sincronizado con Tasks).

## Stack detectado (TheForge)

- **Backend:** NestJS
- **Frontend:** React
- **Infra / deploy:** Dokploy

## Resolución de conflictos SDD

El detector encontró posibles contradicciones entre entregables. **Prioriza el MDD** y documenta la decisión en `docs/sdd/PROGRESO.md`.

- TypeORM vs Prisma: prioriza el ORM declarado en MDD §2/Blueprint; no mezcles ambos en el mismo servicio.

## Compatibilidad multi-herramienta

- **Cursor:** adjunta `@PROMPT-INICIAL.md`, `@IMPLEMENT.md`, `@AGENTS.md` y los archivos de la tarea.
- **Claude Code:** incluye este archivo, `IMPLEMENT.md` y `docs/agent-governance/references/AGENT-PROMPT.md` en el contexto inicial.
- **Copilot / otros:** pega este prompt completo y referencia rutas relativas del repo.

## Sesiones siguientes

Tras la sesión 0, usa el comando **`/implementar-tarea`** (Cursor) o repite pasos 3–5 leyendo `docs/agent-governance/references/AGENT-PROMPT.md` y la siguiente tarea abierta en `specs/NNN-slug/tasks.md`.
