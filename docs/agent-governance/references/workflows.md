# Workflows de agente

Cada subflujo: **trigger** → **roles** → **gates** → **archivos a cargar**.

## Feature

- **Trigger:** nueva funcionalidad o ticket de producto
- **Roles:** PM (alcance) → Dev → QA → Reviewer
- **Gates:** lint, typecheck, tests del paquete tocado
- **Cargar:** `AGENTS.md`, rules de stack, skill de dominio

## Debug

- **Trigger:** bug, regresión, fallo de CI
- **Roles:** Dev → QA
- **Gates:** reproducir + test que falle en rojo antes del fix
- **Cargar:** rules de stack, `workflows.md`

## Consumo docs TheForge

- **Trigger:** implementar desde entregables SDD
- **Cargar:** MDD, Blueprint, `docs/agent-governance/references/THEFORGE-DOC-CONSUMPTION-GUIDE.md`

## Refactor

- **Trigger:** refactor con impacto multi-archivo
- **Gates:** análisis de impacto; MCP de grafo si el MDD lo declara
- **Cargar:** skill MCP/arquitectura si aplica

## PR / Review

- **Trigger:** abrir o revisar pull request
- **Gates:** diff acotado, convenciones del repo

## Auditoría de módulo

- **Trigger:** revisión completa de un módulo o paquete
- **Gates:** lint + typecheck + tests en verde

## Publicación de paquete

- **Trigger:** solo con petición explícita que nombre el paquete
- **Gates:** QA humano + checklist de release del proyecto

## Doc gap sync (The Forge MCP)

- **Trigger:** el código implementado contradice MDD, Blueprint, Tasks u otro SDD
- **Roles:** Dev implementador
- **Gates:** evidencia con referencia (§, T-, `docs/sdd/`, `tasks.md`); descripción ≥40 chars
- **Acción:** MCP `report_documentation_gap` → reconciliación parcial auto-aplicada (el MDD se parchea siempre primero)
- **Cargar:** `.theforge-project.json`, `docs/agent-governance/references/THEFORGE-LINK.md`, skill `theforge-doc-sync`

