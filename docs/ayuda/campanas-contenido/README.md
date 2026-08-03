# Campañas y contenido

## Qué es

Módulos de **marketing de agencia** para planificar campañas (orgánicas o pagadas) y gestionar piezas de contenido versionadas. Disponibles principalmente en **vista avanzada** (Growth); bloqueados o redirigidos en modo copiloto SOHO puro.

## Para qué sirve

- **Campañas:** agrupar esfuerzos por producto o marca, Kanban de estados, estrategia IA (Growth).
- **Contenidos:** editor detallado, historial de versiones, aprobación con firma, generación de imagen IA.

El flujo SOHO diario usa la **bandeja** (`/`), no estas pantallas — pero comparten la misma entidad `contents` en backend.

## Perfiles y acceso

| Perfil | Campañas | Contenidos |
|--------|----------|------------|
| SOHO (`soho`) | Bloqueado (`GrowthProfileGuard`) | Redirige a `/` en copiloto |
| Growth orgánico | Sí, sin pauta | Sí |
| Growth con pauta | Sí + presupuestos IA | Sí |

Activa vista avanzada en sidebar para ver rutas `/campaigns` y `/contents`.

## Cómo usarlo

### Campañas

| Ruta | Función |
|------|---------|
| `/campaigns` | Listado tabla + Kanban, filtros |
| `/campaigns/new` | Crear campaña |
| `/campaigns/:id` | Detalle |

**Alcance de campaña:**

| Scope | `productId` | Uso |
|-------|-------------|-----|
| `product` | Requerido (producto activo) | Marketing de un producto |
| `brand` | null | Marca general del tenant |

**Detalle orgánico:**

- Plan editorial
- Edición de plataformas objetivo
- Generar posts desde la campaña

**Detalle pagado (Growth + presupuesto):**

- Estrategia IA
- Presupuestos y aprobación (`BudgetApproval`)

Componentes: `CampaignKanban`, `StrategyGeneration`.

### Contenidos

| Ruta | Función |
|------|---------|
| `/contents` | Listado con filtros (`?campaignId=`) |
| `/contents/new` | Crear borrador |
| `/contents/:id` | Editor completo |

**Editor (`ContentEditPage`):**

- Copy por plataforma
- Panel visual (`ContentVisualPanel`) — imagen IA, carrusel, video
- Historial de versiones (`VersionHistory`)
- Aprobación con firma (`ApprovalActions`, `SignatureBadge`)
- Eliminar borradores

**API principal:** `/api/v1/contents`

### Relación bandeja ↔ contenidos

Los posts generados por Community Manager y el copiloto son registros `contents` con estados que la bandeja agrupa (pending, approved, rejected, published). Editar en `/contents/:id` afecta el mismo arte visible en Inicio.

## Qué pasa si...

| Situación | Comportamiento |
|-----------|----------------|
| SOHO no ve Campañas | Normal — usa bandeja; activa Growth en perfil operativo |
| Campaña sin producto | Scope `product` exige producto activo |
| Pauta sin presupuesto | `PaidBudgetGuard` bloquea estrategia de ads |
| Contenido aprobado en bandeja | Aparece en `/contents` con status approved |
| Eliminar contenido con propuestas | CRM/proposals pueden bloquear según reglas |

## Relacionado con

- [Copiloto y bandeja](../copiloto-bandeja/README.md)
- [Productos](../productos/README.md)
- [Calendario](../calendario/README.md)
- [Agentes](../agentes/README.md) — Community Manager genera contenidos
- [Ajustes](../ajustes-integraciones/README.md) — perfil operativo Growth
