import { execFile } from 'child_process';
import * as fs from 'fs';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

let cachedFfmpegPath: string | null | undefined;

export const FFMPEG_UNAVAILABLE_MESSAGE =
  'FFmpeg no está instalado en el servidor. Redeploy del API/worker con FFmpeg en la imagen Docker (ver Dockerfile.api).';

/**
 * Resuelve el binario de FFmpeg (cacheado). Orden: FFMPEG_PATH → rutas comunes → PATH.
 */
export async function resolveFfmpegPath(): Promise<string | null> {
  if (cachedFfmpegPath !== undefined) {
    return cachedFfmpegPath;
  }

  const candidates = [
    process.env.FFMPEG_PATH?.trim(),
    '/usr/bin/ffmpeg',
    '/usr/local/bin/ffmpeg',
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    if (await isExecutableFfmpeg(candidate)) {
      cachedFfmpegPath = candidate;
      return candidate;
    }
  }

  try {
    const { stdout } = await execFileAsync('which', ['ffmpeg']);
    const resolved = stdout.trim();
    if (resolved && (await isExecutableFfmpeg(resolved))) {
      cachedFfmpegPath = resolved;
      return resolved;
    }
  } catch {
    // not in PATH
  }

  cachedFfmpegPath = null;
  return null;
}

export async function isFfmpegAvailable(): Promise<boolean> {
  return (await resolveFfmpegPath()) !== null;
}

async function isExecutableFfmpeg(binaryPath: string): Promise<boolean> {
  try {
    await fs.promises.access(binaryPath, fs.constants.X_OK);
    await execFileAsync(binaryPath, ['-version']);
    return true;
  } catch {
    return false;
  }
}
