# 🚀 Plan de Mejoras: Noviembre 2026 — Mkt Agency OS
**Objetivo Estratégico:** Consolidar a Mkt Agency OS como la plataforma de referencia para agencias de marketing autónomas y dueños de negocio (SOHO), transformando el contenido generado por IA en activos de conversión respaldados por investigación estratégica profunda y un bucle cerrado de aprendizaje autónomo.

---

## 🗺️ Mapa de Ruta por Sprints

```mermaid
timeline
    title Hoja de Ruta — Noviembre 2026
    section Sprint 1 (Nov 03 - 09) : Inteligencia SOHO : Cápsula Estratégica en Cards : Radar Semanal de Oportunidad : Pivot de 1-Click por Ángulo
    section Sprint 2 (Nov 10 - 16) : Motor de Viralidad : 50 Scroll-Stoppers : Marcos PAS & BAB : Transición a SEO Semántico
    section Sprint 3 (Nov 17 - 23) : UX Canónica : Unificar /calendar : Unificar /strategy : Spotlight Tour en Growth
    section Sprint 4 (Nov 24 - 30) : Agencia Cerrada : Feedback Loop de Leads : Recalibración Estratégica : Brand QA Agent
```

---

## 📅 Sprint 1 (Semana 1: Nov 03 – 09): Democratización Estratégica en Modo SOHO

> **Meta del Sprint:** Que el usuario SOHO comprenda inmediatamente el valor táctico de cada publicación y tenga control ágil sobre el ángulo de venta sin aumentar su carga cognitiva.

### Tareas de Backend
- [x] **Task 1.1 — Expansión del Schema de Social Copy**:
  - Modificar `social-copy-prompt-builder.util.ts` y el puerto `SocialCopyPost` para estructurar 3 nuevos metadatos por post:
    - `targetPainPoint`: dolor humano que ataca el post (ej: *"Frustración por demoras en facturación"*).
    - `strategicAngle`: ángulo de diferenciación competitiva (ej: *"Contraste: setup en 3 min vs 48h de la competencia"*).
    - `persuasionFramework`: marco psicológico (`PAS` | `BAB` | `SocialProof` | `Contrarian` | `FOMO`).
- [x] **Task 1.2 — Exposición en Entidades y DTOs de Contenido**:
  - Persistir estos 3 campos en `ContentEntity.metadata` o columnas de diseño visual, garantizando su disponibilidad en el endpoint `GET /publication-inbox`.
- [x] **Task 1.3 — Endpoint de Regeneración por Ángulo**:
  - Crear endpoint `POST /publication-inbox/pivot-angle/:contentId` que reciba `{ angleType: 'social_proof' | 'pain_agitation' | 'offer_urgency' | 'contrarian' }` y regenere el copy preservando el media kit y la identidad visual.

### Tareas de Frontend
- [x] **Task 1.4 — Componente `InboxStrategicCapsule.tsx`**:
  - Diseñar una píldora colapsable con microinteracción dentro de `InboxItemCard.tsx`:
    - Etiqueta: `💡 Por qué vende este post`.
    - Al desplegar: muestra el dolor, la ventaja contra la competencia y la fórmula de persuasión.
- [x] **Task 1.5 — Banner `WeeklyRadarBanner.tsx`**:
  - Incorporar en el encabezado de `PublicationInboxPage.tsx` un resumen ejecutivo translúcido (*Apple blur material*) con los descubrimientos de `CompetitorIntel` de la semana.
- [x] **Task 1.6 — Popover de 1-Click Angle Pivot**:
  - Al hacer clic en *"Probar otro enfoque"*, desplegar menú rápido con 3 botones directos para cambiar la tesis comercial del post en un clic.

---

## 📅 Sprint 2 (Semana 2: Nov 10 – 16): Motor Creativo de Alto Rendimiento & Viralidad (COMPLETADO)

> **Meta del Sprint:** Elevar la calidad del copy y del arte para detener el scroll en los primeros 3 segundos, eliminando cualquier tono pasivo o corporativo.

### Tareas de Backend
- [x] **Task 2.1 — Biblioteca de Hooks & Scroll-Stoppers**:
  - Crear `social-copy-hooks.constants.ts` con 50 fórmulas probadas de detención de pulgar (*pattern interrupts*, contrastes radicales, confesiones de industria, estadísticas chocantes).
  - Integrar la selección aleatoria ponderada de hooks en `buildPrompts()`.
- [x] **Task 2.2 — Inyección de Marcos Psicológicos de Respuesta Directa**:
  - Modificar el System Prompt para forzar la estructura de los copys según el marco asignado:
    - **PAS (Problem - Agitation - Solution)**: Ideal para B2B y SaaS.
    - **BAB (Before - After - Bridge)**: Ideal para estética, salud y coaching.
    - **Contrarian Truth**: Ideal para marcas personales y liderazgo de opinión en LinkedIn.
- [x] **Task 2.3 — Optimización Algorítmica 2026 (SEO Semántico)**:
  - Reducir el peso de las nubes de hashtags genéricos (máximo 1 a 3 hiper-específicos).
  - Instruir al LLM a tejer palabras clave de búsqueda natural en las primeras dos líneas del copy (formato indexable por los motores de búsqueda de TikTok e Instagram).
- [x] **Task 2.4 — Nuevas Recetas MeiGen en `art-prompt-recipes.data.ts`**:
  - Añadir recetas con sellos de prueba social y badges de confianza (*"Rated 4.9/5"*, *"Certificado oficial"*), compatibles con superposición de capturas reales: `social-proof-badge-060` y `before-after-split-065`.

---

## 📅 Sprint 3 (Semana 3: Nov 17 – 23): Refinamiento UX/UI & Navegación Canónica (COMPLETADO)

> **Meta del Sprint:** Eliminar la duplicidad de pantallas en el modo agencia (Growth), optimizar la curva de aprendizaje y elevar la ergonomía de la interfaz.

### Tareas de Frontend
- [x] **Task 3.1 — Unificación de Calendarios (`/calendar` vs `/calendario`)**:
  - Consolidar en una sola ruta `/calendar` con selector superior tipo segmented-control:
    - Vista *Foco Copiloto* (vista estilo SOHO con foco diario y leyenda verde/amarillo/rojo).
    - Vista *Editorial Completo* (vista de cuadrícula clásica, filtros de producto y kits).
  - `/calendario` redirige limpiamente a `/calendar` en `router/index.tsx`.
- [x] **Task 3.2 — Unificación de Estrategia (`/strategy` vs `/agency/strategy`)**:
  - Crear una única ruta `/strategy` con tabs:
    - Tab *Planes Comerciales*: mesa de trabajo de planes, hipótesis y briefs creativos para aprobación.
    - Tab *Diagnóstico & Ajustes*: salud de canales y recomendaciones tácticas.
  - `/agency/strategy` redirige limpiamente a `/strategy` en `router/index.tsx`.
- [x] **Task 3.3 — Spotlight Tour para el Modo Growth**:
  - Implementado `GrowthSpotlightTour.tsx` en `DashboardShell`: micro-tour de 3 pasos que orienta al usuario al cambiar por primera vez a perfil agencia:
    1. La mesa de estrategia comercial (`/strategy`).
    2. La actividad y eventos entre agentes en tiempo real (`/agency/activity`).
    3. El generador de pauta y kits de medios (`/products/:id/media-kit`).
- [x] **Task 3.4 — Auditoría de Contraste y Accesibilidad**:
  - Ajustados `--color-slate-light` (`#444340`) y `--color-slate-subtle` (`#4f4e4a`) en `vars.css`, garantizando ratio de contraste > 8.0:1 (cumplimiento estricto WCAG AAA en textos pequeños y badges).

---

## 📅 Sprint 4 (Semana 4: Nov 24 – 30): Harness de Agencia Desatendida & Closed-Loop (COMPLETADO)

> **Meta del Sprint:** Cerrar el bucle de retroalimentación para que la agencia aprenda qué contenidos convierten y optimice de forma autónoma las futuras tandas.

### Tareas de Arquitectura & Agentes
- [x] **Task 4.1 — Telemetría de Leads Atribuidos al Contenido**:
  - Implementados `getContentConversionMetrics` y `getTopConvertingFrameworks` en `AnalyticsAgentService` agrupando por `contentId` y `persuasionFramework`.
  - Captura y atribución en formularios públicos integrada con metadatos de leads.
- [x] **Task 4.2 — Recalibración Autónoma Semanal (Closed-Loop)**:
  - Implementado `recalibrateWeeklyStrategy` en `StrategistAgentService`:
    - Evalúa la tasa de conversión quincenal por marco persuasivo.
    - Emite evento `StrategyRecalibrated` hacia el `AgentRole.COMMUNITY`.
    - Alimenta las directrices de `intelSummary` en `CopilotService`.
- [x] **Task 4.3 — Agente de Control de Calidad (Brand QA Agent)**:
  - Creado `brand-qa.util.ts` con auditoría automática de políticas de pauta/redes, detección y erradicación de términos prohibidos, eliminación de saludos pasivos y protección de titulares visuales y hashtags.
  - Integrado en `CommunityManagerService.saveSinglePost` previo al guardado en base de datos.
- [x] **Task 4.4 — Medición de Tokens y Facturación por Tenant**:
  - `LlmUsageService` extendido con cálculo de margen comercial de reventa (`markupPercent`) e importes facturables al cliente (`billedAmountUsd`).
  - `LlmUsageDashboardPage.tsx` renovado con selector dinámico de margen (+0%, +20%, +30%, +50%, +100%), tarjetas KPI de facturación proyectada y badges de límite de gasto.

---

## 📊 Matriz de Métricas de Éxito (KPIs de Noviembre)

| Dimensión | Métrica Actual (Línea Base) | Meta Noviembre 2026 | Método de Medición |
| :--- | :---: | :---: | :--- |
| **Retención SOHO** | 68% retención semanal | **> 85%** | Usuarios que publican al menos 2 veces/sem |
| **Tiempo de Publicación** | 4.2 min por post | **< 60 seg** | Trazabilidad desde apertura hasta copia/share |
| **Tasa de Aprobación** | 71% aprueba sin cambios | **> 88%** | Ratio de posts aprobados vs. rechazados |
| **Conversión de Leads** | 1.8% en formularios `/c/:id` | **> 3.2%** | Leads generados por cada 100 visitas al formulario |
| **Estabilidad del Harness** | 99.1% uptime en jobs | **99.9%** | BullMQ retry rates y Circuit Breaker telemetry |

