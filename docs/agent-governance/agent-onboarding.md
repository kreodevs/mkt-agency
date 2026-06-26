# Onboarding para agentes implementadores

1. **Sesión 0:** pega o adjunta **`PROMPT-INICIAL.md`** (raíz) en tu agente.
2. Lee **`IMPLEMENT.md`** y **`.specify/memory/constitution.md`** (layout spec-kit primario).
3. Lee **`docs/agent-governance/COMO-USAR-GOBERNANZA-IA.md`** (guía principal).
4. Si aún no instalaste gobernanza en `.cursor/`, sigue **`docs/agent-governance/INSTALACION.md`**.
5. Contexto del proyecto: **`docs/agent-governance/references/AGENT-PROMPT.md`**; checklist en **`specs/NNN-slug/tasks.md`** (espejo `docs/sdd/tasks.md`).
6. Consulta la guía de consumo: `docs/agent-governance/references/THEFORGE-DOC-CONSUMPTION-GUIDE.md`.
7. Carga `AGENTS.md` y las rules/skills en `.cursor/` según la tarea.
8. Sesiones siguientes: comando **`/implementar-tarea`** o repite pasos 3–5 de `PROMPT-INICIAL.md`.

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
