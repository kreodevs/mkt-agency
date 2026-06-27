/**
 * Resolves DB password from env. Supports legacy DB_PASS (infra.md).
 * Treats empty strings as unset so Nest/docker defaults stay aligned.
 */
export function resolveDatabasePassword(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const password = env.DB_PASSWORD?.trim() || env.DB_PASS?.trim();
  return password || 'change_me';
}

export function resolveDatabaseUser(env: NodeJS.ProcessEnv = process.env): string {
  return env.DB_USER?.trim() || 'mktos';
}

export function resolveDatabaseName(env: NodeJS.ProcessEnv = process.env): string {
  return env.DB_NAME?.trim() || 'mktos';
}
