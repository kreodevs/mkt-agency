# Knowledge (RAG ligero)

Memoria por tenant sin pgvector: chunks en PostgreSQL + `tsvector` y embeddings opcionales (OpenRouter) con similitud coseno en aplicación.

## Indexación

| `source_type` | Disparador |
|---------------|------------|
| `brand_brief` | Brand interview completada |
| `approved_content` | Contenido aprobado y firmado |
| `media_kit` | Asset enlazado al kit del producto |

## Consumo

`KnowledgeRetrievalService.formatForPrompt` inyecta fragmentos en CM, Strategist y Creative.
