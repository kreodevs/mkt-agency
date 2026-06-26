# Instalación de gobernanza IA en el repo destino

Este paquete TheForge entrega reglas, skills y referencias bajo **`docs/agent-governance/`** (visible en Finder y al extraer el ZIP). En el repo destino deben vivir en **`.cursor/`** para que Cursor y herramientas compatibles las carguen automáticamente.

## Orden de instalación recomendado

1. **Spec-kit en raíz** — Descomprime `.specify/` y `specs/001-mkt-agency-os/` (constitution, spec, plan, tasks).
2. **Gobernanza IA** — Instala `docs/agent-governance/` → `.cursor/` (opciones A/B/C abajo).
3. **Verificar espejos** — Confirma que `docs/sdd/*` refleja los mismos entregables (no es SSOT alternativo).

### Mapeo spec-kit ↔ docs/sdd

| Documento | Primario (spec-kit) | Espejo (gobernanza) |
|-----------|---------------------|---------------------|
| Constitución (MDD) | `.specify/memory/constitution.md` | `docs/sdd/mdd.md` |
| Spec | `specs/001-mkt-agency-os/spec.md` | `docs/sdd/spec.md` |
| Blueprint / Plan | `specs/001-mkt-agency-os/plan.md` | `docs/sdd/blueprint.md` |
| Tasks | `specs/001-mkt-agency-os/tasks.md` | `docs/sdd/tasks.md` |

## Opción A — Script (recomendado)

Desde la raíz del repo destino (tras copiar el ZIP):

```bash
chmod +x scripts/install-agent-governance.sh
./scripts/install-agent-governance.sh
```

## Opción B — Copia manual

| Archivo en ZIP | Destino en repo destino |
|----------------|-------------------------|
| `docs/agent-governance/rules/*.mdc` | `.cursor/rules/*.mdc` |
| `docs/agent-governance/skills/*/SKILL.md` | `.cursor/skills/*/SKILL.md` |
| `docs/agent-governance/references/*` | `.cursor/references/*` |
| `docs/agent-governance/agents/*` | `.cursor/agents/*` |
| `docs/agent-governance/commands/*` | `.cursor/commands/*` |
| `docs/agent-governance/mcp.json.example` | `.cursor/mcp.json` |

Crea las carpetas si no existen: `.cursor/rules/`, `.cursor/skills/`, `.cursor/references/`, `.cursor/agents/`, `.cursor/commands/`.

## Opción C — One-liner

```bash
mkdir -p .cursor/{rules,skills,references,agents,commands} && \
cp docs/agent-governance/rules/*.mdc .cursor/rules/ 2>/dev/null; \
cp -R docs/agent-governance/skills/* .cursor/skills/ 2>/dev/null; \
cp docs/agent-governance/references/* .cursor/references/ 2>/dev/null; \
cp -R docs/agent-governance/agents/* .cursor/agents/ 2>/dev/null; \
cp -R docs/agent-governance/commands/* .cursor/commands/ 2>/dev/null; \
cp docs/agent-governance/mcp.json.example .cursor/mcp.json 2>/dev/null
```

## Verificación

- `AGENTS.md` y `CLAUDE.md` quedan en la **raíz** del repo (no se mueven).
- Abre el proyecto en Cursor y confirma que aparecen rules/skills en configuración.
- Consulta `MANIFEST.json` → `installMap` para el mapeo exacto de este paquete.
