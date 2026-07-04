# Formularios embebidos

Página tenant en `/forms`: listado, creación rápida, asignación de **producto** y panel de snippet JS (`FormSnippet`).

- Al crear o editar un formulario puedes vincularlo a un producto del catálogo.
- El snippet JS incluye `productId` de forma automática (no editable en el embed).
- Los leads capturados heredan `productId` del formulario.
- **Atribución post → lead:** `fields` usa el mismo JSON que DynamicForm (Kreo). La bandeja SOHO copia `/c/:formId?utm_*` con `contentId`; el submit guarda UTM en `lead.metadata`.
- **Captura SOHO:** `GET /forms/capture?productId=` crea o reutiliza el formulario activo del producto.

Servicio: `src/services/forms.ts`. Página pública: `src/pages/capture/PublicCapturePage.tsx`.
