# Pivot a Productos — Plan de Implementación

## Contexto

La aplicación `mkt-agency` actualmente está centrada en **empresa** (company-profile como entidad raíz). El modelo correcto es **producto** como entidad central:
- Las campañas son por producto, no por empresa
- Los competidores se asocian a productos
- El onboarding analiza la URL del producto (no de la empresa genérica) y genera etiquetas SEO
- Se descubren 15-20 competidores por producto con validación de URLs (HTTP 200 + HTML)

## 1. Nueva Entidad `products` (Backend)

### Tabla PostgreSQL

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500),
  description TEXT,
  seo_tags JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_tenant ON products(tenant_id);
```

### Estructura `seo_tags`

```json
{
  "title": "Título SEO detectado",
  "description": "Meta description",
  "keywords": ["keyword1", "keyword2"],
  "h1": "H1 de la página",
  "focusKeyphrase": "Frase clave principal",
  "ogTitle": "Open Graph title",
  "ogDescription": "Open Graph description"
}
```

### Archivos a crear/ruta: `apps/backend/src/modules/products/`

| Archivo | Propósito |
|---------|-----------|
| `infrastructure/typeorm/product.entity.ts` | Entidad TypeORM |
| `dto/product.request.dto.ts` | CreateProductDto, ListProductsQueryDto |
| `dto/product.response.dto.ts` | ProductResponseDto |
| `products.service.ts` | CRUD + from-analysis |
| `products.controller.ts` | Endpoints REST |
| `products.module.ts` | Módulo NestJS |

### Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/products` | Listar productos del tenant |
| GET | `/products/:id` | Obtener un producto |
| POST | `/products` | Crear producto manual |
| PATCH | `/products/:id` | Actualizar producto |
| DELETE | `/products/:id` | Eliminar producto |
| POST | `/products/from-analysis` | Crear desde análisis de URL (onboarding) |

### Registro en `app.module.ts`

- Añadir `ProductEntity` a la lista de entities de TypeOrm
- Importar `ProductsModule`

## 2. Modificar Website Analyzer (Onboarding)

### Cambios en `WebsiteAnalysisResult`

```diff
- productsServices: string;  // texto libre
+ products: Array<{
+   name: string;
+   url: string;
+   description: string;
+   seoTitle: string;
+   seoDescription: string;
+   seoKeywords: string[];
+   h1Tag: string;
+ }>;
```

### Cambios en `openrouter-website-analyzer.adapter.ts`

- Modificar el prompt JSON para pedir array de productos con SEO tags
- Extraer title, description, keywords, h1 de la página analizada
- Extraer OpenGraph tags si existen

### Endpoint `POST /products/from-analysis`

1. Recibe `{ url: string }`
2. Llama al `WebsiteAnalyzerService.analyze(url)`
3. Por cada producto devuelto, crea un registro en `products` con SEO tags
4. Actualiza el `CompanyProfile` con los datos de la empresa
5. Retorna los productos creados

### Frontend Onboarding

La pantalla de onboarding que actualmente pide URL de empresa debe:
1. Analizar la URL → detectar productos + SEO tags
2. Mostrar preview de productos detectados
3. Confirmar y crear productos en `POST /products/from-analysis`
4. Redirigir al dashboard de productos

## 3. Modificar Competidores

### Añadir `product_id` a `competitors`

```diff
@Entity({ name: 'competitors' })
export class CompetitorEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

+ @Column({ name: 'product_id', type: 'uuid', nullable: true })
+ productId!: string | null;

  @Column({ type: 'varchar', length: 255 })
  name!: string;
  ...
```

### Migración: `ALTER TABLE competitors ADD COLUMN product_id UUID REFERENCES products(id);`

### Aumentar descubrimiento a 15-20 competidores

En `openrouter-competitor-discovery.adapter.ts`:
```diff
- task: `Sugiere entre 5 y 8 competidores reales para el alcance: ${scopeLabel}.`,
+ task: `Sugiere entre 15 y 20 competidores reales para el alcance: ${scopeLabel}.`,
```

### Validación de URLs (HTTP 200 + contenido HTML)

Nuevo validador en `competitor.service.ts`:

```typescript
private async validateCompetitorUrl(website: string): Promise<boolean> {
  const url = website.startsWith('http') ? website : `https://${website}`;
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MktAgencyBot/1.0)' },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return false;
    const contentType = response.headers.get('content-type') || '';
    return contentType.includes('text/html');
  } catch {
    return false;
  }
}
```

Aplicar esta validación en:
- `create()` → rechazar si URL no válida
- `bulkCreate()` → filtrar con warning
- `discover()` → validar cada URL sugerida antes de incluir en resultados

### Consideraciones de performance

- Validar URLs en batch con `Promise.allSettled` (máximo 5 concurrentes)
- Mostrar progreso en el frontend
- Timeout de 10s por URL

## 4. Modificar Campañas

### Añadir `product_id` a `campaigns`

```diff
@Entity({ name: 'campaigns' })
export class CampaignEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

+ @Column({ name: 'product_id', type: 'uuid', nullable: true })
+ productId!: string | null;

  @Column({ type: 'varchar', length: 255 })
  name!: string;
  ...
```

### Migración: `ALTER TABLE campaigns ADD COLUMN product_id UUID REFERENCES products(id);`

### Cambios en DTOs

```diff
export class CreateCampaignDto {
+ @IsOptional()
+ @IsString()
+ productId?: string;

  @IsString()
  @MaxLength(255)
  name!: string;
  ...
```

### Cambios en Service

- Filtrar campañas por `productId` en `list()`
- Validar que el producto exista y pertenezca al tenant en `create()`

## 5. Frontend — Página de Productos

### Nuevos archivos en `apps/web/`

| Archivo | Propósito |
|---------|-----------|
| `src/pages/products/` | Página de listado de productos |
| `src/components/products/` | Componentes de producto |
| `src/services/products.ts` | API client |
| `src/store/products.ts` | Estado (si usa store) |

### Navegación (Sidebar)

En el sidebar principal del tenant, añadir ítem "Productos" con icono `Package` de lucide-react.

### Flujo de onboarding mejorado

1. User ingresa URL del sitio web
2. Se llama a `POST /products/from-analysis` (backend: website analyzer + creación de productos con SEO)
3. Se muestra lista de productos detectados con sus SEO tags preview
4. User confirma/edita productos
5. Redirige a vista de producto

### Vista de producto

- **Header:** Nombre + URL + Status badge
- **SEO Tags Panel:** Título, descripción, keywords, H1, focus keyphrase
- **Campañas asociadas:** Lista de campañas de este producto
- **Competidores asociados:** Lista de competidores de este producto
- **Análisis rápido:** Botón para re-analizar URL y actualizar SEO tags

## 6. Ajustes en Flujos Existentes

### Community Manager
- Los posts se crean por campaña, que ahora está asociada a producto
- No requiere cambios estructurales, solo navegación contextual

### Estrategia
- La estrategia se genera por campaña (que tiene productId)
- `StrategyAdjustmentEntity` queda igual (ya referencias campaña)

### Dashboard
- Agregar métricas de productos (cuántos, cuáles tienen campañas activas)
- Filtro por producto en dashboard general

## Orden de Implementación

1. ✅ **Entidad Products** — Tabla + módulo CRUD NestJS (sin dependencias externas)
2. ✅ **Modificar WebsiteAnalyzer** — SEO tags en análisis + endpoint from-analysis
3. ✅ **Añadir productId a competitors** — Migración + cambios en service + validación URLs + aumentar a 15-20
4. ✅ **Añadir productId a campaigns** — Migración + cambios en DTOs y service
5. ✅ **Frontend páginas** — Products page, sidebar, servicios, store
6. ✅ **Ajustes finales** — Onboarding flow, dashboard, navegación contextual

## Notas Técnicas

- **TypeORM synchronize** está activo en desarrollo (`NODE_ENV !== 'production'`)
- Se pueden crear migraciones con `typeorm migration:create`
- La columna `productId` en competitors/campaigns es **nullable** para no romper registros existentes
- La validación de URLs de competidores es **asíncrona por lote** para no bloquear
- Los SEO tags se almacenan como JSONB para flexibilidad

---

*Documento generado el 2026-06-30*