# Páginas de agentes IA

| Ruta | Hub |
|------|-----|
| `/agents` | Catálogo con estado e historial por agente |
| `/agents/brand-interview` | Historial + nueva entrevista |
| `/agents/brand-interview/:id` | Chat + Brand Brief |
| `/agents/competitor-intel` | Historial + reporte + nuevo análisis; búsqueda IA de competidores si no hay registros |
| `/agents/image-generator` | Galería + formulario de generación |

El catálogo (`AgentListPage`) usa `useAgentHubStats` para mostrar **Ver historial**, **Continuar** o **Iniciar** según ejecuciones previas.

Entrevistas con `brandBriefMarkdown` se tratan como completadas (`getEffectiveInterviewStatus`); el backend reconcilia registros antiguos en `failed` al listar o consultar.
