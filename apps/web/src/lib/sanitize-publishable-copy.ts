/** Espejo frontend de sanitize-publishable-copy.util.ts (backend). */
export function sanitizePublishableCopy(text: string): string {
  if (!text?.trim()) {
    return '';
  }

  let result = text;

  result = result.replace(
    /\s*\((?:mostrar|ver|insertar|colocar|poner|agregar|añadir|incluir|usar)[^)]{0,120}\)/gi,
    '',
  );
  result = result.replace(
    /\*\s*\((?:mostrar|ver)[^)]{0,80}\)\s*\*/gi,
    '',
  );
  result = result.replace(
    /^\s*(?:\[|\()? *(?:mostrar|ver|insertar|colocar|poner|agregar|añadir|incluir|usar)[^\n]{0,120}(?:\]|\))?\s*$/gim,
    '',
  );
  result = result.replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ').trim();

  return result;
}
