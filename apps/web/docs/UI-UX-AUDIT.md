# Auditoría UI/UX — Mkt Agency OS

**Fecha:** 2026-09-10  
**Alcance:** `apps/web` — design system Kreo vendored + pantallas de producto  
**Objetivo:** Evaluar madurez industrial, coherencia visual y potencial “wow” memorable.

---

## Resumen ejecutivo

| Dimensión | Nota | Estado |
|-----------|------|--------|
| Arquitectura de componentes | 8/10 | Sólida — capas atoms/molecules/organisms + dominio |
| Sistema visual (tokens) | 8/10 | Ivory & Slate + terracota SOHO bien aplicados |
| Motion & micro-interacciones | 7/10 | Mejorado con Kreo v5.5 (spring, Reveal, tactile) |
| Accesibilidad | 7/10 | focus-visible, reduced-motion, safe-area iOS |
| Consistencia cross-pantalla | 6/10 | PrimeReact DataTable vs Kreo — deuda pendiente |
| Experiencia memorable | 7/10 | Auth/login y headers mejorados; falta wow en IA |

**Veredicto:** La base es de **grado industrial** para un SaaS B2B. Tras esta actualización Kreo v5.5, la app está más cerca de una experiencia premium memorable. Quedan 3 frentes prioritarios para el “wow” sostenido.

---

## 1. Arquitectura y organización

### Fortalezas

- **Separación clara:** 24 componentes Kreo en capas atómicas + ~100 componentes de dominio (`publication-inbox`, `products`, `agents`…).
- **Shells bien definidos:** `DashboardShell` → `AppLayout` → `SidebarModern` con guards de routing.
- **Tokens centralizados:** `theme/vars.css` importado al inicio de `index.css` (correcto según Kreo).
- **Navegación por persona:** `tenant-navigation.ts` con rutas SOHO vs superadmin.

### Oportunidades

| Issue | Impacto | Recomendación |
|-------|---------|---------------|
| Sin paquete `packages/ui` compartido | Medio | Extraer DS cuando haya segunda app |
| Capa `templates/` vacía | Bajo | Usar recetas Kreo (`CrudTableFilters`) en listados admin |
| ~38 archivos con spacing Tailwind hardcoded | Medio | Migrar gradualmente a `--spacing-*` / `h-control-*` |

---

## 2. Identidad visual

### Implementación actual (correcta)

- **Preset custom:** Anthropic Ivory & Slate + terracota `#c2410c` — no es preset Kreo registry, pero es coherente.
- **Tipografía dual:** Sans para UI, Serif para descripciones (`PageHeader`, `AuthShell`).
- **Materiales Apple-inspired:** `.material-header`, `.material-sidebar`, scroll edge, rubber-band.
- **PWA alineada:** `theme_color` y `background_color` corregidos a terracota/ivory.

### Desalineación con SDD legacy

`docs/sdd/ux-ui-guide.md` describe paleta AgenteIA (azul `#1B3A5C`, Inter). El código usa Anthropic + terracota. **Priorizar el código activo**; actualizar SDD en próximo ciclo de gobernanza.

---

## 3. Motion system (actualización Kreo v5.5)

### Añadido en esta iteración

| Token / utilidad | Uso |
|------------------|-----|
| `--ease-spring-*`, `--press-fast`, `--stagger-step` | Curvas físicas Kreo |
| `.kreo-floating-field`, `.kreo-floating-label` | Inputs con label flotante |
| `.kreo-focus-ring` | Anillo compartido en formularios |
| `.kreo-underline-draw` | Links con underline animado |
| `animate-kreo-*` | Reveal scroll (fade-up, zoom-in, blur-in…) |
| `animate-kreo-shimmer` | Skeletons premium |

### Componentes nuevos/actualizados

- `Button` — variante `tactile` (depress 3D), `asChild`, link con underline draw
- `InputText` — `floatingLabel`, shake en error
- `Reveal` / `StaggerGroup` — entradas escalonadas
- `FocusRingGroup` — foco spring entre campos
- `Loader` — spinner | orb IA | skeleton
- `Skeleton` — pulse + shimmer
- `ThinkingOrb` — 9 estados para agentes IA
- `PageHeader` — reveal escalonado por bloque
- `PageSkeleton` — shimmer en lugar de pulse plano
- `LoginPage` — floating label + tactile CTA + focus ring

### Ya existía (mantener)

- `AppLayout` con `motion/react` para transiciones de página y drawer móvil
- `.pressable`, `.press-subtle` para feedback táctil
- `prefers-reduced-motion` global

---

## 4. Experiencia “wow” memorable

### Momentos que ya destacan

1. **Transición de rutas** — spring suave en `AppLayout` (no flash blanco).
2. **Sidebar material** — blur + translucencia en header/sidebar.
3. **Hero gradient** — radial terracota sutil en main content.
4. **Login** — floating label + botón tactile + focus ring compartido.

### Momentos pendientes de wow

| Pantalla | Gap | Acción sugerida |
|----------|-----|-----------------|
| Agentes IA / Copilot | Sin ThinkingOrb visible | `Loader variant="orb"` en generación |
| Bandeja SOHO (home) | Lista densa, poco motion | `StaggerGroup` en `InboxItemCard` |
| Onboarding wizard | Stepper estático | Stepper con spring + Reveal por paso |
| Empty states | Funcionales | Ilustración + CTA tactile |
| CTAs primarios globales | Mix brand/tactile/default | Guía: `tactile` en acciones irreversibles/hero |

### Principio “industrial + memorable”

- **Industrial:** densidad de datos, tablas, filtros, estados claros, carga skeleton shimmer.
- **Memorable:** motion en **puntos de emoción** (login, primera publicación, IA pensando) — no en cada celda de tabla.

---

## 5. Accesibilidad y rendimiento

### Bien resuelto

- Safe-area iOS en header/sidebar
- `aria-busy`, `aria-label` en skeletons
- `motion-reduce` en animaciones Kreo y AppLayout
- `prefers-reduced-transparency` y `prefers-contrast`

### Mejorar

- Password en login: migrar a `floatingLabel` cuando `Password` soporte la prop
- Dark mode declarado en Tailwind pero sin tokens — eliminar o implementar
- DataTable PrimeReact: revisar contraste y focus trap vs Dialog Kreo

---

## 6. Deuda técnica UI (priorizada)

| P | Item | Esfuerzo |
|---|------|----------|
| P1 | Unificar DataTable (Kreo puro vs PrimeReact) | Alto |
| P2 | ThinkingOrb en flujos IA (BrandInterview, ImageGenerator, Copilot) | Medio |
| P3 | StaggerGroup en listas home/inbox | Medio |
| P4 | Sincronizar `ux-ui-guide.md` con tokens reales | Bajo |
| P5 | MetalFx en pricing/planes admin (opcional premium) | Bajo |

---

## 7. Checklist de calidad industrial

- [x] Tokens CSS centralizados, sin colores hex sueltos en componentes core
- [x] Capas atoms → molecules → organisms documentadas
- [x] Shells responsivos con drawer móvil y swipe edge
- [x] Loading states (skeleton shimmer, Loader orb/spinner)
- [x] Form feedback (shake error, focus ring)
- [x] PWA manifest alineado a marca
- [ ] Storybook o catálogo visual (no existe)
- [ ] Tests visuales/regresión (no existe)
- [ ] Dark mode completo (no implementado)

---

## Conclusión

Mkt Agency OS tiene una **base UI sólida y organizada**, con identidad propia (ivory + terracota) más refinada que el SDD legacy. La actualización Kreo v5.5 cierra la brecha de motion y eleva la percepción premium en auth, headers y loading.

Para una experiencia **industrial y memorable** sostenida, el siguiente salto es llevar `ThinkingOrb` + `StaggerGroup` a los flujos IA y la bandeja SOHO, y resolver la bifurcación PrimeReact/Kreo en tablas de datos.
