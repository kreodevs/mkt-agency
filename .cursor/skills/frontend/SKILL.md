---
name: frontend
description: Trabajo en frontend según MDD/Blueprint.
---

# Skill: frontend

## Cuándo cargar

- Edición o depuración en `frontend` o rutas relacionadas.
- Feature o bug en rutas citadas en Blueprint.

## Checklist

1. Lee `AGENTS.md` y rules de stack.
2. Confirma gates (lint, typecheck, tests) del paquete.
3. Respeta contratos API y auth del MDD.

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
