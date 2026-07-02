# Migraciones TypeORM

En **desarrollo**, `synchronize: true` crea/actualiza el esquema automáticamente.

En **producción (Docker/Dokploy)**, el contenedor `api` ejecuta migraciones al arrancar vía `scripts/docker-api-entrypoint.sh` (`migration:run:prod`). El worker usa `RUN_MIGRATIONS=false`.

Manual (local o contenedor):

```bash
cd apps/backend
yarn migration:run          # desarrollo (TS + ts-node)
yarn migration:run:prod     # compilado (dist/*.js)
```

## Archivos

| Migración | Tablas |
|-----------|--------|
| `1730000000000-CreateCoreTables.ts` | `tenants`, `users`, `sessions`, `security_events`, `impersonation_logs`, perfiles, campañas, contenidos, `events` |
| `1730000000001-CreateFormsAndCrm.ts` | `forms`, `form_submissions`, `leads`, `lead_interactions` |
| `1730000000002-CreateAssets.ts` | `assets`, `asset_folders`, `asset_tags`, `asset_tag_assignments` |
| `1730000000003-CreateDomains.ts` | `custom_domains`, `dns_verifications` |
| `1730000000004-CreateProposals.ts` | `proposals` |
| `1730000000005-CreateReports.ts` | `reports` |
| `1730000000006-CreateCompetitors.ts` | `competitors`, `competitor_mentions` |
| `1730000000007-CreateAuditLogs.ts` | `audit_logs` |
| `1730000000008-ClearSuperadminTenantId.ts` | Limpia `tenant_id` en filas `is_superadmin` (legacy) |
| `1730000000009-ResetSuperadminLoginLockouts.ts` | Resetea lockout de superadmins tras migración de hash |
| `1730000000010-CreatePackagesAndLlmConfigs.ts` | `packages`, `llm_task_configs`, límites en `tenants` |
| `1730000000011-CreateLlmProviders.ts` | `llm_providers`, FK en `llm_task_configs` |
| `1730000000012-EnsureTenantLimitColumns.ts` | Columnas de límites/paquete en `tenants` legacy + perfiles |
| `1730000000013-DropLegacyPasswordColumn.ts` | Elimina columna legacy `users.password` |
| `1730000000014-CreateAgentStrategyCommunityTables.ts` | `strategy_adjustments`, `community_manager_batches`, `tone_presets`, `agent_interviews`, `agent_interview_messages`, `agent_competitor_analyses`, `agent_image_generations` |
| `1730000000015-CreateTenantPlatformAdmins.ts` | `tenant_platform_admins` — superadmins asignados por tenant (impersonación) |
| `1730000000017-AddBrandBriefMarkdown.ts` | `brand_brief_markdown` en `agent_interviews` |
| `1730000000018-CreateProductsAndCampaignProductScope.ts` | `products`, `campaigns.product_id`, `campaigns.scope` |
| `1730000000019-AddProductIdToContents.ts` | `contents.product_id` |
| `1730000000020-AddProductIdToFormsLeadsAndInterviews.ts` | `product_id` en forms, leads, agent_interviews |
| `1730000000021-AddProductWebsiteUrl.ts` | `products.website_url` |
| `1730000000022-CreateAgencyNotifications.ts` | `agency_notifications` |
| `1730000000023-AddImageGenerationContentLink.ts` | `product_id`, `content_id` en `agent_image_generations` |
| `1730000000024-ResetTenantOperationalData.ts` | **One-shot:** trunca datos operativos; conserva `users`, `tenants`, LLM y paquetes. Omitir: `SKIP_OPERATIONAL_DATA_RESET=true` |
| `1730000000025-AddImageGenerationMetadata.ts` | Columna `metadata` JSONB en `agent_image_generations` (frames de reel/carrusel) |
| `1730000000026-AddVideoGenerationLlmTask.ts` | Tarea LLM `video_generation` (OpenRouter Video API, default `bytedance/seedance-2.0-fast`) |

Si existe una tabla legacy `products` sin `tenant_id`, la migración 0018 la renombra a `products_legacy` antes de crear el catálogo tenant-scoped.

## Reset de datos operativos (pruebas desde cero)

Migración **`1730000000024-ResetTenantOperationalData`**: al desplegar con `RUN_MIGRATIONS=true` (default en Docker/Dokploy), vacía onboarding, productos, campañas, contenido, agentes, CRM, reportes, etc. **No** borra usuarios ni tenants.

```bash
# Local (sin Docker)
./scripts/reset-tenant-operational-data.sh

# Omitir en un deploy concreto
SKIP_OPERATIONAL_DATA_RESET=true
```

DataSource: `src/database/data-source.ts`.

La migración `1730000000000` es la **baseline** para despliegues sin `synchronize`.
