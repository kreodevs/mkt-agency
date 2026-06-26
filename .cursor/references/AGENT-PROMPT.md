# Agent prompt — contexto del proyecto

Referencia **interna** generada por TheForge. Úsala tras la sesión 0 (`PROMPT-INICIAL.md`) o con `/implementar-tarea`.

## Documentos del proyecto

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
- `docs/agent-governance/references/THEFORGE-DOC-CONSUMPTION-GUIDE.md`
- `docs/agent-governance/COMO-USAR-GOBERNANZA-IA.md`
- `AGENTS.md`

## Stack detectado

- **Backend:** NestJS
- **Frontend:** React
- **Infra / deploy:** Dokploy

## Módulos / rutas (Blueprint)

- Consulta `docs/sdd/blueprint.md` para módulos y rutas.

## Capas de arquitectura

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

## Primeras tareas (desde Tasks)

- [ ] [P] Implementar endpoint `GET /api/v1/setup/status` que verifique existencia de superadmin
- [ ] [P] Implementar endpoint `POST /api/v1/setup/init` para crear primer superadmin
- [ ] [P] Implementar guard de bootstrap que verifique que no exista superadmin previamente
- [ ] [P] Crear comando `CreateSuperadminCommand` y su handler
- [ ] [P] Implementar lógica de dominio para validar contraseña con Argon2id

## Resolución de conflictos SDD

El detector encontró posibles contradicciones entre entregables. **Prioriza el MDD** y documenta la decisión en `docs/sdd/PROGRESO.md`.

- TypeORM vs Prisma: prioriza el ORM declarado en MDD §2/Blueprint; no mezcles ambos en el mismo servicio.

## Instrucciones para el agente

1. Si `.cursor/rules/` no existe, **Ejecuta en terminal** `chmod +x scripts/install-agent-governance.sh && ./scripts/install-agent-governance.sh` y verifica la instalación. No pidas al usuario salvo que falle.
2. Lee `AGENTS.md`, `docs/agent-governance/COMO-USAR-GOBERNANZA-IA.md` y el MDD en `docs/sdd/mdd.md`.
3. Implementa siguiendo **Tasks** (`docs/sdd/tasks.md`) y **Blueprint**; actualiza `docs/sdd/PROGRESO.md` al cerrar ítems.
4. Respeta subflujos en `docs/agent-governance/references/workflows.md`.
