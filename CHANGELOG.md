# Changelog

## [Unreleased]

## [0.3.0] — 2026-11-02

### Added

- **Pipeline híbrido de composición visual (`art-kit-compose` & `scene-kit-compose`)**:
  - Biblioteca de recetas de prompts MeiGen con selección contextual automática según objetivos del post.
  - Generación de mockups automáticos para Reels, TikTok y Stories usando capturas reales del Media Kit de producto.
  - Enrutamiento inteligente de escenas (`scene-routing` y `visual-intent`) que prioriza vitrinas de pantalla real frente a lienzos en blanco o renders lifestyle abstractos.
  - Herramientas visuales (`visual tools`) expuestas para el generador de copy en redes sociales.
  - Recomposición y regeneración de artes por escena y plantilla (`creative-scene`, `product-hero`, carruseles y talking heads con overlay de marca).
- **Apple Design System**: Implementación completa de principios de diseño fluido (inspirado en WWDC *Designing Fluid Interfaces*).
  - **Elevación con sombras**: eliminada la regla global `box-shadow: none !important`; sistema de 4 niveles de elevación (`--shadow-sm/md/lg/xl`) para codificar jerarquía visual.
  - **Materiales translúcidos**: header y sidebar usan `backdrop-filter: blur() + saturate()` con fondos semitransparentes; el contenido scrollea debajo del chrome.
  - **Scroll edge effect**: gradiente sutil debajo del header fijo en lugar de `border-bottom` sólido.
  - **Pointer-down feedback**: `scale(0.97)` instantáneo (< 80ms) en botones, nav items, sidebar trigger y logout — sensación de "alive" al presionar.
  - **Spring animations**: transiciones de ruta con `<motion.div>` (bounce: 0, response: 0.4s); Dialog con `material-sheet` + enter/exit animations (zoom + slide); mobile menu con spring slide.
  - **Typography size-specific tracking**: display headings `-0.025em`, body `0`, detail-xs `0.02em` — cada tamaño tiene su letter-spacing óptimo.
  - **Rubber-banding**: `overscroll-behavior: contain` en main scroll y KanbanBoard — resistencia suave en límites.
  - **Kanban fluido**: card transitions con `cubic-bezier(0.22, 1, 0.36, 1)`; DragOverlay con spring easing; `press-subtle` en cards.
  - **Componentes animados**: StatusPill, Stepper, Progress y EmptyState con transiciones Apple-like (easing + duration).
  - **Loading spinner**: router fallback con spinner animado en vez de solo texto.
  - **Toast material**: Sonner toasts con `material-sheet` y close button `press-subtle`.
  - **Accesibilidad**: media queries para `prefers-reduced-motion` (cross-fades), `prefers-reduced-transparency` (fondos sólidos), `prefers-contrast` (bordes definidos).
  - **Mobile/iPad optimizado**:
    - **Safe area insets**: `env(safe-area-inset-*)` en header, drawer móvil y footer del dialog — notch/Dynamic Island/home indicator cubiertos.
    - **Viewport fluido**: `h-[100dvh]` reemplaza `h-screen` para evitar overlap con barra del navegador móvil; `viewport-fit=cover` en meta tag.
    - **Dialog como bottom sheet**: en pantallas `< 640px` el dialog se ancla al fondo con `rounded-t`, drag handle visual y swipe-down-to-dismiss (> 80px cierra).
    - **Fluid typography**: `clamp()` en display-xl, display-serif y serif-accent — escala de 2rem a 6rem sin ruptura.
    - **TouchSensor en KanbanBoard**: `delay: 250ms` + `tolerance: 5px` distingue scroll de drag en touch.
    - **Swipe-to-open sidebar**: gesto swipe-right desde borde izquierdo (< 24px) abre el drawer; swipe-left lo cierra.
    - **Materiales mobile-optimized**: `blur(12px)` en mobile vs `blur(20-32px)` en desktop para rendimiento.
    - **Drawer accesible**: `aria-modal`, `role="dialog"`, `aria-label` en mobile sidebar.
- **Generación y segmentación de video**:
  - Segmentación automática para textos que superan el límite del modelo.
  - Concatenación FFmpeg en segundo plano con transiciones crossfade de 0.5s sin alterar audio.
  - Captura y reporte de stderr para diagnósticos visibles de errores FFmpeg en UI.
- **Refactor de arquitectura (Anti-Spaghetti & God-Killer)**:
  - `GenerationContextFacade` (`community-manager/generation-context.facade.ts`): desacopla dependencias inyectadas en CM de 21 a 11.
  - `VideoGenerationService` (`agents/video-generation.service.ts`): separado de `ImageGenerationService`.
  - Descomposición modular de páginas y componentes (`AssetLibraryPage`, `CommunityManagerPage`, `CmCharacterSetupPanel`).
  - Cobertura de caracterización con Jest y scripts de testing.
- **Bandeja de publicación y descarga**:
  - Descarga directa de artes e imágenes generadas desde la bandeja.
  - Compartición por WhatsApp con descarga adjunta del visual.
  - Muestra fechas de creación y actualización de piezas, con ordenamiento por actividad reciente.

### Changed

- Paquetes añadidos: `motion` (v12.42), `tailwindcss-animate` (v1.0.7).
- **Modo copiloto SOHO** (UX por defecto para tenants): menú reducido (Inicio, Mi producto, Ajustes), panel de estado del pipeline en bandeja y botón **Preparar mi semana** / **Preparar día**.
- **API copiloto**: `GET /publication-inbox/copilot-status` y `POST /publication-inbox/prepare-week` (descubre competidores, Competitor Intel, estrategia + CM bajo demanda).
- **Página Ajustes** (`/settings/copilot`): redes sociales, volumen semanal y toggle menú avanzado (`mkt-advanced-nav` en localStorage).
- **CTA Copiar y publicar** en tarjetas de bandeja (modo SOHO); `/contents/:id` sigue disponible para copiar/descargar.
- Redirects en modo SOHO: `/contents`, `/calendar`, `/community`, `/strategy`, `/dashboard` → bandeja.
- **SOHO éxito (Fase A/B)**: «Hoy publicas esto», contactos semanales, regenerar un clic, publicación asistida (copiar/abrir red/WhatsApp), mockup por red, `GET /dashboard/soho-summary`, recordatorio `publish_reminder`, notificaciones navegador.
- **Atribución post → lead**: `GET /forms/capture`, página pública `/c/:formId`, UTM + `contentId` en submit y `lead.metadata`, botón «Link captura» en bandeja, métrica `attributedLeadsThisWeek` en resumen SOHO.
- **Kit de medios por producto**: tabla `product_media_kit_items`, API CRUD en `/products/:id/media-kit`, panel en detalle de producto; el Community Manager compone visuales reales (Ken Burns / video demo) antes de recurrir a IA generativa.
- **Librería multimedia (`/libreria`)**: paginación server-side de **20 activos por página** en vista grid y tabla; selector de carpetas y picker modal coordinado.
- Navegación tenant extraída a `lib/tenant-navigation.ts`; toggle «Modo agencia (avanzado)» en sidebar.
- Sanitización de copy: eliminación automática de indicaciones internas o comentarios de dirección de arte.

### Fixed

- **iPhone / Mockup en blanco**: corregida la selección de escenas y templates en Reels/Stories con kit para evitar teléfonos vacíos sin overlay.
- **Bandeja de publicación**: previene bucles infinitos en snapshot de piezas nuevas y ajusta ordenamiento por fecha de creación descendente.
- **Sincronización de jobs BullMQ**: corrige estado atascado en completed tras concatenación de clips de video.
- **Filtro crossfade FFmpeg**: corrección en sintaxis de filter_complex separando la cadena de audio y video concat.
- **Permisos de impersonación**: permite listado de inquilinos durante impersonación sin requerir token directo de plataforma.
- **Bug introducido en refactor**: `regenerateVisualWithoutFeedback()` referenciaba `content.productId` (variable inexistente) → corregido a `productContext?.id`.

## [0.2.3] — 2026-07-03

### Added

- **Formato visual de contenido** (`visualFormat`: `image` | `video` | `carousel`): el Community Manager asigna el formato por post; el editor de contenido permite cambiarlo sin nueva versión; Image/Video Generator respeta el formato al regenerar desde Contenidos.
- Migración `1730000000031-AddVisualFormatToContents` y utilidades `content-visual-format.util.ts` / `visual-format.ts` en frontend.

### Fixed

- **Video con Wan (OpenRouter)**: al regenerar desde Contenidos, el guion narrable se acorta a ~10s y la duración se limita al rango del modelo (2–10s), evitando el error *Duration 15s is not supported*.
- **Regeneración visual**: ya no dispara Video API por la palabra "video" en el copy; los assets viejos no se acumulan en la UI.
- **Dropdown de modelos LLM en modales Radix**: la lista de modelos se renderiza correctamente dentro de diálogos.

### Changed

- **Generación de video**: simplificado prompt para narración en español (es-MX) con instrucción explícita; removidos arreglos de anglicismos limitados y guardrails de ortografía complejos.
- **Image Generator**: las generaciones desde API se encolan siempre en background (BullMQ).
- Política de duración por modelo de video (`resolveVideoDurationPolicy`): Wan y Veo 3.1 con límites y truncado de guion; Seedance mantiene hasta 15s.

## [0.2.2] — 2026-06-30

### Added

- **Hub de agentes con historial**: `/agents` muestra estado por agente (en progreso, completadas, sin ejecuciones) y botones contextuales — **Ver historial**, **Continuar**, **Último resultado** o **Iniciar** según corresponda (`useAgentHubStats`).
- **Brand Analyst — hub**: historial de entrevistas arriba; **Iniciar entrevista** / continuar abajo. Resultado en markdown con Kreo `MarkdownEditor` (readOnly).
- **Competitor Intel — historial**: listado de análisis con enlace al reporte (`?analysis=id`); formulario de **nuevo análisis** al final.
- **Image Generator — hub**: galería de imágenes arriba; formulario **Generar otra imagen** abajo.
- **Reintento de Brand Brief**: `POST /agents/interviews/:id/retry-brief` y botón en UI cuando la generación falla.

### Fixed

- **Brand Brief tras onboarding completado**: el worker ya no falla con `ConflictException` al actualizar el perfil; usa `mergeFromBrandBrief` en lugar de `updateProfile`.
- **Mensajes de error del worker**: textos legibles vía `formatWorkerErrorMessage` (sin "Conflict Exception" crudo).
- **Recuperación de brief**: si el JSON ya se generó, el reintento finaliza sin volver a llamar al LLM.

### Changed

- Páginas hub de agentes documentadas en `apps/web/src/pages/agents/README.md`.
- Componentes `BrandInterviewHistory` y `CompetitorIntelHistory` en `components/agents/`.

## [0.2.1] — 2026-06-28

### Changed

- **Impersonación ahora con select de usuarios**: Reemplazado el input de UUID por un dropdown que lista los usuarios del tenant seleccionado. El superadmin elige visualmente a quién impersonar.
  - Nuevo endpoint `GET /superadmin/tenants/:id/users` que retorna usuarios de un tenant
  - Método `findByTenantId` en `UserRepositoryPort` + implementación TypeORM
  - Frontend: `ImpersonateTenantModal` ahora usa `useQuery` para cargar usuarios y `<select>` para elegir

## [0.2.0] — 2026-06-28

### Added

- **Competitor Intel agent**: New deep-competitor-analysis agent with async processing
  - `AgentCompetitorAnalysisEntity` (tenant-scoped, JSONB analysis result)
  - `POST /agents/competitor-intel` + `GET /agents/competitor-intel` + `GET /agents/competitor-intel/:id`
  - OpenRouter + Stub adapters for competitive landscape generation
  - New LLM task type `competitor_intel` (configurable via superadmin)
  - Frontend: `/agents/competitor-intel` page with trigger, polling spinner, and report viewer

- **Agent orchestration hub**: `/agents` page now shows multiple agent cards
  - Brand Analyst + Competitor Intel as launchable agents
  - Cards with gradient headers, descriptions, and status badges
  - Ready for future agents (Content Strategist, Market Research)

### Fixed

- **DI error**: `CompanyProfileEntityRepository` not available in `AgentsModule` context — added `TypeOrmModule.forFeature([CompanyProfileEntity])` to resolve NestJS dependency injection for `BrandInterviewWorkerService`

### Changed

- `AGENTS_CATALOG` now supports `AgentCatalogItem[]` with `status` field
- Hub page renders dynamically from catalog entries
- Sidebar "Agentes" → "Brand Analyst" links to hub `/agents`

### Added

- **Agentes IA module**: New `agents/` backend module with tenant-isolated brand interview system
  - `AgentInterviewEntity` + `AgentInterviewMessageEntity` (tenant-scoped, JSONB answers + brand_brief)
  - 4 REST endpoints under `/api/v1/agents/interviews`: list, create, get, submit-answer
  - `TenantGuard` protection on all endpoints — full multi-tenant isolation
  - BullMQ worker (`QUEUE_BRAND_INTERVIEW`) for async Brand Brief generation
  - OpenRouter + Stub adapters (factory pattern — falls back to stub if no LLM provider configured)
  - New LLM task type `brand_interview` (configurable via superadmin Tareas LLM)
  - 6-step conversational interview covering company, industry, audience, brand voice, competitors, objectives
  - Auto-writes Brand Brief fields to Company Profile on completion

- **Hub "🤖 Agentes" in sidebar**: New navigation group under tenant menu with Bot icon
  - `/agents` — Agent hub page showing available agents as cards
  - `/agents/brand-interview` — Landing page with "Iniciar entrevista" CTA
  - `/agents/brand-interview/:id` — Conversational chat UI with real-time polling during processing
  - Scrollable chat with agent/user bubbles, spinner during analysis, Brand Brief JSON preview on completion

### Changed

- `DashboardShell.tsx` — Added "Agentes" navigation group
- `router/index.tsx` — Registered 3 new lazy-loaded routes for agents
- `app.module.ts` — Registered AgentsModule + 2 new TypeORM entities
- `queue.constants.ts` — Added `QUEUE_BRAND_INTERVIEW`
- `llm-task-types.ts` — Added `'brand_interview'` task type
