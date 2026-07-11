# Plan de Reingeniería — Anti-Spaghetti & God-Killer

## Diagnóstico

### Backend — God Services

| Archivo | Líneas | Deps | Condicionales | Culpables |
|---------|--------|------|---------------|-----------|
| `image-generation.service.ts` | 1173 | 11 | 53 | `runVideoGeneration` (111 lns), `runImageGeneration` (95 lns), `concatVideoClips` (80 lns) |
| `community-manager.service.ts` | 748 | **21** | 34 | `generate` (~170 lns), `regeneratePostForContent` (~165 lns) |
| `content.service.ts` | 743 | 8 | 34 | `update` con split metadata-only + version (ramaifredo infernal) |
| `campaign-orchestration.service.ts` | 424 | 14 | — | Orquestación con demasiadas dependencias directas |
| `competitor-discovery-context.util.ts` | 601 | 0 | — | Util-dump: mezcla queries, filtrado, parseo, constantes. Debieran ser 3-4 archivos |

### Frontend — God Components

| Archivo | Líneas | Hooks | Funciones |
|---------|--------|-------|-----------|
| `AssetLibraryPage.tsx` | 726 | 11 | ~14 funciones inline |
| `CommunityManagerPage.tsx` | 688 | 10 | ~6 funciones |
| `CmCharacterSetupPanel.tsx` | 685 | 10 | ~7 funciones |
| `BrandInterviewPage.tsx` | 610 | — | — |

### Patrones Detectados

1. **Método-Dios**: métodos con 100-170 líneas que orquestan todo (generate en CM service)
2. **Inyección Masiva**: CM service con **21 dependencias** — viola ISP
3. **Util-Dump**: archivos de utilidades que crecen sin criterio (competitor-discovery-context.util.ts: 601 lns)
4. **Anidamiento Profundo**: 24+ casos de >2 niveles de indentación en condicionales
5. **Mezcla de Capas**: lógica de dominio, acceso a datos, y orquestación en el mismo método
6. **Componentes Todo-terreno**: páginas React con lógica de selección, upload, preview, drag & drop todo junto

---

## Plan de Acción por Fases

### Fase 1: Extraer Métodos-Dios (Prioridad Crítica)

#### 1.1 `community-manager.service.ts` — Matar el `generate()` (170 lns)

- [ ] Extraer `resolveGenerationContext()`: unifica `loadResolvedProfile`, `resolveProductForGeneration`, `buildBrandBrief`, `resolveCompetitorIntelBrief`, media kit, CM characters, library folders
- [ ] Extraer `savePostsAsContent()`: el loop que itera posts, crea Content y attachVisual — debe ser un método aparte
- [ ] Extraer `handleGenerationError()`: el catch del generate
- [ ] Extraer `refreshCampaignLinkedContent()`: ya existe pero hay que mover la lógica inline a este método
- [ ] Meta: `generate()` debe quedar en ≤40 líneas, solo orquestando llamadas

#### 1.2 `community-manager.service.ts` — `regeneratePostForContent()` (165 lns)

- [ ] Extraer `resolveRegenerationDependencies()`: junta profile, product, competitor intel, media kit
- [ ] Extraer `handlePostRegenerationVisual()`: la lógica condicional de attach visual / regenerate
- [ ] Meta: dejar `regeneratePostForContent()` en ≤50 líneas

#### 1.3 `image-generation.service.ts` — Separar concerns video/image (1173 lns)

- [ ] Crear `VideoGenerationService`: mover `runVideoGeneration`, `runSegmentedVideoGeneration`, `concatVideoClips`, `uploadGeneratedVideo`, `resolveVideoPayload`
- [ ] Crear `ImageGenerationService`: mantener `runImageGeneration`, pero extraer `processImageFrames()` del loop
- [ ] Extraer `resolveGenerationMedia()`: la lógica de detectar si es video o imagen
- [ ] Extraer `recordUsageMetrics()`: el bloque repetido de `recordMediaUsage`
- [ ] Meta: dejar `ImageGenerationService` original en ≤300 líneas

#### 1.4 `content.service.ts` — Separar `update()` en dos caminos

- [ ] Método `updateMetadataOnly()`: cuando solo cambian fechas/formatos
- [ ] Método `updateWithVersion()`: cuando se crea nueva versión
- [ ] Extraer validación de entrada a un DTO validator o guard

### Fase 2: Romper Util-Dumps

#### 2.1 `competitor-discovery-context.util.ts` (601 lns)

- [ ] `competitor-search-queries.ts`: `buildDiscoverySearchQueries`, `buildCompetitorIntentQueries`, `buildKeywordDiscoveryQueries`, helpers privados
- [ ] `competitor-filtering.ts`: `filterIrrelevantCompetitors`, `applyStrictCompetitorFilters`, `applyRelaxedCompetitorFilters`, `dedupeCompetitorResults`, `passesBlockedNameChecks`, `buildBlockedCompetitorNames`
- [ ] `competitor-web-evidence.ts`: `competitorsFromWebEvidence`, `extractWebSearchCandidates`
- [ ] `competitor-context.constants.ts`: INDUSTRY_LABELS, GENERIC_RETAIL_NAMES, RETAIL_INDUSTRY_KEYWORDS
- [ ] `competitor-context.helpers.ts`: `hasMinimalDiscoveryContext`, `isRetailBusiness`, `inferDiscoveryScope`, `formatIndustryLabel`

#### 2.2 `image-generation.utils.ts` (437 lns)

- [ ] Separar en: `video-duration-policy.ts`, `video-narration.utils.ts`, `image-frame.utils.ts`, `generation-error.utils.ts`, `generation-media-type.ts`

### Fase 3: Reducir Dependencias — Aplicar Facade Pattern

#### 3.1 `CommunityManagerService` (21 dependencias)

- [ ] Crear `GenerationContextFacade`: encapsula `ProductService`, `CompanyProfileService`, `CompetitorIntelService`, `CompetitorService`, `ProductMediaKitService`, `AssetFolderService`, `CmCharacterService`
- [ ] El facade expone: `buildGenerationContext(tenantId, dto): GenerationContext`
- [ ] Meta: bajar de 21 a ≤10 dependencias directas

#### 3.2 `CampaignOrchestrationService` (14 dependencias)

- [ ] Aplicar mismo patrón: `CampaignOrchestrationFacade`

### Fase 4: Frontend — Partir God Components

#### 4.1 `AssetLibraryPage.tsx` (726 lns → target 250)

- [ ] Extraer `AssetSelectionBar` (bulk selection logic)
- [ ] Extraer `AssetGrid` con su propia lógica de paginación
- [ ] Extraer `AssetUploadZone` (drag & drop + upload)
- [ ] Extraer `AssetPreviewPane` (preview dialog)
- [ ] La página solo orquesta layout y estado global

#### 4.2 `CommunityManagerPage.tsx` (688 lns → target 250)

- [ ] Extraer `PlatformSelector`
- [ ] Extraer `GenerationResultPanel`
- [ ] Extraer `BatchHistoryList`

#### 4.3 `CmCharacterSetupPanel.tsx` (685 lns → target 250)

- [ ] Extraer `CharacterFormFields`
- [ ] Extraer `CharacterPreviewCard`
- [ ] Extraer `VoiceSelector`
- [ ] Extraer `PlatformAssignmentGrid`

### Fase 5: Desanidar Condicionales

Reglas para todo el codebase:

- [ ] Early return: todo `if` anidado >2 niveles debe convertirse a guard clause
- [ ] Extraer condición a método con nombre semántico: `isGenerationAllowed()` en vez de `if (a && b && !c)`
- [ ] Strategy pattern para cadenas if/else largas >3 ramas
- [ ] Linting rule: `max-depth` en eslint/tsconfig

### Fase 6: Tests de Regresión

- [ ] Para cada servicio refactorizado, verificar que los tests existentes pasen
- [ ] Si no hay tests para el método, crear test de caracterización ANTES de tocar código
- [ ] E2E smoke test después de cada fase

---

## Orden de Ejecución

```
Fase 1.1 → Fase 1.2 → Fase 1.3 → Fase 1.4  (God Methods)
    ↓
Fase 2.1 → Fase 2.2                         (Util Dumps)
    ↓
Fase 3.1 → Fase 3.2                         (Dependencies)
    ↓
Fase 4.1 → Fase 4.2 → Fase 4.3             (Frontend)
    ↓
Fase 5                                       (Deep Nesting)
    ↓
Fase 6                                       (Tests)
```

## Métricas de Éxito

| Métrica | Antes | Después (target) |
|---------|-------|-------------------|
| Métodos >100 líneas | 6+ | 0 |
| Archivos >500 líneas | 6+ | 0 |
| Dependencias en CM Service | 21 | ≤10 |
| Anidamiento >2 niveles | 70+ | <5 |
| AssetLibraryPage.tsx | 726 lns | ≤300 lns |

## Anti-patrones a NO Introducir

- ❌ Extraer por extraer sin criterio (terminar con más archivos diminutos sin cohesión)
- ❌ Over-engineering con patrones innecesarios
- ❌ Refactor sin tests de regresión
- ❌ Renombrar sin actualizar imports en toda la base
- ❌ Mezclar refactor con features nuevas
