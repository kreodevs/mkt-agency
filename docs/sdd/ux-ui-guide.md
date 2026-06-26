---
version: alpha
name: AgenteIA Design System
description: Identidad visual profesional y confiable para una plataforma de marketing digital híbrida con IA, donde el cliente mantiene el control absoluto.
colors:
  primary: "#1B3A5C"
  secondary: "#2E7D5B"
  tertiary: "#F59E0B"
  neutral: "#F8F9FA"
typography:
  h1:
- fontFamily: "Inter, system-ui, sans-serif"
- fontSize: 32px
- fontWeight: 700
- lineHeight: 40px
- letterSpacing: "-0.02em"

  h2:
- fontFamily: "Inter, system-ui, sans-serif"
- fontSize: 24px
- fontWeight: 600
- lineHeight: 32px
- letterSpacing: "-0.01em"

  body-md:
- fontFamily: "Inter, system-ui, sans-serif"
- fontSize: 16px
- fontWeight: 400
- lineHeight: 24px

```dockerfile
  label-sm:
- fontFamily: "Inter, system-ui, sans-serif"
- fontSize: 14px
- fontWeight: 500
- lineHeight: 20px
- letterSpacing: "0.02em"

rounded:
  sm: 4px
  md: 8px
  lg: 12px
spacing:
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  button-primary:
- backgroundColor: "{colors.tertiary}"
- textColor: "#FFFFFF"
- rounded: "{rounded.sm}"
- padding: 12px

  button-primary-hover:
- backgroundColor: "{colors.primary}"
- textColor: "#FFFFFF"
- rounded: "{rounded.sm}"
- padding: 12px

  card:
- backgroundColor: "#FFFFFF"
- rounded: "{rounded.md}"
- padding: 16px

  input:
- backgroundColor: "#FFFFFF"
- rounded: "{rounded.sm}"
- padding: 10px

  badge:
- backgroundColor: "{colors.secondary}"
- textColor: "#FFFFFF"
- rounded: "9999px"
- padding: 4px

```

---

## Overview (Brand & Style)

AgenteIA es una plataforma SaaS B2B que ofrece servicios de marketing digital impulsados por IA a pequeñas empresas y profesionales SOHO. La identidad visual comunica **confianza profesional** (azul profundo), **crecimiento orgánico** (verde esmeralda) y **acción cálida** (ámbar para CTAs). El diseño prioriza la claridad sobre la decoración, reflejando el modelo híbrido donde la IA trabaja en segundo plano y el cliente tiene el control total mediante un tablero de aprobación digital.

El tono visual es **serio pero accesible**: tipografía limpia (Inter), esquinas suaves pero no infantiles, y una paleta de colores que inspira seguridad sin resultar fría. Todo el diseño está pensado para usuarios no técnicos, con énfasis en la legibilidad de datos (tablas, calendarios, kanban) y en la visibilidad del estado de aprobación.

## Colors

### La paleta está inspirada en el dominio de marketing digital profesional:

- **Primary `#1B3A5C` (Azul Marino):** Confianza, seriedad, estabilidad. Se usa en fondos de navegación, encabezados y botones secundarios. Representa la plataforma como socio confiable.
- **Secondary `#2E7D5B` (Verde Esmeralda):** Crecimiento, éxito, sostenibilidad. Se aplica en badges de estado, indicadores de aprobación y elementos que refuerzan resultados positivos.
- **Tertiary `#F59E0B` (Ámbar):** Calidez, acción, optimismo. Es el color de los CTAs principales, notificaciones urgentes y estados pendientes. Contrasta con el azul para dirigir la atención.
- **Neutral `#F8F9FA` (Gris claro):** Fondo de tarjetas y paneles. Proporciona un lienzo limpio sin competir con los colores de acento.

Todos los textos sobre estos fondos cumplen con WCAG AA (contraste ≥4.5:1). Para texto sobre primary, se usa blanco (#FFFFFF); sobre tertiary, blanco; sobre secondary, blanco. En fondos neutros se usa texto primary oscuro (#1B3A5C) para legibilidad.

## Typography

Se utiliza **Inter** como tipografía única (títulos y cuerpo) por su excelente legibilidad en pantalla, su amplio soporte multilingüe y su naturaleza compacta ideal para interfaces densas de datos (tablas, calendarios, kanban).

| Estilo                       | Tamaño | Peso           | Line-height | Tracking |
| :--------------------------- | :----- | :------------- | :---------- | :------- |
| h1 (encabezados de página)   | 32px   | Bold (700)     | 40px        | -0.02em  |
| h2 (títulos de sección)      | 24px   | Semibold (600) | 32px        | -0.01em  |
| body-md (texto de lectura)   | 16px   | Regular (400)  | 24px        | 0        |
| label-sm (etiquetas, badges) | 14px   | Medium (500)   | 20px        | +0.02em  |
**Reglas:**
- En móvil, h1 se reduce a 28px y body-md a 15px mínimo.
- El ancho de línea no debe superar 75 caracteres en párrafos.
- Los labels en formularios y tablas usan `label-sm` con tracking para mejorar legibilidad.

## Layout & Spacing

El sistema de espaciado sigue una progresión lineal de 8px (múltiplos de 4) para mantener coherencia visual.

| Token | Valor | Uso común                                                                |
| :---- | :---- | :----------------------------------------------------------------------- |
| sm    | 8px   | Padding interno de badges, gap entre elementos muy relacionados          |
| md    | 16px  | Padding de inputs, gap entre campos de formulario, margen entre tarjetas |
| lg    | 24px  | Padding de tarjetas, margen entre secciones verticales                   |
| xl    | 32px  | Margen entre pantallas, padding de contenedores principales              |
**Layout responsivo:**
- Desktop: contenido centrado con ancho máximo de 1280px.
- Tablet (768px-1024px): mantiene estructura de dos columnas; kanban se vuelve horizontal scroll.
- Móvil (<768px): una columna; tablas se convierten en tarjetas apilables (MobileStackView); calendario se muestra en vista semanal compacta.

## Elevation & Depth

Se usa una jerarquía de sombras suaves para indicar elevación sin competir con el contenido. Las sombras se aplican solo a tarjetas, modales y menús desplegables.

- **Elevación baja (tarjetas, inputs):** `box-shadow: 0 1px 3px rgba(27, 58, 92, 0.12), 0 1px 2px rgba(27, 58, 92, 0.06)`
- **Elevación media (modales, menús):** `box-shadow: 0 4px 6px rgba(27, 58, 92, 0.15), 0 2px 4px rgba(27, 58, 92, 0.1)`
- **Elevación alta (tooltips, notificaciones toast):** `box-shadow: 0 10px 15px rgba(27, 58, 92, 0.2), 0 4px 6px rgba(27, 58, 92, 0.1)`

Los modales y paneles laterales se animan con transform (translate + opacity) durante 250ms, respetando `prefers-reduced-motion`.

## Shapes

### Los bordes redondeados se aplican de forma consistente según el contexto:

| Token         | Valor  | Aplicación                                             |
| :------------ | :----- | :----------------------------------------------------- |
| sm (4px)      | 4px    | Botones, inputs, badges pequeños, avatares cuadrados   |
| md (8px)      | 8px    | Tarjetas, contenedores de contenido, paneles laterales |
| lg (12px)     | 12px   | Modales, diálogos grandes, contenedores principales    |
| full (9999px) | 9999px | Badges redondos, avatares circulares, chips            |
**Regla:** Los inputs y botones usan sempre sm (4px) para mantener una apariencia profesional y alineada con las guías de accesibilidad. Esquinas más grandes (md/lg) se reservan para contenedores.

## Components

### Button Primary
- **Estado normal:** Fondo ámbar `#F59E0B`, texto blanco, border-radius 4px, padding 12px.
- **Hover:** Fondo azul primario `#1B3A5C`, texto blanco. Transición suave (150ms).
- **Disabled:** Opacidad 0.4, sin hover. Cursor not-allowed.
- **Touch target:** Al menos 44x44px (en móvil se añade padding extra si es necesario).

### Card
- Fondo blanco, border-radius 8px, padding 16px. Sombra baja por defecto. Puede elevarse a media en hover si es interactiva. No debe tener borde a menos que se requiera para estado seleccionado.

### Input
- Fondo blanco, border-radius 4px, padding 10px. Borde sólido de 1px con color `#CBD5E1`. Estado focus: borde azul primario + anillo de foco azul con 3px de separación (box-shadow).

### Badge
- Fondo verde secundario `#2E7D5B`, texto blanco, border-radius full (9999px), padding 4px horizontal. Se usa para estados aprobados, éxito, o etiquetas de versión.

### Tabla de datos
- (No incluida en tokens pero es componente común) Usa border colapsado, filas alternadas con fondo `#F8FAFC`, hover con fondo `#F1F5F9`. El texto de celdas usa body-md. Los encabezados usan label-sm con color `#64748B`.

## Do's and Don'ts

**Do's:**
- Usa el color ámbar exclusivamente para CTAs principales y notificaciones urgentes.
- Mantén el contraste WCAG AA en todos los textos. Verifica con herramientas automáticas.
- Proporciona estados de carga (skeleton/spinner) en todas las operaciones asíncronas (generación IA, subida de assets).
- Ofrece feedback claro en cada acción: notificaciones toast para éxito/error, tooltips para iconos solos.
- Respeta `prefers-reduced-motion` desactivando animaciones no esenciales.
- Diseña para pantalla táctil: áreas de 44x44px mínimo en todos los elementos interactivos.

**Don'ts:**
- No uses el verde secundario para errores o advertencias (reserva rojo `#EF4444` para errores).
- No combines más de dos colores de acento en una misma sección sin un propósito claro.
- No uses texto blanco sobre fondos amarillos claros (inaccesible).
- No dupliques la jerarquía de sombras: una tarjeta no debe tener más de una sombra.
- No ocultes información crítica solo con color (usa iconos y texto adicional).

---

## Prompt para Google Stitch (producto)

**Copia este texto en Google Stitch para generar las pantallas del producto:**

Diseña una plataforma SaaS web llamada "AgenteIA" (nombre provisional) que funciona como una agencia de marketing digital híbrida para pequeñas empresas y SOHO. El producto permite a los dueños de negocio gestionar campañas multicanal con contenido generado por IA, pero reteniendo el control absoluto mediante un tablero de aprobación digital con firma SHA-256. El flujo principal es: IA genera borrador → cliente revisa en Calendario Editorial Dinámico → aprueba/rechaza/solicita cambios → contenido queda inmutable post-aprobación. El stack UI es React 18, Tailwind CSS 3.4, Shadcn/ui. Debes generar las siguientes pantallas en variantes desktop (1280px) y móvil (375px): (1) Dashboard principal del tenant con resumen de campañas activas, calendario mensual con slots codificados por color (verde=aprobado, amarillo=borrador, rojo=pendiente), y últimas notificaciones. (2) Pantalla de Detalle del Día con lista de contenidos pendientes de aprobación, cada uno con previsualización en lenguaje de negocio (sin jerga técnica), botones "Aprobar", "Rechazar", "Solicitar cambios", y estado de firma digital. (3) Pantalla de Campañas con kanban board (cuatro columnas: Borrador, Pendiente, Aprobada, Publicada) y posibilidad de arrastrar tarjetas. (4) Pantalla de CRM/pipeline de leads con kanban de 5 etapas (Nuevo, Contactado, Calificado, Convertido, Perdido), y scoring IA visible. (5) Pantalla de Librería de Assets con grid de miniaturas, carpetas y etiquetas; incluye subida drag-and-drop y duplicado con contador de referencias. (6) Pantalla de Configuración del Perfil de Empresa (onboarding progresivo) con cuestionario paso a paso asistido por IA (sugerencias embebidas). (7) Pantalla de Propuestas con lista de propuestas generadas por IA, cada una con opciones de firmar o rechazar digitalmente. (8) Pantalla de Dominios Personalizados con formulario para añadir CNAME y estado de verificación DNS/SSL. (9) Pantalla de Login / Setup inicial (crear primer superadmin). (10) Panel de Superadmin con lista de tenants (tabla), impersonalización (banner "IMPERSONANDO" durante la sesión), y logs de auditoría. Para cada pantalla, incluye estados: vacío (sin datos), carga (skeleton), error (toast y mensaje), y borde (datos extremos). La dirección visual es profesional y confiable: azul marino (#1B3A5C) como color primario, verde esmeralda (#2E7D5B) como secundario, ámbar (#F59E0B) para CTAs. Tipografía Inter. Los componentes deben cumplir WCAG AA (contraste ≥4.5:1), áreas táctiles ≥44px, y estados de foco visibles. Respeta el sistema de espaciado de 8px y las sombras suaves definidas en el design system. Genera el código React con Tailwind CSS y componentes Shadcn/ui.

---

## Registro de cambios del documento

| Versión | Fecha     | Descripción del cambio                                                                                                                |
| :------ | :-------- | :------------------------------------------------------------------------------------------------------------------------------------ |
| 1.0     | Mayo 2026 | Creación inicial de la Guía UX/UI para AgenteIA, incluyendo front matter con tokens, secciones canónicas y prompt para Google Stitch. |