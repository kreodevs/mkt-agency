# Páginas de agentes IA

| Ruta | Hub |
|------|-----|
| `/agents` | Catálogo con estado e historial por agente |
| `/agents/brand-interview` | Historial + nueva entrevista (selector de producto opcional) |
| `/agents/brand-interview/:id` | Chat + Brand Brief (muestra producto si aplica) |
| `/agents/competitor-intel` | Historial + reporte + nuevo análisis; búsqueda IA de competidores si no hay registros |
| `/agents/image-generator` | Galería + formulario; enruta automáticamente a Video API si el prompt pide video/GIF/reel |
| `/agents/image-generator/:id` | Detalle: video MP4, frames carrusel (imagen), prompt, regenerar |

El catálogo (`AgentListPage`) usa `useAgentHubStats` para mostrar **Ver historial**, **Continuar** o **Iniciar** según ejecuciones previas.

Entrevistas con `brandBriefMarkdown` se tratan como completadas (`getEffectiveInterviewStatus`); el backend reconcilia registros antiguos en `failed` al listar o consultar.
