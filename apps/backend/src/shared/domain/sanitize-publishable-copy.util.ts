/**
 * Quita indicaciones de producción del copy (ej. "(mostrar fotos desordenadas)")
 * que el LLM a veces deja en el texto publicable.
 */
export function sanitizePublishableCopy(text: string): string {
  if (!text?.trim()) {
    return '';
  }

  let result = text;

  // Paréntesis con verbos de dirección visual / escena
  result = result.replace(
    /\s*\((?:mostrar|ver|insertar|colocar|poner|agregar|añadir|incluir|usar)[^)]{0,120}\)/gi,
    '',
  );

  // Asteriscos tipo *(mostrar video)*
  result = result.replace(
    /\*\s*\((?:mostrar|ver)[^)]{0,80}\)\s*\*/gi,
    '',
  );

  // Líneas que son solo direcciones de escena
  result = result.replace(
    /^\s*(?:\[|\()? *(?:mostrar|ver|insertar|colocar|poner|agregar|añadir|incluir|usar)[^\n]{0,120}(?:\]|\))?\s*$/gim,
    '',
  );

  // Espacios y saltos sobrantes
  result = result.replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ').trim();

  return result;
}
