# Especificador de Base para MDD

## Misión Crítica (Executive Spec)

Resolver el problema de las pequeñas empresas y SOHO que carecen de los recursos de una agencia de marketing digital, ofreciendo un modelo híbrido donde la inteligencia artificial agéntica realiza las tareas pesadas (análisis, redacción, estructuración de campañas) y el cliente mantiene el control absoluto mediante un tablero de aprobación digital con firma criptográfica. La arquitectura North Star es un sistema multi-tenant con aislamiento completo, donde el flujo base “IA genera → cliente aprueba” es obligatorio e inmutable post-aprobación, y la tecnología subyacente queda completamente oculta tras resultados de negocio curados.

## Matriz de Requerimientos Funcionales (Extraídos de Referencias)

### Mandatorios (M)

| ID | Requerimiento | Base en fuente |
|----|---------------|----------------|
| M1 | Sistema debe implementar un flujo de aprobación digital con Calendario Editorial Dinámico que muestre el plan de contenidos día a día y panel de Detalle del Día con contenido renderizado sin jerga técnica. | Regla de negocio “Kill Switch / Validación Previa” y “Obligatoriedad del flujo en Calendario”. |
| M2 | Todo contenido, propuesta o análisis generado por IA debe ser aprobado explícitamente por el cliente (dueño de empresa) antes de su publicación o entrega. No se debe requerir revisión humana obligatoria. | Regla de negocio “IA como generador principal, cliente como aprobador final”. |
| M3 | Cada aprobación debe generar una firma digital asociada al slot del Calendario Editorial; el sistema debe almacenar el hash SHA-256 de la firma para trazabilidad. | Regla “Obligatoriedad del flujo en Calendario”. |
| M4 | Los componentes de texto y los IDs de assets involucrados en un contenido aprobado deben quedar congelados (inmutabilidad post-firma). Cualquier modificación requiere generar una nueva versión, invalidando la firma anterior y pausando la descarga hasta nueva aprobación. | Regla “Inmutabilidad post-firma en descarga”. |
| M5 | Las guías de publicación diaria generadas por el agente Community Manager deben redactarse exclusivamente en lenguaje de negocio y pasos operativos humanos, sin rastro de prompts, nombres de modelos, logs de tokens ni ningún detalle interno del sistema. | Regla “Cero exposición técnica en Instrucciones”. |
| M6 | Los agentes Copywriter y Visual deben incluir restricciones en sus system prompts que prohíban mencionar marcas registradas competidoras, imitar estilos protegidos o reproducir contenido que infrinja derechos de propiedad intelectual. | Regla “Protección de marcas y derechos de autor en generación de contenido”. |
| M7 | El sistema debe ser multi-tenant con aislamiento total de datos: cada tenant solo puede acceder y gestionar sus propios datos y campañas. | Entidad “Usuario (tenant)” y regla de negocio implícita de separación. |
| M8 | Cada tenant debe poder configurar un dominio personalizado (CNAME) apuntando a la plataforma, con verificación DNS y certificado SSL automático. | Entidad “Dominio Personalizado (CNAME)”. |
| M9 | Debe existir un rol Superadmin con capacidad de gestionar tenants, ver estadísticas globales, acceder a logs de auditoría y crear/eliminar tenants. Este usuario se crea automáticamente en el primer arranque si no existe. | Entidad “Superadmin” y descripción de rol. |
| M10 | El sistema debe almacenar historial completo de versiones de contenido (Versión de Contenido), con registro inmutable de cada cambio, autor (agente o humano), fecha y motivo. | Entidad “Versión de Contenido” y regla de negocio de inmutabilidad. |
| M11 | El cliente debe poder descargar diariamente un kit estructurado (“Copiar y Llevar”) con todo el contenido aprobado del día, empaquetado para publicación manual. | Fuera de alcance: “Kit de descarga diaria” y regla de inmutabilidad. |
| M12 | El sistema debe prohibir la modificación de una audiencia si ya tiene anuncios activos asociados. | Regla de negocio explícita. |

### Diferenciadores (D)

| ID | Diferenciador | Justificación |
|----|---------------|---------------|
| D1 | Modelo híbrido IA agéntica + cliente como aprobador final, eliminando la necesidad de revisión humana obligatoria (el cliente decide directamente). | Flujo exclusivo del contexto proporcionado. |
| D2 | Calendario Editorial Dinámico con firma digital por slot (SHA-256) y trazabilidad de aprobaciones directamente visible al cliente. | No se observa en herramientas convencionales que publican automáticamente. |
| D3 | Kit de descarga “Copiar y Llevar” diario, estructurado por tipo de contenido y plataforma, listo para publicación manual sin depender de APIs externas. | Enfoque SOHO que prioriza control manual frente a automatización total. |
| D4 | Agentes de IA con roles de agencia real (estratega, copywriter, community manager, analista, gestor de presupuestos) que generan y proponen presupuestos y contenido multicanal. | Personalización y transparencia para dueños de negocio no técnicos. |
| D5 | Formularios embebibles mediante snippet JS/iframe con personalización visual, integrados con el CRM y agentes de IA para captura de leads. | Entidad “Formulario” y flujo de leads; extensión más allá de lo básico. |
| D6 | Plantillas de Campaña predefinidas que empaquetan objetivos, segmentación, distribución de presupuesto, tipos de contenido y recetas de agentes, permitiendo lanzamiento en un clic para SOHO. | Entidad “Plantilla de Campaña”; simplifica onboarding. |
| D7 | Zero exposición técnica: todas las interfaces de cliente muestran métricas de negocio (conversiones, ROI, alcance), y las guías de publicación omiten cualquier detalle del modelo de IA o logs internos. | Regla “Transparencia basada en resultados” y “Cero exposición técnica”. |

## Especificaciones Técnicas Identificadas

### Protocolos & Estándares

- **HTTP/HTTPS** con TLS 1.2/1.3 para todas las comunicaciones.
- **DNS CNAME** para dominios personalizados por tenant.
- **Let’s Encrypt (ACME)** para emisión automática de certificados SSL en dominios personalizados.
- **SHA-256** como algoritmo de hash para firmas digitales de aprobaciones.
- **JSON** como formato estructurado para datos intercambiables (historial de interacciones, perfiles, configuraciones de agentes).
- **SQL (PostgreSQL)** como base de datos relacional con soporte de esquemas multi-tenant (o filas con tenant_id).
- **Almacenamiento de objetos (S3-compatible)** para assets multimedia (imágenes, videos, documentos).
- **No se identifican estándares externos como ISO, HIPAA, OAuth2, OIDC en las fuentes proporcionadas.** El sistema es cerrado; no expone APIs públicas ni integraciones con terceros más allá del soporte DNS.

### Entidades de Datos Críticas

Las siguientes entidades deben modelarse en la base de datos, respaldadas directamente por la especificación Fase 0:

1. **Lead** – Prospecto en pipeline CRM con etapa, score IA, historial de interacciones y consentimiento.
2. **Perfil de Empresa** – Datos de onboarding del tenant (industria, tono, competidores, objetivos).
3. **Campaña** – Iniciativa de marketing con presupuesto, plataformas y estado.
4. **Contenido** – Material generado por IA (texto, imagen, video) con estado de aprobación y versión asociada.
5. **Versión de Contenido** – Registro inmutable de cambios (autor, motivo, diff).
6. **Audiencia** – Segmento objetivo con criterios demográficos y de comportamiento.
7. **Anuncio** – Versión final de contenido asociado a plataforma y presupuesto, con métricas.
8. **Post (Redes Sociales)** – Publicación en red social con flujo de aprobación y métricas.
9. **Agente de IA** – Rol de agente virtual (estratega, copywriter, etc.) con estado y asignaciones.
10. **Presupuesto** – Propuesta de inversión por campaña, con distribución por plataforma.
11. **Competidor** – Entidad monitoreada para inteligencia competitiva.
12. **Página Local (SEO)** – Landing page por ciudad para SEO local.
13. **Propuesta (IA)** – Propuesta comercial generada por IA para aprobación del cliente.
14. **Reporte** – Resumen de KPIs y recomendaciones de IA.
15. **Dominio Personalizado (CNAME)** – Configuración de subdominio por tenant con estado y certificado SSL.
16. **Formulario** – Formulario capturable embebible con campos personalizables y snippet.
17. **Plantilla de Campaña** – Configuración predefinida para lanzamiento rápido de campañas.
18. **Superadmin** – Usuario global con permisos de gestión de tenants y sistema.
19. **Usuario (tenant)** – Cliente o empleado dentro de un tenant, con rol (owner, manager, viewer).
20. **Asset (Librería de activos)** – Recurso multimedia organizable con metadatos (tamaño, formato, etiquetas, contador de referencias).

## Análisis de Gaps & Riesgos de Implementación

### Gaps respecto a un estándar de la competencia (referencia no disponible)

- No se dispone de una referencia scrapeada contra la cual comparar. La especificación Fase 0 cubre un alcance limitado intencionadamente (sin facturación, RRHH, atención al cliente humana, publicación automática). Si la competencia ofrece esas características, este producto quedaría por detrás en funcionalidades de backoffice; sin embargo, el modelo de aprobación manual y control del cliente es una ventaja competitiva en el segmento SOHO.

### Riesgos de implementación identificados

1. **Complejidad de orquestación multi-agente:** Coordinar agentes de IA (estratega, copywriter, community manager, analista) con roles interdependientes y flujos de aprobación puede generar estados inconsistentes si no se usa un motor de workflows robusto (ej. DAG de tareas).
2. **Inmutabilidad post-firma y versionado:** Garantizar que ningún cambio opere sobre contenido aprobado sin generar una nueva versión requiere bloqueos a nivel de base de datos, validación en API y posiblemente un sistema de eventos para notificar al cliente.
3. **Seguridad multi-tenant:** El aislamiento estricto de datos y la gestión de dominios personalizados con SSL automático añaden riesgos de fuga entre tenants si las consultas SQL o los permisos de S3 no se parametrizan correctamente.
4. **Firma digital SHA-256:** Implementar una firma que el cliente “entienda” como aprobación no es trivial; debe generarse en el backend, asociarse al contenido y mostrarse en la UI sin exponer claves privadas.
5. **Cero exposición técnica en guías:** Los system prompts de los agentes deben filtrar cualquier referencia a modelos, APIs o logs; esto requiere capas de post-procesamiento o instrucciones estrictas en el prompt engineering.
6. **Onboarding progresivo con IA sugerida:** El cuestionario de Perfil de Empresa que la IA sugiere respuestas basadas en datos públicos puede generar errores si los datos son incompletos; debe existir mecanismo de corrección manual.

### Complejidad Estimada: **8/10**

- Justificación: Arquitectura multi-tenant con seguridad alta, múltiples agentes de IA orquestados, flujo de aprobación inmutable con firma digital, gestión de dominios personalizados (CNAME+SSL), versionado completo de contenido y librería de activos referenciada.

## Metadatos técnicos (TechnicalMetadata)

- `[multi_tenant]` – Aislamiento completo por tenant con datos, dominios y assets separados.
- `[high_security]` – Firma digital, inmutabilidad, protección de marcas, cero exposición técnica.
- `[ai_agents]` – Múltiples agentes de IA autónomos orquestados.
- `[real_time]` – Calendario Editorial Dinámico que refleja cambios inmediatos tras aprobación/rechazo.
- `[whitelabel]` – Dominios personalizados por tenant (CNAME) para experiencia de marca blanca.
- `[crm]` – Pipeline de leads con scoring IA y etapas.
- `[storage_assets]` – Librería de activos multimedia con contador de referencias.
- `[cicd_pipeline]` – No explícito, pero necesario para despliegue de múltiples módulos.

## Fuentes

- Fase 0 — Especificación Inicial (proporcionada por el usuario): descripción de propósito, alcance, entidades del dominio y reglas de negocio. (Única fuente disponible; no hay referencias scrapeadas externas.)

## Registro de cambios del documento

| Versión | Fecha | Descripción del cambio |
|---------|-------|------------------------|
| 1.0     | Abril 2025 | Creación inicial del Especificador de Base para MDD a partir de la especificación Fase 0 del usuario. |