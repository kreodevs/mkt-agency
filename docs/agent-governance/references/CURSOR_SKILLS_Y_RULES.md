# Skills y reglas de Cursor en este proyecto

Guía para **añadir o mantener** Agent Skills y Cursor Rules.

## Dónde vive cada cosa

| Artefacto | Ruta en repo (tras instalar) | Fuente en ZIP |
|-----------|------------------------------|---------------|
| Entrada agente | `AGENTS.md` | raíz del ZIP |
| Skills | `.cursor/skills/<nombre>/SKILL.md` | `docs/agent-governance/skills/` |
| Reglas | `.cursor/rules/<nombre>.mdc` | `docs/agent-governance/rules/` |
| Referencias | `.cursor/references/` | `docs/agent-governance/references/` |

## Checklist al añadir o cambiar

1. Skill nueva: `.cursor/skills/<name>/SKILL.md` con frontmatter `name` y `description`.
2. Regla nueva: `.cursor/rules/<name>.mdc` con `description` y `globs` o `alwaysApply`.
3. Actualiza `AGENTS.md` si cambia el mapa global.
4. Documenta el subflujo en `workflows.md`.
