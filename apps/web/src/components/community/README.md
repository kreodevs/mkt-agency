# Community Manager (UI)

- `CommunityManagerPrerequisites.tsx` — checklist de perfil de empresa para mejorar precisión del copy IA.
- `VisualTemplateGallery.tsx` — vista previa de las 6 plantillas gráficas antes de generar el batch (colores del kit visual del producto).

Preferencias de plataformas, cantidad de posts y `autoWeeklyGenerationEnabled` (cron semanal por tenant, default `false`) se persisten en `tenant.settings.communityManager` vía `PUT /community-manager/preferences`.
