# Páginas de agentes IA

Tokens Kreo (`--accent`, `--warning`, `--radius-md`); sin gradientes violet/amber hardcoded.

| Ruta | Hub |
|------|-----|
| `/agents` | Catálogo con estado e historial por agente |
| `/agents/brand-interview` | Historial + onboarding inline (URL → inferencia) o Brand Brief si el producto ya está listo |
| `/agents/brand-interview/:id` | Resultado / generación del Brand Brief (onboarding o entrevista legacy) |
| `/agents/competitor-intel` | Historial + reporte + nuevo análisis; búsqueda IA de competidores si no hay registros |
| `/agents/image-generator` | Galería + formulario; destino por red (Instagram, Facebook, etc.) en lugar de píxeles; enruta a Video API si el prompt pide video/GIF/reel |
| `/agents/image-generator/:id` | Detalle: video MP4, frames carrusel (imagen) con zoom, prompt, regenerar (cola async + polling) |

El catálogo (`AgentListPage`) usa `useAgentHubStats` para mostrar **Ver historial**, **Continuar** o **Iniciar** según ejecuciones previas.

Entrevistas con `brandBriefMarkdown` se tratan como completadas (`getEffectiveInterviewStatus`); el backend reconcilia registros antiguos en `failed` al listar o consultar.
