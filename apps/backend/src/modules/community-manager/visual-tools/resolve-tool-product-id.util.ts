const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resuelve un ID de producto válido (UUID v4) para las herramientas de CM.
 * Si el LLM envía el nombre del producto (p. ej. "Oraltrack") o una cadena no-UUID,
 * descarta la cadena inválida y utiliza el `ctxProductId` del contexto de ejecución.
 */
export function resolveToolProductId(
  rawInput: unknown,
  fallbackCtxProductId?: string | null,
): string | null {
  if (typeof rawInput === 'string' && UUID_REGEX.test(rawInput.trim())) {
    return rawInput.trim();
  }
  if (typeof fallbackCtxProductId === 'string' && UUID_REGEX.test(fallbackCtxProductId.trim())) {
    return fallbackCtxProductId.trim();
  }
  return null;
}
