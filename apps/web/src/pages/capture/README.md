# Captura pública (`/c/:formId`)

Página sin autenticación que renderiza el JSON `fields` del formulario y envía a `POST /api/v1/forms/:id/submit`.

UI pública con tokens Kreo (`--radius-md`, `--spacing-*`).

- Lee UTM y `contentId` de la query string (`parseCaptureAttributionFromSearch`).
- Mismo contrato JSON que **DynamicForm** de Kreo (`FormFieldDefinition[]`); la bandeja SOHO genera links con atribución vía `buildCapturePageUrl`.
- El editor agencia sigue en `/forms`; SOHO usa `GET /forms/capture?productId=` para obtener o crear el formulario de captura.

Servicios: `src/services/forms.ts`, util `src/lib/capture-attribution.ts`.
