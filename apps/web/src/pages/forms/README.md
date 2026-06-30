# Formularios embebidos

Página tenant en `/forms`: listado, creación rápida, asignación de **producto** y panel de snippet JS (`FormSnippet`).

- Al crear o editar un formulario puedes vincularlo a un producto del catálogo.
- El snippet JS incluye `productId` de forma automática (no editable en el embed).
- Los leads capturados heredan `productId` del formulario.

Servicio: `src/services/forms.ts`.
