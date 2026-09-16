import { execFile } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';
import { resolveFfmpegPath } from './video-ffmpeg.util';

const execFileAsync = promisify(execFile);

export interface VideoLogoOverlayInput {
  videoBuffer: Buffer;
  logoPng: Buffer;
  /** Fraction of min(width, height) for logo width — matches image branding (~0.18). */
  logoScale?: number;
  /** Fraction of min(width, height) for corner padding. */
  paddingRatio?: number;
}

async function probeVideoSize(videoPath: string): Promise<{ width: number; height: number }> {
  const ffmpeg = await resolveFfmpegPath();
  if (!ffmpeg) {
    return { width: 1080, height: 1920 };
  }

  try {
    const { stderr } = await execFileAsync(ffmpeg, [
      '-hide_banner',
      '-i',
      videoPath,
      '-f',
      'null',
      '-',
    ]);
    const match = stderr.match(/,\s*(\d{2,5})x(\d{2,5})(?:\s|,|\])/);
    if (match) {
      return { width: Number(match[1]), height: Number(match[2]) };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const match = message.match(/,\s*(\d{2,5})x(\d{2,5})(?:\s|,|\])/);
    if (match) {
      return { width: Number(match[1]), height: Number(match[2]) };
    }
  }

  return { width: 1080, height: 1920 };
}

/**
 * Burn product logo on top-left of a video (same corner as static image branding).
 * Returns null when FFmpeg is unavailable or overlay fails.
 */
export async function applyLogoOverlayToVideo(
  input: VideoLogoOverlayInput,
): Promise<Buffer | null> {
  const ffmpeg = await resolveFfmpegPath();
  if (!ffmpeg) {
    return null;
  }

  const logoScale = input.logoScale ?? 0.18;
  const paddingRatio = input.paddingRatio ?? 0.04;
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'video-logo-'));

  try {
    const videoPath = path.join(tempDir, 'input.mp4');
    const logoPath = path.join(tempDir, 'logo.png');
    const outputPath = path.join(tempDir, 'output.mp4');
    await fs.promises.writeFile(videoPath, input.videoBuffer);
    await fs.promises.writeFile(logoPath, input.logoPng);

    const { width, height } = await probeVideoSize(videoPath);
    const padding = Math.max(12, Math.round(Math.min(width, height) * paddingRatio));
    const logoWidth = Math.max(96, Math.round(Math.min(width, height) * logoScale));

    const filter = [
      `[1:v]scale=${logoWidth}:-1,format=rgba[logo]`,
      `[0:v][logo]overlay=${padding}:${padding}:format=auto,format=yuv420p[v]`,
    ].join(';');

    await execFileAsync(ffmpeg, [
      '-i',
      videoPath,
      '-i',
      logoPath,
      '-filter_complex',
      filter,
      '-map',
      '[v]',
      '-map',
      '0:a?',
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'copy',
      '-y',
      outputPath,
    ]);

    return await fs.promises.readFile(outputPath);
  } catch {
    return null;
  } finally {
    await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
