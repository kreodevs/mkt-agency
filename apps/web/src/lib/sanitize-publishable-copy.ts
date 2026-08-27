/** Espejo frontend de sanitize-publishable-copy.util.ts (backend). */
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

export function sanitizePublishableCopy(text: string): string {
  if (!text?.trim()) {
    return '';
  }

  let result = stripVideoTimeMarkers(text);

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
