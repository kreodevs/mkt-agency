import sharp from '@/shared/media/sharp.util';
import type { ImageGenerationSize } from '../../../shared/social/image-generation-size.util';
import type { AssetDeviceHint } from '../../assets/domain/asset-folder.util';
import {
  buildDeviceShadow,
  renderDeviceFrame,
  resolveDeviceFrameType,
  resolveHeroDevicePlacement,
  resolveProductMockupDeviceHint,
  resolveVisualAspectRatio,
} from '../domain/device-frame-render.util';
import { parseImageSize } from '../domain/visual-template-render.util';
import {
  DEVICE_SCREEN_BACKGROUND,
  resizeScreenshotContain,
  resizeScreenshotCover,
} from '../domain/screenshot-crop.util';
import type { SocialCopyPost } from '../adapters/social-copy.adapter.port';
import type { ArtKitLayoutMode, ArtPromptRecipe } from './art-prompt.types';

const KIT_OVERLAY_BASE =
  'IMPORTANT: Leave clean negative space or an empty panel for a real product screenshot overlay to be composited later. ' +
  'Do NOT generate fake UI, app interfaces, device screens, or mock product screenshots. ' +
  'Create abstract background art only, OR a split layout with an empty device-shaped zone reserved for overlay. ' +
  'The reserved zone must have neutral background with no text or UI elements inside it.';

const PHONE_MOCKUP_HINT =
  'Reserve a prominent empty zone shaped like a modern smartphone in portrait orientation (tall rounded rectangle). ' +
  'No landscape monitor, no wide horizontal panel — only vertical phone silhouette for a mobile app screenshot overlay.';

const LAYOUT_HINTS: Record<ArtKitLayoutMode, string> = {
  mockup:
    'Reserve a prominent empty zone on the center-right for a phone or laptop mockup overlay (device-shaped negative space).',
  'center-panel':
    'Reserve a centered rectangular panel (about 45–55% of canvas width) with neutral fill for screenshot overlay.',
  'split-bottom':
    'Reserve the bottom 40% of the canvas as clean empty space or subtle gradient for a real photo overlay.',
};

export function wantsPhoneDeviceMockup(
  post: Pick<SocialCopyPost, 'visualTemplateId'>,
): boolean {
  const id = post.visualTemplateId?.trim();
  return id === 'product-hero' || id === 'promo-cta';
}

/** Append kit-overlay instructions so IA leaves room for real screenshot compositing. */
export function buildKitOverlayPrompt(
  basePrompt: string,
  recipe: ArtPromptRecipe,
  post?: Pick<SocialCopyPost, 'visualTemplateId' | 'platform'>,
): string {
  const layout = resolveArtKitLayout(recipe, post?.platform ?? 'instagram', post);
  const hint =
    post && wantsPhoneDeviceMockup(post) ? PHONE_MOCKUP_HINT : LAYOUT_HINTS[layout];
  return `${basePrompt.trim()}. ${KIT_OVERLAY_BASE} ${hint}`;
}

/** Resolve compositing layout from recipe family or explicit kitLayout. */
export function resolveArtKitLayout(
  recipe: ArtPromptRecipe,
  _platform: string,
  post?: Pick<SocialCopyPost, 'visualTemplateId'>,
): ArtKitLayoutMode {
  if (post && wantsPhoneDeviceMockup(post)) {
    return 'mockup';
  }

  if (recipe.kitLayout) {
    return recipe.kitLayout;
  }

  const family = recipe.family.toLowerCase();
  if (family.includes('product-hero') || family.startsWith('poster') || family.includes('carousel-dtc')) {
    return 'mockup';
  }
  if (family.includes('infographic') || family.includes('saas-dashboard')) {
    return 'center-panel';
  }
  return 'split-bottom';
}

async function compositeMockupLayout(
  canvas: Buffer,
  photoBuffer: Buffer,
  width: number,
  height: number,
  platform: string,
  device?: AssetDeviceHint | null,
): Promise<Buffer> {
  const size = `${width}x${height}` as ImageGenerationSize;
  const aspectRatio = resolveVisualAspectRatio(size);
  const frameType = resolveDeviceFrameType(platform, aspectRatio, device);
  const placement = resolveHeroDevicePlacement(width, height, frameType, aspectRatio);
  const left = Math.min(
    Math.round(width * 0.58 - placement.frameWidth / 2),
    Math.round(width - placement.frameWidth - width * 0.04),
  );
  const top = placement.top;

  const deviceFrame = await renderDeviceFrame(photoBuffer, {
    ...placement,
    left: Math.max(left, Math.round(width * 0.32)),
    top,
  });
  const shadow = await buildDeviceShadow(placement.frameWidth, placement.frameHeight, 24);
  const shadowLeft = Math.max(left, Math.round(width * 0.32));

  return sharp(canvas)
    .composite([
      { input: shadow, top: top + 8, left: shadowLeft + 4 },
      { input: deviceFrame, top, left: shadowLeft },
    ])
    .png()
    .toBuffer();
}

async function compositeCenterPanelLayout(
  canvas: Buffer,
  photoBuffer: Buffer,
  width: number,
  height: number,
): Promise<Buffer> {
  const panelW = Math.round(width * 0.74);
  const panelH = Math.round(height * 0.46);
  const left = Math.round((width - panelW) / 2);
  const top = Math.round(height * 0.27);
  const inset = 12;

  const photo = await resizeScreenshotContain(
    photoBuffer,
    panelW - inset * 2,
    panelH - inset * 2,
    DEVICE_SCREEN_BACKGROUND,
  );

  const panelSvg = Buffer.from(
    `<svg width="${panelW}" height="${panelH}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${panelW}" height="${panelH}" rx="16" ry="16" fill="rgba(255,255,255,0.94)"/>
      <rect x="1" y="1" width="${panelW - 2}" height="${panelH - 2}" rx="15" ry="15" fill="none" stroke="rgba(0,0,0,0.08)" stroke-width="2"/>
    </svg>`,
  );

  const photoMeta = await sharp(photo).metadata();
  const photoW = photoMeta.width ?? panelW - inset * 2;
  const photoH = photoMeta.height ?? panelH - inset * 2;
  const photoLeft = left + Math.round((panelW - photoW) / 2);
  const photoTop = top + Math.round((panelH - photoH) / 2);

  return sharp(canvas)
    .composite([
      { input: panelSvg, top, left },
      { input: photo, top: photoTop, left: photoLeft },
    ])
    .png()
    .toBuffer();
}

async function compositeSplitBottomLayout(
  canvas: Buffer,
  photoBuffer: Buffer,
  width: number,
  height: number,
): Promise<Buffer> {
  const photoH = Math.round(height * 0.4);
  const photoTop = height - photoH;
  const photo = await resizeScreenshotCover(photoBuffer, width, photoH);

  const fadeH = Math.min(48, Math.round(photoH * 0.15));
  const fadeSvg = Buffer.from(
    `<svg width="${width}" height="${fadeH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="black" stop-opacity="0"/>
          <stop offset="100%" stop-color="black" stop-opacity="0.35"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${fadeH}" fill="url(#fade)"/>
    </svg>`,
  );

  return sharp(canvas)
    .composite([
      { input: photo, top: photoTop, left: 0 },
      { input: fadeSvg, top: photoTop - fadeH, left: 0 },
    ])
    .png()
    .toBuffer();
}

/** Composite a real kit screenshot on top of an IA-generated art background. */
export async function compositeKitOnArtBackground(
  artBuffer: Buffer,
  photoBuffer: Buffer,
  layout: ArtKitLayoutMode,
  size: ImageGenerationSize,
  platform: string,
  device?: AssetDeviceHint | null,
  visualTemplateId?: string | null,
): Promise<Buffer> {
  const effectiveDevice = resolveProductMockupDeviceHint(device, visualTemplateId);
  const effectiveLayout =
    visualTemplateId && wantsPhoneDeviceMockup({ visualTemplateId }) ? 'mockup' : layout;
  const { width, height } = parseImageSize(size);
  const canvas = await sharp(artBuffer)
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();

  if (effectiveLayout === 'mockup') {
    return compositeMockupLayout(canvas, photoBuffer, width, height, platform, effectiveDevice);
  }
  if (effectiveLayout === 'center-panel') {
    return compositeCenterPanelLayout(canvas, photoBuffer, width, height);
  }
  return compositeSplitBottomLayout(canvas, photoBuffer, width, height);
}
