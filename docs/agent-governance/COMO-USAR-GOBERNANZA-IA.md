# Cómo usar la gobernanza de agentes IA

## 1. Qué es este paquete

Este directorio es un **scaffold ejecutable** generado por **TheForge** como entregable `agent_governance`, derivado del MDD del proyecto. Contiene reglas, skills y referencias para que agentes de código implementen el repositorio con el stack y dominio acordados.

Los archivos están en **`docs/agent-governance/`** (visible al extraer el ZIP). En el repo destino se instalan en **`.cursor/`** — ver **`INSTALACION.md`** en esta carpeta.

## 2. Instalación

1. Copia el contenido del ZIP a la **raíz del repositorio destino**.
2. Lee **`INSTALACION.md`** (esta carpeta) y ejecuta el script o la tabla de mapeo.
3. `AGENTS.md` y `CLAUDE.md` permanecen en la raíz; rules/skills van a `.cursor/`.

Árbol en el ZIP (sin carpetas ocultas):

```
AGENTS.md
CLAUDE.md
PROMPT-INICIAL.md
docs/agent-governance/
├── COMO-USAR-GOBERNANZA-IA.md
├── INSTALACION.md
├── agent-onboarding.md
├── rules/
├── skills/
├── references/
└── mcp.json.example
scripts/install-agent-governance.sh
MANIFEST.json
```

## 3. Artefactos

| Artefacto | Función |
|-----------|--------|
| `AGENTS.md` | Punto de entrada cross-tool; incluye tabla de instalación |
| `CLAUDE.md` | Shim que delega en `AGENTS.md` (`@AGENTS.md`) |
| `PROMPT-INICIAL.md` | Prompt paste-ready sesión 0 (Cursor, Claude Code, Copilot) |
| `docs/agent-governance/references/AGENT-PROMPT.md` | Contexto interno del proyecto (→ `.cursor/references/`) |
| `docs/agent-governance/rules/*.mdc` | Política (se copia a `.cursor/rules/`) |
| `docs/agent-governance/skills/*/SKILL.md` | Guías de dominio (→ `.cursor/skills/`) |
| `docs/agent-governance/references/` | Workflows, handoff, mantenimiento (→ `.cursor/references/`) |
| `docs/agent-governance/mcp.json.example` | Plantilla MCP (→ `.cursor/mcp.json`) |
| `MANIFEST.json` | Índice, `installMap` y `templateVersion` |

## 4. Orden de lectura recomendado

1. Este archivo
2. `INSTALACION.md`
3. `AGENTS.md` (raíz)
4. `agent-onboarding.md`
5. Rules con `alwaysApply: true` (tras instalar en `.cursor/rules/`)
6. MDD y Blueprint del proyecto

## 5. Subflujos y cuándo cargar qué

- **Feature:** `AGENTS.md` → rule de stack → skill de dominio → `references/workflows.md`
- **Debug:** rule de stack + workflows (Debug)
- **Refactor (MEDIUM+):** skill MCP/arquitectura si el MDD lo declara
- **Consumo docs TheForge:** sección 7

## 6. Mantenimiento

- Regenera desde TheForge Workshop tras cambios en el MDD.
- Nuevas rules/skills: `references/CURSOR_SKILLS_Y_RULES.md`.
- Handoff: `references/PROMPT_HANDOFF_AGENTE.md`.

## 7. Consumo de documentación TheForge

Consulta **`references/THEFORGE-DOC-CONSUMPTION-GUIDE.md`** (incluida en este paquete bajo `docs/agent-governance/references/`).
## 8. Por qué se incluyeron estos skills/rules

Sugerencias del **detector TheForge** según MDD, Blueprint, complejidad y patrones wizard.

**Arquetipos:** nestjs-react-monorepo, design-system-ui, auth-jwt, kubernetes, mcp-enabled

| Artefacto | Tipo | Propósito | Señal |
|-----------|------|-----------|-------|
| `docs/agent-governance/rules/git-commits.mdc` | rule | Convenciones de commits y git safety | strong |
| `docs/agent-governance/rules/stack-backend.mdc` | rule | Stack backend: lint, typecheck, tests y convenciones | strong |
| `docs/agent-governance/rules/stack-frontend.mdc` | rule | Stack frontend: componentes, tokens y gates | strong |
| `docs/agent-governance/rules/api-contracts.mdc` | rule | Contratos API, validación y OpenAPI | strong |
| `docs/agent-governance/rules/orchestrator.mdc` | rule | Roles PM → Dev → QA → Reviewer y subflujos | weak |
| `docs/agent-governance/rules/security-auth.mdc` | rule | Autenticación, autorización y secretos | strong |
| `docs/agent-governance/rules/architecture-patterns.mdc` | rule | Patrones wizard: Hexagonal, CQRS, DDD, etc. | weak |
| `docs/agent-governance/rules/mcp-governance.mdc` | rule | Uso de servidores MCP declarados en §1 | strong |
| `docs/agent-governance/skills/frontend/SKILL.md` | skill | Skill de dominio del paquete o módulo principal | strong |
| `docs/agent-governance/skills/design-system-ui/SKILL.md` | skill | Design system / paquete UI compartido | strong |
| `docs/agent-governance/skills/deploy-kubernetes/SKILL.md` | skill | Despliegue Kubernetes / Helm según MDD §7 | strong |
| `docs/agent-governance/skills/monorepo-packages/SKILL.md` | skill | Trabajo en monorepo multi-paquete | strong |

**Notas del detector:**

- Arquetipos detectados: nestjs-react-monorepo, design-system-ui, auth-jwt, kubernetes, mcp-enabled.
- Stack inferido: NestJS, React, Dokploy.
- Rule `git-commits`: Convenciones de commits y git safety (señal fuerte, min LOW).
- Rule `stack-backend`: Stack backend: lint, typecheck, tests y convenciones (señal fuerte, min LOW).
- Rule `stack-frontend`: Stack frontend: componentes, tokens y gates (señal fuerte, min LOW).
- Rule `api-contracts`: Contratos API, validación y OpenAPI (señal fuerte, min MEDIUM).
- Rule `orchestrator`: Roles PM → Dev → QA → Reviewer y subflujos (señal moderada, min MEDIUM).
- Rule `security-auth`: Autenticación, autorización y secretos (señal fuerte, min MEDIUM).

