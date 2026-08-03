# Productos y onboarding

## Qué es

El **catálogo de productos o servicios** por tenant. Es la entidad central del modelo *producto-first*: campañas, contenidos, formularios, leads y agentes IA se vinculan a un producto concreto.

## Para qué sirve

Un dueño de negocio SOHO suele tener uno o pocos productos. Al completar el onboarding de un producto, el sistema activa en segundo plano Brand Analyst, descubrimiento de competidores, Competitor Intel y Community Manager — generando la primera semana de posts en la bandeja.

## Cómo usarlo

### Rutas

| Ruta | Función |
|------|---------|
| `/products` | Listado; acceso rápido a **Integración n8n** |
| `/products/new` | Alta manual (redirige al onboarding) |
| `/products/create-with-ai` | Alta asistida por IA |
| `/products/:id/onboarding` | Wizard de onboarding |
| `/products/:id` | Edición, logo, integración n8n |
| `/products/:id/media-kit` | Kit de medios del producto |

### Crear un producto

**Opción A — Manual (`/products/new`)**

1. Indica nombre y datos básicos.
2. Completa el wizard de onboarding.

**Opción B — Con IA (`/products/create-with-ai`)**

1. Proporciona URL del sitio web.
2. El sistema infiere campos con `POST /products/:id/infer-from-page`.

### Wizard de onboarding (pasos clave)

| Paso | Campo | Notas |
|------|-------|-------|
| 1 | URL del producto | Botón **Analizar e inferir campos** |
| 2–4 | Tipo, descripción, propuesta de valor, audiencia | Prellenables por IA |
| 5 | Precio | Opcional |
| 6 | Tags SEO | **Mínimo 3**; generables desde la URL |

Al pulsar **Completar onboarding** (`POST /products/:id/onboarding/complete`):

1. **Brand Analyst** — entrevista con `productId`
2. **Competidores** — descubrimiento + bulk (hasta 8) si hay perfil de empresa
3. **Competitor Intel** — espera análisis (máx. ~3 min)
4. **Community Manager** — genera copy (sin imágenes en onboarding inicial)

Recibirás una **notificación en bandeja** al terminar y redirección a `/`.

### Logo y media kit

En detalle de producto:

- **Logo:** subida manual, extracción desde web o eliminación.
- **Media kit** (`/products/:id/media-kit`): capturas, demos, fotos de eventos.
  - Sube archivos directamente o enlaza desde la [Librería](../libreria/README.md) (**Desde librería**).

El Community Manager prioriza assets del kit al componer visuales.

### Producto principal

Solo puede haber **un producto `isPrimary` activo** por tenant. El selector de producto activo en la bandeja usa este contexto.

### Integración n8n (configuración)

En `/products/:id` → sección **Publicación automática (n8n)** o enlace **Integración n8n** desde el listado.

Detalle completo en [Publicación manual vs n8n](../publicacion-n8n/README.md).

## Qué pasa si...

| Situación | Comportamiento |
|-----------|----------------|
| Onboarding incompleto (<3 tags SEO) | No se puede completar; `ready=false` |
| Perfil de empresa vacío | Competidores pueden omitirse; resto de pipeline continúa |
| Archivar producto | `POST /products/:id/archive`; deja de aparecer en flujos activos |
| Segundo producto | Soportado; cambia producto activo en bandeja |
| Onboarding tarda mucho | Es asíncrono; revisa **Actividad agentes** (`/agency/activity`) |

## Relacionado con

- [Copiloto y bandeja](../copiloto-bandeja/README.md)
- [Publicación n8n](../publicacion-n8n/README.md)
- [Librería y media kit](../libreria/README.md)
- [Agentes IA](../agentes/README.md)
- [Ajustes del copiloto](../ajustes-integraciones/README.md) — redes y volumen semanal
