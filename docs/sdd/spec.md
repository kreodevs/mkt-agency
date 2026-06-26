# Spec — Plataforma de Agencia de Marketing Digital Híbrida (IA + Cliente)

## Objetivos

- Resolver la falta de recursos de marketing digital de pequeñas empresas y SOHO (Small Office Home Office) ofreciendo una agencia virtual donde la inteligencia artificial agéntica realiza las tareas pesadas (análisis de competidores, estructura de palabras clave, generación de borradores) y el cliente mantiene el control absoluto mediante un tablero de aprobación digital con firma criptográfica.
- Permitir que el cliente (dueño de negocio) defina objetivos, revise propuestas, apruebe o rechace contenido, y monitoree resultados, sin necesidad de conocimientos técnicos ni revisión humana obligatoria.
- Asegurar que nada se publique o entregue sin la autorización explícita del cliente, garantizando transparencia basada en métricas de negocio (no en detalles técnicos del modelo de IA).
- Vender el resultado curado (contenido, campañas, informes), no la tecnología subyacente.

## Alcance

**Dentro del alcance (MVP):**
- Plataforma multi-tenant con aislamiento completo de datos (cada tenant solo ve y gestiona sus propios datos y campañas).
- Roles: Superadmin (gestión global de tenants, impersonalización, logs), Administrador de tenant (dueño de empresa), Usuario de tenant (en versión inicial sin diferenciación de permisos).
- Onboarding progresivo con cuestionario asistido por IA (Perfil de Empresa) que sugiere respuestas basadas en datos públicos.
- Calendario Editorial Dinámico como tablero de aprobación digital: vista mensual/semanal con slots por día; cada slot muestra el plan de contenido pendiente/aprobado; al hacer clic en un día se accede al Detalle del Día con contenido renderizado sin jerga técnica.
- Flujo obligatorio: IA genera contenido/campaña/propuesta → se posiciona en Calendario como borrador → cliente abre Detalle del Día → revisa → aprueba con firma digital (hash SHA-256) → contenido queda congelado en estado aprobado → se libera kit de descarga diaria ("Copiar y Llevar") para publicación manual.
- Generación de contenido multicanal (texto, imágenes) mediante agentes de IA con roles de agencia real: estratega, copywriter, community manager, analista, gestor de presupuestos.
- Agente gestor de presupuestos que propone distribución por plataforma basada en objetivos e históricos; cliente aprueba/rechaza.
- Agente copywriter con restricciones en system prompts para prohibir mención de marcas competidoras, imitación de estilos protegidos o infracción de derechos de autor.
- Agente community manager que genera guías de publicación diaria en lenguaje de negocio (sin rastro técnico).
- Gestión de versiones de contenido: historial inmutable con autor, fecha, motivo; cualquier modificación crea nueva versión, invalida firma anterior y pausa descarga hasta nueva aprobación.
- Pipeline CRM con leads, scoring IA, historial de interacciones y etapas (prospecto, contactado, interesado, trial, cliente). Captura de leads mediante formularios embebibles (snippet JS/iframe personalizables).
- Plantillas de Campaña predefinidas que empaquetan objetivo, segmentación, presupuesto y recetas de agentes para lanzamiento rápido.
- Librería de assets por tenant (imágenes, videos, documentos) con organización en carpetas/etiquetas, contador de referencias, duplicación sin copia física, y validación de tamaño/tipo.
- Dominio personalizado (CNAME) por tenant con verificación DNS y certificado SSL automático (Let's Encrypt).
- Superadmin: consola de administración global (crear/eliminar/suspender tenants, ver estadísticas, logs, impersonalización). Creación automática del primer superadmin en el primer arranque si no existe.
- Login que identifica si el usuario es superadmin (tabla superadmins) o usuario de tenant (tabla usuarios con tenant_id) y redirige al panel correspondiente.
- Integraciones externas: TokenLab, OpenRouter, Replicate, ElevenLabs (solo para generación de contenido, sin exponer al cliente). Google Ads y Google Analytics (solo consulta de métricas, no publicación automática). DNS/Let's Encrypt para dominios personalizados.
- Inmutabilidad post-firma: una vez aprobado, el contenido (texto e IDs de assets) queda congelado. Cualquier cambio requiere nueva versión y nueva firma.
- Recordatorios automáticos al cliente si no revisa contenido en 48 horas; escalado a superadmin tras una semana sin respuesta.

**Fuera de alcance:**
- Atención al cliente humana (soporte técnico básico puede escalar a humano, pero no es un sistema de ticketing o chat en vivo).
- Contabilidad financiera de la agencia ni del cliente.
- Recursos humanos ni gestión interna de personal.
- Facturación y cobranzas (gestionadas externamente).
- Publicación automática mediante APIs externas; toda publicación se realiza manualmente por el cliente o el equipo de la agencia.
- Exposición de APIs públicas para terceros; el sistema es cerrado.

**Dependencias conocidas:**
- Proveedores de modelos de IA (TokenLab, OpenRouter, Replicate, ElevenLabs) para generación de contenido; el sistema depende de su disponibilidad y políticas de no retención de datos.
- Servicio de almacenamiento de objetos (S3-compatible) para assets multimedia.
- Servicio DNS y Let's Encrypt para gestión de dominios personalizados.
- Google Ads y Google Analytics (integración opcional; no crítica para el MVP).

## Criterios de éxito

### Cada criterio se evalúa como condición de aceptación del proyecto:

1. **Toda generación de contenido, propuesta o análisis de IA pasa por el Calendario Editorial Dinámico antes de ser accesible para el cliente.** No existe ruta alternativa que omita la aprobación.
2. **El cliente puede aprobar, rechazar o solicitar cambios desde el Detalle del Día.** La aprobación genera una firma SHA-256 que se muestra en el slot del calendario. El registro de la firma es trazable.
3. **El contenido aprobado queda congelado** (texto e IDs de assets) y cualquier modificación requiere nueva versión, invalidando la firma anterior y pausando la descarga hasta nueva aprobación.
4. **Las guías de publicación diaria del agente Community Manager no contienen ningún término técnico** (nombres de modelos, prompts, logs, tokens). Se redactan exclusivamente en lenguaje de negocio con pasos operativos humanos.
5. **Los system prompts de los agentes Copywriter y Visual incluyen restricciones** que impiden generar contenido con marcas registradas competidoras, estilos protegidos o material que infrinja derechos de autor. Esto se verifica mediante pruebas de generación controladas.
6. **El kit de descarga diaria ("Copiar y Llevar") contiene todo el contenido aprobado de cada día, estructurado por plataforma y tipo, listo para publicación manual.** Si un contenido se modifica post-aprobación, el kit refleja el estado pendiente hasta nueva aprobación.
7. **El sistema es multi-tenant con aislamiento completo:** un usuario de un tenant no puede acceder a datos de otro tenant. Los dominios personalizados se verifican y despliegan correctamente con SSL.
8. **El superadmin puede gestionar tenants, ver estadísticas globales, acceder a logs de auditoría e impersonar tenants** (sin acciones destructivas). El primer arranque crea el superadmin si no existe.
9. **El cuestionario de onboarding asistido por IA sugiere respuestas basadas en datos públicos** (URL del sitio web, industria, etc.) y el cliente puede aceptar, modificar o rechazar. El Perfil de Empresa se marca como completado al alcanzar al menos el 80% de preguntas obligatorias.
10. **El historial de versiones de contenido es inmutable:** cada cambio genera un nuevo registro con autor, fecha y motivo. No se permite sobrescribir ni eliminar versiones.
11. **Los formularios embebibles (snippet JS/iframe) capturan leads** y los registran en el CRM con historial de interacciones y scoring IA.
12. **Las plantillas de Campaña precargan objetivo, plataformas, presupuesto y recetas de agentes,** permitiendo lanzamiento en un clic. El cliente puede modificar valores precargados y debe aprobar la versión final.

## User journeys (resumidos)

1. **Nuevo cliente se registra y completa onboarding:** El cliente se registra, inicia el cuestionario asistido por IA (secciones: empresa, marca, audiencia, competidores, objetivos). La IA sugiere respuestas basadas en el sitio web y datos de registro. El cliente acepta, modifica o rechaza. Al alcanzar el 80% de preguntas obligatorias, el perfil se activa y los agentes lo usan para personalizar campañas. El cliente puede volver al cuestionario en cualquier momento.

2. **Crear y lanzar campaña desde plantilla:** El cliente accede al dashboard y elige "Usar plantilla". Selecciona "Captación Local" (u otra). El sistema precarga objetivo, plataformas (Google Ads, Facebook), distribución de presupuesto sugerida y activa agentes (estratega, copywriter, community manager). El cliente ajusta valores y hace clic en "Lanzar". Los agentes generan contenido y lo posicionan en el Calendario Editorial en estado borrador. El cliente recibe notificación.

3. **Aprobar contenido diario desde el Calendario Editorial:** El cliente abre el Calendario Editorial (vista mensual). Ve un día con indicador amarillo (pendiente). Hace clic y accede al Detalle del Día. Visualiza preview del post (texto e imagen) e instrucciones operativas (sin lenguaje técnico). Hace clic en "Aprobar y Firmar". El sistema genera hash SHA-256, el slot pasa a verde con icono de firma. Se liberan botones "Copiar Copy" y "Descargar Asset". El cliente descarga el kit de publicación manual.

4. **Solicitar cambios a contenido generado por IA:** En el Detalle del Día, el cliente hace clic en "Solicitar cambios" y escribe un comentario (ej. "Cambiar tono a más formal"). El agente copywriter genera una nueva versión, preservando el historial. El nuevo contenido se posiciona en el mismo slot como borrador (amarillo). El cliente revisa y aprueba o vuelve a solicitar cambios. El proceso continúa hasta aprobación.

5. **Gestionar pipeline de leads capturados por formulario:** El cliente crea un formulario personalizado (campos: nombre, email, teléfono) desde el módulo de formularios. Copia el snippet JS y lo pega en su sitio web. Un visitante completa el formulario; el sistema lo registra como nuevo lead en el CRM con score IA inicial. El agente analista asigna etapa y registra la interacción. El cliente ve el lead en el pipeline y puede iniciar una campaña personalizada.

6. **Configurar dominio personalizado (CNAME):** El cliente en configuración ingresa "agencia.miempresa.com". El sistema muestra valor CNAME de destino y token de verificación. El cliente añade registro CNAME en su DNS. La plataforma verifica la resolución y emite certificado SSL (Let's Encrypt). El cliente accede a su dashboard mediante "agencia.miempresa.com". El superadmin supervisa el estado desde la consola.

7. **Superadmin impersona tenant para soporte:** El superadmin accede a la consola de administración, lista tenants, selecciona uno y hace clic en "Impersonar". Aparece un banner "Estás en modo auditoría - Tenant: [nombre]". Puede navegar por campañas, leads, assets, configuraciones. Realiza ajustes (ej. modificar límite de tamaño de asset). Cada acción se registra en logs de auditoría. Al finalizar, cierra la sesión de impersonalización y vuelve a la consola.

## Registro de cambios del documento

| Versión | Fecha     | Descripción del cambio                                                                                                                                                                                    |
| :------ | :-------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | Mayo 2025 | Creación inicial del Spec a partir del Benchmark (DBGA) y resumen fase 0. Extrae y consolida objetivos, alcance, criterios de éxito y user journeys sin añadir información no respaldada por las fuentes. |