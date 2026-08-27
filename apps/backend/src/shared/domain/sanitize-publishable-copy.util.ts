/**
 * Quita marcadores de tiempo de guion de video (ej. "(0:00-0:05)")
 * que el LLM a veces incluye y el TTS lee en voz alta.
 */
export function stripVideoTimeMarkers(text: string): string {
  return text
    .replace(
      /\s*\(\s*\d{1,2}:\d{2}(?::\d{2})?\s*[-–—]\s*\d{1,2}:\d{2}(?::\d{2})?\s*\)\s*/g,
      ' ',
    )
    .replace(
      /\s*\[\s*\d{1,2}:\d{2}(?::\d{2})?\s*[-–—]\s*\d{1,2}:\d{2}(?::\d{2})?\s*\]\s*/g,
      ' ',
    )
    .replace(
      /(?:^|\n)\s*\d{1,2}:\d{2}(?::\d{2})?\s*[-–—]\s*\d{1,2}:\d{2}(?::\d{2})?\s*/g,
      (match) => (match.startsWith('\n') ? '\n' : ''),
    );
}

/**
 * Quita indicaciones de producción del copy (ej. "(mostrar fotos desordenadas)")
 * que el LLM a veces deja en el texto publicable.
 */
export function sanitizePublishableCopy(text: string): string {
  if (!text?.trim()) {
    return '';
  }

  let result = stripVideoTimeMarkers(text);

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
