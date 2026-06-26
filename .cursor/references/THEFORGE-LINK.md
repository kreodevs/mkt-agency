# Enlace The Forge

Este handoff está vinculado a un proyecto The Forge. Usa el MCP server con tu **Secret MCP** (M2M).

## Identificadores

| Campo | Valor |
| --- | --- |
| projectId | `<projectId>` |
| stageId | `<stageId>` |

## Herramientas MCP relevantes

- `report_documentation_gap` — reporta cuando la documentación SDD es incorrecta/incompleta (actualiza el MDD y regenera artefactos afectados)
- `get_agent_session_log` — timeline de gaps y reconciliaciones
- `get_change_log` — bitácora de cambios en documentos

## Configuración

Copia `docs/agent-governance/mcp.json.example` → `.cursor/mcp.json` y sustituye `{{API_URL}}` y `{{MCP_M2M_SECRET}}`.
Obtén el secret en The Forge → Perfil → Secret MCP.
