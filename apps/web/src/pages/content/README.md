# Contenido (US-010 / US-011)

- `ContentListPage` — `/contents` (filtros, `?campaignId=`)
- `ContentCreatePage` — `/contents/new`
- `ContentEditPage` — `/contents/:id` (editor, imagen IA, historial, aprobación, eliminar borradores)

Componentes: `@/components/content/` — `VersionHistory`, `SignatureBadge`, `ApprovalActions`, `ContentPlatformBadge` (tokens neutros), `ContentVisualPanel`.

API: `@/services/content.ts`
