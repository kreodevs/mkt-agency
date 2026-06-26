# Guía de consumo de documentos TheForge

Resumen para agentes que implementan desde entregables SDD incluidos en este ZIP.

## Orden de lectura (primario spec-kit, espejo docs/sdd)

1. **`.specify/memory/constitution.md`** — Constitución (MDD); espejo: `docs/sdd/mdd.md`.
2. **`specs/001-mkt-agency-os/plan.md`** — Blueprint / plan técnico; espejo: `docs/sdd/blueprint.md`.
3. **`specs/001-mkt-agency-os/spec.md`** — Requisitos y criterios de aceptación; espejo: `docs/sdd/spec.md`.
4. **`specs/001-mkt-agency-os/tasks.md`** — Checklist de implementación; espejo: `docs/sdd/tasks.md`.
5. Entregables opcionales en `specs/001-mkt-agency-os/` o `docs/sdd/`: contratos, logic-flows, architecture, infra.

### Mapeo de rutas

| Documento | Primario (spec-kit) | Espejo (gobernanza) |
|-----------|---------------------|---------------------|
| Constitución (MDD) | `.specify/memory/constitution.md` | `docs/sdd/mdd.md` |
| Spec | `specs/001-mkt-agency-os/spec.md` | `docs/sdd/spec.md` |
| Blueprint / Plan | `specs/001-mkt-agency-os/plan.md` | `docs/sdd/blueprint.md` |
| Tasks | `specs/001-mkt-agency-os/tasks.md` | `docs/sdd/tasks.md` |

**El layout spec-kit es canónico.** Los archivos bajo `docs/sdd/` son espejo para rules/skills de gobernanza; ante conflicto de contenido, gana el primario.

## Prioridad ante conflictos

**El MDD manda.** Si un entregable contradice otro, sigue MDD §2–§6 y documenta la resolución en `docs/sdd/PROGRESO.md`.

## Gates antes de cerrar tareas

- Lint, typecheck y tests del paquete tocado.
- Contratos API alineados a `specs/001-mkt-agency-os/contracts/` o `docs/sdd/api-contracts.md` cuando exista.
- Actualizar `docs/sdd/PROGRESO.md` al completar ítems de Tasks.
