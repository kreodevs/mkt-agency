import sharp from '@/shared/media/sharp.util';
import { isCmPlatform } from '../../../shared/social/image-destination-formats.util';
import type { ImageGenerationSize } from '../../../shared/social/image-generation-size.util';
import type { AssetDeviceHint } from '../../assets/domain/asset-folder.util';
import { resizeScreenshotCover } from './screenshot-crop.util';

export type VisualAspectRatio = 'square' | 'vertical';
export type DeviceFrameType = 'macbook' | 'iphone' | 'ipad';

export interface DevicePlacement {
  frameType: DeviceFrameType;
  frameWidth: number;
  frameHeight: number;
  left: number;
  top: number;
}

function parseSize(size: ImageGenerationSize): { width: number; height: number } {
  const [widthRaw, heightRaw] = size.split('x');
  return {
    width: Number(widthRaw) || 1080,
    height: Number(heightRaw) || 1080,
  };
}

export function resolveVisualAspectRatio(size: ImageGenerationSize): VisualAspectRatio {
  const { width, height } = parseSize(size);
  return height > width * 1.12 ? 'vertical' : 'square';
}

/** Marco según captura del media kit; si no hay hint, por plataforma. */
export function resolveDeviceFrameType(
  platform: string | null | undefined,
  aspectRatio: VisualAspectRatio,
  screenshotDevice?: AssetDeviceHint | null,
): DeviceFrameType {
  if (screenshotDevice === 'pc') {
    return 'macbook';
  }
  if (screenshotDevice === 'ipad') {
    return 'ipad';
  }
  if (screenshotDevice === 'ios') {
    return 'iphone';
  }

  if (platform === 'linkedin' || platform === 'twitter') {
    return 'macbook';
  }
  if (platform === 'tiktok' || platform === 'instagram' || platform === 'facebook') {
    return 'iphone';
  }
  if (isCmPlatform(platform) && aspectRatio === 'vertical') {
    return 'iphone';
  }
  return aspectRatio === 'vertical' ? 'iphone' : 'macbook';
}

export function resolveDevicePlacement(
  canvasWidth: number,
  canvasHeight: number,
  frameType: DeviceFrameType,
  aspectRatio: VisualAspectRatio,
): DevicePlacement {
  if (frameType === 'iphone') {
    const frameWidth =
      aspectRatio === 'vertical'
        ? Math.round(canvasWidth * 0.58)
        : Math.round(canvasWidth * 0.4);
    const frameHeight = Math.round(frameWidth * 2.08);
    const maxHeight = Math.round(canvasHeight * (aspectRatio === 'vertical' ? 0.52 : 0.46));
    const scaledHeight = Math.min(frameHeight, maxHeight);
    const scaledWidth = Math.round(scaledHeight / 2.08);
    return {
      frameType,
      frameWidth: scaledWidth,
      frameHeight: scaledHeight,
      left: Math.round((canvasWidth - scaledWidth) / 2),
      top: Math.round(canvasHeight * (aspectRatio === 'vertical' ? 0.07 : 0.05)),
    };
  }

  if (frameType === 'ipad') {
    const frameWidth = Math.round(canvasWidth * (aspectRatio === 'vertical' ? 0.72 : 0.56));
    const frameHeight = Math.round(frameWidth * 1.35);
    const maxHeight = Math.round(canvasHeight * (aspectRatio === 'vertical' ? 0.5 : 0.44));
    const scaledHeight = Math.min(frameHeight, maxHeight);
    const scaledWidth = Math.round(scaledHeight / 1.35);
    return {
      frameType: 'ipad',
      frameWidth: scaledWidth,
      frameHeight: scaledHeight,
      left: Math.round((canvasWidth - scaledWidth) / 2),
      top: Math.round(canvasHeight * (aspectRatio === 'vertical' ? 0.06 : 0.05)),
    };
  }

  const frameWidth = Math.round(canvasWidth * (aspectRatio === 'vertical' ? 0.88 : 0.82));
  const frameHeight = Math.round(
    frameWidth * (aspectRatio === 'vertical' ? 0.52 : 0.58),
  );
  return {
    frameType: 'macbook',
    frameWidth,
    frameHeight,
    left: Math.round((canvasWidth - frameWidth) / 2),
    top: Math.round(canvasHeight * (aspectRatio === 'vertical' ? 0.06 : 0.05)),
  };
}

async function applyRoundedCorners(
  input: Buffer,
  width: number,
  height: number,
  radius: number,
): Promise<Buffer> {
  const mask = Buffer.from(
    `<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="white"/></svg>`,
  );
  return sharp(input).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
}

async function renderIphoneFrame(
  photoBuffer: Buffer,
  frameWidth: number,
  frameHeight: number,
): Promise<Buffer> {
  const bezelX = Math.round(frameWidth * 0.065);
  const bezelTop = Math.round(frameHeight * 0.042);
  const bezelBottom = Math.round(frameHeight * 0.038);
  const screenW = frameWidth - bezelX * 2;
  const screenH = frameHeight - bezelTop - bezelBottom;
  const bodyRadius = Math.round(frameWidth * 0.13);
  const screenRadius = Math.round(bodyRadius * 0.72);

  let screen = await resizeScreenshotCover(photoBuffer, screenW, screenH);
  screen = await applyRoundedCorners(screen, screenW, screenH, screenRadius);

  const bodySvg = Buffer.from(
    `<svg width="${frameWidth}" height="${frameHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3a3a3c"/>
          <stop offset="100%" stop-color="#1c1c1e"/>
        </linearGradient>
      </defs>
      <rect width="${frameWidth}" height="${frameHeight}" rx="${bodyRadius}" fill="url(#body)"/>
      <rect x="${bezelX - 1}" y="${bezelTop - 1}" width="${screenW + 2}" height="${screenH + 2}" rx="${screenRadius + 1}" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2"/>
    </svg>`,
  );

  const notchW = Math.min(96, Math.round(screenW * 0.34));
  const notchH = Math.round(screenH * 0.038);
  const notchSvg = Buffer.from(
    `<svg width="${screenW}" height="${notchH + 6}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${Math.round((screenW - notchW) / 2)}" y="6" width="${notchW}" height="${notchH}" rx="${Math.round(notchH / 2)}" fill="#0a0a0a"/>
    </svg>`,
  );

  const homeBarW = Math.round(screenW * 0.36);
  const homeBarH = 4;
  const homeSvg = Buffer.from(
    `<svg width="${screenW}" height="16" xmlns="http://www.w3.org/2000/svg">
      <rect x="${Math.round((screenW - homeBarW) / 2)}" y="8" width="${homeBarW}" height="${homeBarH}" rx="2" fill="rgba(255,255,255,0.45)"/>
    </svg>`,
  );

  return sharp(bodySvg)
    .composite([
      { input: screen, top: bezelTop, left: bezelX },
      { input: notchSvg, top: bezelTop, left: bezelX },
      { input: homeSvg, top: bezelTop + screenH - 16, left: bezelX },
    ])
    .png()
    .toBuffer();
}

async function renderMacbookFrame(
  photoBuffer: Buffer,
  frameWidth: number,
  frameHeight: number,
): Promise<Buffer> {
  const baseH = Math.round(frameHeight * 0.1);
  const lidH = frameHeight - baseH;
  const bezel = Math.round(frameWidth * 0.034);
  const screenW = frameWidth - bezel * 2;
  const screenH = lidH - bezel - Math.round(lidH * 0.045);
  const lidRadius = Math.round(frameWidth * 0.022);
  const screenRadius = Math.round(lidRadius * 0.65);

  let screen = await resizeScreenshotCover(photoBuffer, screenW, screenH);
  screen = await applyRoundedCorners(screen, screenW, screenH, screenRadius);

  const lidSvg = Buffer.from(
    `<svg width="${frameWidth}" height="${lidH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#4a4a4c"/>
          <stop offset="100%" stop-color="#2c2c2e"/>
        </linearGradient>
      </defs>
      <rect width="${frameWidth}" height="${lidH}" rx="${lidRadius}" fill="url(#lid)"/>
      <circle cx="${Math.round(frameWidth / 2)}" cy="${bezel + 8}" r="3" fill="#1a1a1a" opacity="0.7"/>
      <rect x="${bezel - 1}" y="${bezel - 1}" width="${screenW + 2}" height="${screenH + 2}" rx="${screenRadius + 1}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2"/>
    </svg>`,
  );

  const baseSvg = Buffer.from(
    `<svg width="${frameWidth}" height="${baseH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="base" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3a3a3c"/>
          <stop offset="100%" stop-color="#252527"/>
        </linearGradient>
      </defs>
      <path d="M ${Math.round(frameWidth * 0.08)} 0 L ${Math.round(frameWidth * 0.92)} 0 L ${frameWidth} ${baseH} L 0 ${baseH} Z" fill="url(#base)"/>
      <rect x="${Math.round(frameWidth * 0.46)}" y="${Math.round(baseH * 0.25)}" width="${Math.round(frameWidth * 0.08)}" height="3" rx="1.5" fill="rgba(255,255,255,0.15)"/>
    </svg>`,
  );

  const lidWithScreen = await sharp(lidSvg)
    .composite([{ input: screen, top: bezel, left: bezel }])
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: frameWidth,
      height: frameHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: lidWithScreen, top: 0, left: 0 },
      { input: baseSvg, top: lidH, left: 0 },
    ])
    .png()
    .toBuffer();
}

async function renderIpadFrame(
  photoBuffer: Buffer,
  frameWidth: number,
  frameHeight: number,
): Promise<Buffer> {
  const bezelX = Math.round(frameWidth * 0.05);
  const bezelTop = Math.round(frameHeight * 0.04);
  const bezelBottom = Math.round(frameHeight * 0.04);
  const screenW = frameWidth - bezelX * 2;
  const screenH = frameHeight - bezelTop - bezelBottom;
  const bodyRadius = Math.round(frameWidth * 0.06);
  const screenRadius = Math.round(bodyRadius * 0.55);

  let screen = await resizeScreenshotCover(photoBuffer, screenW, screenH);
  screen = await applyRoundedCorners(screen, screenW, screenH, screenRadius);

  const bodySvg = Buffer.from(
    `<svg width="${frameWidth}" height="${frameHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ipadBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#48484a"/>
          <stop offset="100%" stop-color="#2c2c2e"/>
        </linearGradient>
      </defs>
      <rect width="${frameWidth}" height="${frameHeight}" rx="${bodyRadius}" fill="url(#ipadBody)"/>
      <rect x="${bezelX - 1}" y="${bezelTop - 1}" width="${screenW + 2}" height="${screenH + 2}" rx="${screenRadius + 1}" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="2"/>
      <circle cx="${Math.round(frameWidth / 2)}" cy="${Math.round(frameHeight * 0.97)}" r="3" fill="rgba(255,255,255,0.35)"/>
    </svg>`,
  );

  return sharp(bodySvg)
    .composite([{ input: screen, top: bezelTop, left: bezelX }])
    .png()
    .toBuffer();
}

export async function buildDeviceShadow(
  width: number,
  height: number,
  radius: number,
): Promise<Buffer> {
  const svg = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="14" width="${width - 20}" height="${height - 14}" rx="${radius}" ry="${radius}" fill="rgba(0,0,0,0.38)"/>
    </svg>`,
  );
  return sharp(svg).blur(10).png().toBuffer();
}

export async function renderDeviceFrame(
  photoBuffer: Buffer,
  placement: DevicePlacement,
): Promise<Buffer> {
  if (placement.frameType === 'macbook') {
    return renderMacbookFrame(photoBuffer, placement.frameWidth, placement.frameHeight);
  }
  if (placement.frameType === 'ipad') {
    return renderIpadFrame(photoBuffer, placement.frameWidth, placement.frameHeight);
  }
  return renderIphoneFrame(photoBuffer, placement.frameWidth, placement.frameHeight);
}

/** Miniatura con marco de dispositivo para layouts quote/stat. */
export async function renderMiniDeviceThumbnail(
  photoBuffer: Buffer,
  thumbW: number,
  thumbH: number,
  platform: string | null | undefined,
  screenshotDevice?: AssetDeviceHint | null,
  aspectRatio: VisualAspectRatio = 'square',
): Promise<Buffer> {
  const frameType = resolveDeviceFrameType(platform, aspectRatio, screenshotDevice);
  return renderDeviceFrame(photoBuffer, {
    frameType,
    frameWidth: thumbW,
    frameHeight: thumbH,
    left: 0,
    top: 0,
  });
}
