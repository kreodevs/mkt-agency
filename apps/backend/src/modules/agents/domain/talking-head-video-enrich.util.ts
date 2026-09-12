import { execFile } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';
import { resolveFfmpegPath } from './video-ffmpeg.util';

const execFileAsync = promisify(execFile);

export interface TalkingHeadEnrichInput {
  talkingHeadVideo: Buffer;
  /** Captura para intro (y PiP si solo hay una). */
  introScreenshot: Buffer;
  /** Captura opcional distinta para PiP durante el talking-head. */
  pipScreenshot?: Buffer | null;
  outputWidth?: number;
  outputHeight?: number;
  introDurationSec?: number;
}

export interface TalkingHeadEnrichResult {
  buffer: Buffer;
  enriched: true;
  introSeconds: number;
  pipApplied: boolean;
}

async function runFfmpeg(args: string[]): Promise<void> {
  const ffmpeg = await resolveFfmpegPath();
  if (!ffmpeg) {
    throw new Error('FFmpeg no disponible');
  }
  await execFileAsync(ffmpeg, args);
}

function verticalPadFilter(width: number, height: number): string {
  return `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black`;
}

/**
 * Intro de producto (zoom suave) + talking-head con captura Oraltrack en PiP.
 * Devuelve null si FFmpeg no está o falla el enriquecimiento (el caller usa el video original).
 */
export async function enrichTalkingHeadWithProductMedia(
  input: TalkingHeadEnrichInput,
): Promise<TalkingHeadEnrichResult | null> {
  const ffmpeg = await resolveFfmpegPath();
  if (!ffmpeg) {
    return null;
  }

  const width = input.outputWidth ?? 1080;
  const height = input.outputHeight ?? 1920;
  const introSeconds = input.introDurationSec ?? 2.8;
  const introFrames = Math.max(24, Math.round(introSeconds * 30));
  const pipSource = input.pipScreenshot ?? input.introScreenshot;
  const pipWidth = Math.round(width * 0.4);

  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'th-enrich-'));

  try {
    const talkingPath = path.join(tempDir, 'talking.mp4');
    const introImagePath = path.join(tempDir, 'intro.png');
    const pipImagePath = path.join(tempDir, 'pip.png');
    const introPath = path.join(tempDir, 'intro.mp4');
    const talkingPipPath = path.join(tempDir, 'talking_pip.mp4');
    const outputPath = path.join(tempDir, 'final.mp4');

    await fs.promises.writeFile(talkingPath, input.talkingHeadVideo);
    await fs.promises.writeFile(introImagePath, input.introScreenshot);
    await fs.promises.writeFile(pipImagePath, pipSource);

    const introZoom = `zoompan=z='min(zoom+0.0012,1.1)':d=${introFrames}:s=${width}x${height}:fps=30`;
    await runFfmpeg([
      '-loop',
      '1',
      '-i',
      introImagePath,
      '-f',
      'lavfi',
      '-i',
      'anullsrc=channel_layout=stereo:sample_rate=44100',
      '-t',
      String(introSeconds),
      '-vf',
      `${verticalPadFilter(width, height)},${introZoom}`,
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-shortest',
      '-y',
      introPath,
    ]);

    const pipTop = height - Math.round(pipWidth * 1.55) - 72;
    const pipLeft = width - pipWidth - 40;
    const talkingFilter = [
      `[0:v]${verticalPadFilter(width, height)},setsar=1[base]`,
      `[1:v]scale=${pipWidth}:-1,format=rgba,colorchannelmixer=aa=0.96,pad=${pipWidth + 16}:${Math.round(pipWidth * 1.55) + 16}:8:8:color=0x00000000[pip]`,
      `[base][pip]overlay=${pipLeft}:${pipTop}[vout]`,
    ].join(';');

    await runFfmpeg([
      '-i',
      talkingPath,
      '-i',
      pipImagePath,
      '-filter_complex',
      talkingFilter,
      '-map',
      '[vout]',
      '-map',
      '0:a?',
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-y',
      talkingPipPath,
    ]);

    await runFfmpeg([
      '-i',
      introPath,
      '-i',
      talkingPipPath,
      '-filter_complex',
      `[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]`,
      '-map',
      '[v]',
      '-map',
      '[a]',
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-y',
      outputPath,
    ]);

    const buffer = await fs.promises.readFile(outputPath);
    return {
      buffer,
      enriched: true,
      introSeconds,
      pipApplied: true,
    };
  } catch {
    return null;
  } finally {
    await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
